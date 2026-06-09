"""
Translation service – automatic translation of CV and Project content
using Google Gemini API.

Called periodically by the APScheduler job.  When a CV or project is
saved by the admin, ``has_changes`` is set to True.  This routine
picks up those records, translates them into every other supported
language, and resets the flag.
"""

import json
import logging
import asyncio
import os
from typing import Dict, List, Sequence

from sqlalchemy import text

from ..core.config import get_settings
from ..db.crud import cv as cv_crud, project as project_crud
from ..db.session import AsyncSessionLocal, async_engine

logger = logging.getLogger(__name__)

settings = get_settings()

# google-adk / google-genai authenticate via the GOOGLE_API_KEY *environment*
# variable. pydantic reads .env into ``settings`` but does NOT export to
# os.environ, and there is no load_dotenv(), so make sure the key is present in
# the process env for the ADK client (no-op under docker-compose env_file).
if settings.gemini.api_key:
    os.environ.setdefault("GOOGLE_API_KEY", settings.gemini.api_key)
    os.environ.setdefault("GOOGLE_GENAI_USE_VERTEXAI", "FALSE")

# Human-readable names for the system prompt
_LANG_NAMES: Dict[str, str] = {
    "en": "English",
    "de": "German",
    "vi": "Vietnamese",
    "fr": "French",
    "it": "Italian",
    "zh": "Chinese",
    "ja": "Japanese",
    "es": "Spanish",
    "pt": "Portuguese",
}


# ---------------------------------------------------------------------------
# Gemini helpers
# ---------------------------------------------------------------------------

def _get_agent(system_instruction: str, output_schema: type = None):
    """Initialise a google-adk Agent."""
    from google.adk.agents.llm_agent import Agent
    from google.genai import types

    kwargs = {
        "name": "translator_agent",
        "model": settings.gemini.model,
        "instruction": system_instruction,
    }
    
    if output_schema:
        kwargs["output_schema"] = output_schema
    else:
        kwargs["generate_content_config"] = types.GenerateContentConfig(
            response_mime_type="application/json"
        )
        
    return Agent(**kwargs)


# Removed OutputTranslatedCV because Gemini doesn't support additionalProperties for Dict[str, Any]

async def translate_cv_data(
    source_data: dict,
    source_lang: str,
    target_lang: str,
) -> dict:
    """Translate the full CV JSON blob from *source_lang* → *target_lang*."""
    # ADK uses different typing if needed

    src = _LANG_NAMES.get(source_lang, source_lang)
    tgt = _LANG_NAMES.get(target_lang, target_lang)

    system_prompt = (
        f"You are a professional CV/resume translator.\n"
        f"Translate the following CV data from {src} to {tgt}.\n\n"
        "Rules:\n"
        "- Preserve the exact JSON structure and all keys (keys stay in English).\n"
        "- Translate text content: summary, role/position descriptions, degree names, "
        "detail texts, headerText, title (job title), award details, volunteering details.\n"
        "- DO NOT translate: company names, institution names, organisation names, "
        "project names, people's names.\n"
        "- DO NOT translate: dates, time periods, URLs, email addresses, "
        "platform identifiers (github, linkedin, …).\n"
        "- DO NOT translate: skill names, programming languages, technology names.\n"
        "Please return a valid JSON object with exactly one key 'cv_data', containing the fully translated dictionary."
    )

    logger.info(f"[translation] [Gemini ADK] Initiating async run for CV {source_lang} -> {target_lang}")
    agent = _get_agent(system_prompt) # Use raw JSON mime-type instead of schema constraint
    try:
        from google.adk.runners import Runner
        from google.adk.sessions import InMemorySessionService
        from google.genai import types

        session_service = InMemorySessionService()
        try:
            await session_service.create_session(app_name="transl", user_id="system", session_id="cv_translation")
        except Exception:
            # InMemorySessionService might raise if session already exists, though Docs state we can just get or create
            pass
        
        runner = Runner(agent=agent, app_name="transl", session_service=session_service)
        content = types.Content(role="user", parts=[types.Part(text=json.dumps(source_data, ensure_ascii=False))])
        
        final_text = ""
        # Native async loop for ADK
        async for event in runner.run_async(user_id="system", session_id="cv_translation", new_message=content):
            if event.is_final_response() and event.content and event.content.parts:
                final_text = event.content.parts[0].text.strip()
                
        if not final_text:
            raise ValueError("No final response text received from ADK runner.")
            
        logger.info(f"[translation] [Gemini ADK] async run succeeded for CV {source_lang} -> {target_lang}")
        
        stripped_text = final_text.strip()
        if stripped_text.startswith("```json"):
            stripped_text = stripped_text[7:]
        if stripped_text.endswith("```"):
            stripped_text = stripped_text[:-3]
        parsed = json.loads(stripped_text.strip())
        # Model may wrap the result in {"cv_data": {...}} or return the dict directly.
        if isinstance(parsed, dict):
            return parsed.get("cv_data", parsed)
        return parsed

    except Exception as e:
        if "RESOURCE_EXHAUSTED" in str(e) or "429" in str(e):
            logger.error(f"[translation] Gemini API 429 Quota Exhausted: {e}")
            raise
        logger.error(f"[translation] Gemini API Error during CV translation: {e}")
        raise





async def translate_projects_batch(
    projects: List[dict],
    source_lang: str,
    target_lang: str,
) -> List[dict]:
    # ADK uses different typing if needed

    src = _LANG_NAMES.get(source_lang, source_lang)
    tgt = _LANG_NAMES.get(target_lang, target_lang)

    items = [
        {
            "id": p["id"],
            "title": p["title"],
            "description": p["description"] or "",
        }
        for p in projects
    ]

    system_prompt = (
        f"You are a professional translator for software project descriptions.\n"
        f"Translate the following project data from {src} to {tgt}.\n\n"
        "Rules:\n"
        "- Translate the \"title\" and \"description\" fields.\n"
        "- Keep the \"id\" of each item unchanged (same integer value as the input).\n"
        "Please return a valid JSON object with exactly one key 'projects', containing the array of translated items."
    )

    logger.info(f"[translation] [Gemini ADK] Initiating async run for {len(projects)} Projects {source_lang} -> {target_lang}")
    agent = _get_agent(system_prompt)
    try:
        from google.adk.runners import Runner
        from google.adk.sessions import InMemorySessionService
        from google.genai import types

        session_service = InMemorySessionService()
        try:
            await session_service.create_session(app_name="transl", user_id="system", session_id="project_translation")
        except Exception:
            pass
        
        runner = Runner(agent=agent, app_name="transl", session_service=session_service)
        content = types.Content(role="user", parts=[types.Part(text=json.dumps(items, ensure_ascii=False))])
        
        final_text = ""
        # Native async loop for ADK
        async for event in runner.run_async(user_id="system", session_id="project_translation", new_message=content):
            if event.is_final_response() and event.content and event.content.parts:
                final_text = event.content.parts[0].text.strip()
                
        if not final_text:
            raise ValueError("No final response text received from ADK runner.")
        
        logger.info(f"[translation] [Gemini ADK] async run succeeded for {len(projects)} Projects {source_lang} -> {target_lang}")
        
        stripped_text = final_text.strip()
        if stripped_text.startswith("```json"):
            stripped_text = stripped_text[7:]
        if stripped_text.endswith("```"):
            stripped_text = stripped_text[:-3]
        parsed = json.loads(stripped_text.strip())
        # Model may return {"projects": [...]} or a bare [...] array.
        if isinstance(parsed, dict):
            return parsed.get("projects", [])
        if isinstance(parsed, list):
            return parsed
        return []

    except Exception as e:
        if "RESOURCE_EXHAUSTED" in str(e) or "429" in str(e):
            logger.error(f"[translation] Gemini API 429 Quota Exhausted: {e}")
            raise
        logger.error(f"[translation] Gemini API Error during Project translation: {e}")
        raise


# ---------------------------------------------------------------------------
# Main scheduler routine
# ---------------------------------------------------------------------------

async def run_translation_sync() -> None:
    """Check for pending changes and translate them.

    Called by APScheduler every N minutes (see ``lifespan.py``).
    """
    if not settings.gemini.api_key:
        logger.warning("[translation] Gemini API key not configured, skipping translation sync.")
        return

    supported = settings.translation.supported_languages
    logger.info("[translation] Starting translation sync …")

    # Advisory lock on a DEDICATED connection, held for the whole run.
    # Session-level advisory locks are bound to one physical connection; the
    # sessions below commit repeatedly (which can return their connection to the
    # pool), so the lock must live on its own connection that we never reuse for
    # queries. pg_try_advisory_lock is non-blocking: if another uvicorn instance
    # already holds it, we skip this run instead of piling up.
    lock_conn = await async_engine.connect()
    got_lock = await lock_conn.scalar(text("SELECT pg_try_advisory_lock(1234567890)"))
    if not got_lock:
        logger.info("[translation] Another instance holds the translation lock, skipping this run.")
        await lock_conn.close()
        return
    logger.info("[translation] Advisory lock acquired.")

    async with AsyncSessionLocal() as db:
        try:
            # Nach Lock: Nochmals prüfen, ob Übersetzungen ausstehen
            changed_cvs = await cv_crud.get_cvs_with_changes(db)
            logger.info(f"[translation] Found {len(changed_cvs) if changed_cvs else 0} CVs with changes.")
            
            changed_projects: Sequence = await project_crud.get_projects_with_changes(db)
            logger.info(f"[translation] Found {len(changed_projects) if changed_projects else 0} projects with changes.")
            
            if not changed_cvs and not changed_projects:
                logger.info("[translation] No pending translations after lock.")
                return

            # ── CV translation ──────────────────────────────────────────
            async def _process_cv_target(cv_data: dict, owner_id: int, src: str, tgt: str):
                translated_data = await translate_cv_data(cv_data, src, tgt)
                async with AsyncSessionLocal() as db_session:
                    await cv_crud.upsert_cv(
                        db_session,
                        data=translated_data,
                        owner_id=owner_id,
                        language=tgt,
                        has_changes=False,
                    )
                logger.info("[translation] CV translated %s → %s", src, tgt)
                return True

            for cv in changed_cvs:
                source_lang = cv.language
                logger.info("[translation] Translating CV from '%s' concurrently", source_lang)

                tasks = []
                for target_lang in supported:
                    if target_lang == source_lang:
                        continue
                    # Pass extracted scalar values instead of the detached ORM model to prevent lazy loading errors in other thread
                    tasks.append(_process_cv_target(cv.data, cv.owner_id, source_lang, target_lang))

                results = await asyncio.gather(*tasks, return_exceptions=True)

                cv_translation_success = True
                for res in results:
                    if isinstance(res, Exception):
                        cv_translation_success = False
                        logger.error("[translation] CV translation failed: %s", res)

                if cv_translation_success:
                    # Reset flag on the source record
                    cv.has_changes = False
                await db.commit()

            # ── Project translation ─────────────────────────────────────
            if changed_projects:
                # Group by source language so we batch per target language
                by_lang: Dict[str, list] = {}
                for proj in changed_projects:
                    by_lang.setdefault(proj.language, []).append(proj)

                # Pass a list of dictionaries containing only the scalar data we need instead of detached ORM models
                async def _process_projects_target(projs_data: list, src: str, tgt: str):
                    batch_data = [
                        {
                            "id": p["id"],
                            "title": p["title"],
                            "description": p["description"],
                        }
                        for p in projs_data
                    ]
                    translated_items = await translate_projects_batch(batch_data, src, tgt)
                    # Key by str(id) so an int/str type mismatch in the model
                    # output never silently drops a translation.
                    translated_map = {
                        str(item.get("id")): item for item in translated_items if "id" in item
                    }

                    async with AsyncSessionLocal() as db_session:
                        for source_proj_data in projs_data:
                            trans = translated_map.get(str(source_proj_data["id"]), {})
                            if not trans:
                                continue

                            # Find (or create) the matching project in the target language
                            target_proj = (
                                await project_crud.get_project_by_group_and_language(
                                    db_session,
                                    source_proj_data["translation_group_id"],
                                    tgt,
                                )
                            )

                            if target_proj:
                                target_proj.title = trans.get("title", source_proj_data["title"])
                                target_proj.description = trans.get(
                                    "description", source_proj_data["description"]
                                )
                                target_proj.link = source_proj_data["link"]
                                target_proj.image_object_name = source_proj_data["image_object_name"]
                                target_proj.position = source_proj_data["position"]
                                target_proj.health_check_urls = source_proj_data["health_check_urls"] or []
                                target_proj.has_changes = False
                            else:
                                await project_crud.create_project(
                                    db_session,
                                    title=trans.get("title", source_proj_data["title"]),
                                    description=trans.get(
                                        "description", source_proj_data["description"]
                                    ),
                                    link=source_proj_data["link"],
                                    image_object_name=source_proj_data["image_object_name"],
                                    position=source_proj_data["position"],
                                    owner_id=source_proj_data["owner_id"],
                                    language=tgt,
                                    health_check_urls=source_proj_data["health_check_urls"] or [],
                                    translation_group_id=source_proj_data["translation_group_id"],
                                    has_changes=False,
                                )
                        await db_session.commit()

                    logger.info("[translation] %d projects translated %s → %s", len(projs_data), src, tgt)
                    return True

                for source_lang, projects in by_lang.items():
                    logger.info("[translation] Translating %d projects from '%s' concurrently", len(projects), source_lang)
                    
                    # Pre-serialize project data so threaded tasks don't touch unattached ORM models
                    projs_data = [
                        {
                            "id": p.id,
                            "title": p.title,
                            "description": p.description,
                            "translation_group_id": p.translation_group_id,
                            "link": p.link,
                            "image_object_name": p.image_object_name,
                            "position": p.position,
                            "owner_id": p.owner_id,
                            "health_check_urls": p.health_check_urls
                        }
                        for p in projects
                    ]
                    
                    tasks = []
                    for target_lang in supported:
                        if target_lang == source_lang:
                            continue
                        tasks.append(_process_projects_target(projs_data, source_lang, target_lang))
                        
                    results = await asyncio.gather(*tasks, return_exceptions=True)
                    
                    projects_translation_success = True
                    for res in results:
                        if isinstance(res, Exception):
                            projects_translation_success = False
                            logger.error("[translation] Project translation failed: %s", res)

                    if projects_translation_success:
                        # Reset flags for source projects in this language batch
                        for proj in projects:
                            proj.has_changes = False
                    await db.commit()
        finally:
            await lock_conn.execute(text("SELECT pg_advisory_unlock(1234567890)"))
            await lock_conn.close()
            logger.info("[translation] Advisory lock released.")

    logger.info("[translation] Translation sync complete.")
