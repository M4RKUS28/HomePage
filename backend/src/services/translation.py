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
from typing import Dict, List, Sequence, Any

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel, Field

from ..core.config import get_settings
from ..db.crud import cv as cv_crud, project as project_crud
from ..db.session import AsyncSessionLocal

logger = logging.getLogger(__name__)

settings = get_settings()

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
        return parsed.get("cv_data", parsed)
        
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
        return parsed.get("projects", [])
        
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

    async with AsyncSessionLocal() as db:
        # Advisory Lock: Only one worker runs translation sync at a time
        logger.info("[translation] Attempting to acquire advisory lock (1234567890)")
        await db.execute(
            text("SELECT pg_advisory_lock(1234567890)")
        )
        logger.info("[translation] Advisory lock acquired successfully.")
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
            for cv in changed_cvs:
                source_lang = cv.language
                logger.info("[translation] Translating CV from '%s'", source_lang)

                cv_translation_success = True
                for target_lang in supported:
                    if target_lang == source_lang:
                        continue
                    try:
                        translated = await translate_cv_data(
                            cv.data, source_lang, target_lang
                        )
                        await cv_crud.upsert_cv(
                            db,
                            data=translated,
                            owner_id=cv.owner_id,
                            language=target_lang,
                            has_changes=False,
                        )
                        logger.info(
                            "[translation] CV translated %s → %s", source_lang, target_lang
                        )
                    except Exception as exc:
                        cv_translation_success = False
                        logger.error(
                            "[translation] CV translation failed %s → %s: %s",
                            source_lang,
                            target_lang,
                            exc,
                        )

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

                for source_lang, projects in by_lang.items():
                    projects_translation_success = True
                    for target_lang in supported:
                        if target_lang == source_lang:
                            continue
                        try:
                            batch = [
                                {
                                    "id": p.id,
                                    "title": p.title,
                                    "description": p.description,
                                }
                                for p in projects
                            ]
                            translated_items = await translate_projects_batch(
                                batch, source_lang, target_lang
                            )
                            translated_map = {item["id"]: item for item in translated_items}

                            for source_proj in projects:
                                trans = translated_map.get(source_proj.id, {})
                                if not trans:
                                    continue

                                # Find (or create) the matching project in the target language
                                target_proj = (
                                    await project_crud.get_project_by_group_and_language(
                                        db,
                                        source_proj.translation_group_id,
                                        target_lang,
                                    )
                                )

                                if target_proj:
                                    target_proj.title = trans.get("title", source_proj.title)
                                    target_proj.description = trans.get(
                                        "description", source_proj.description
                                    )
                                    target_proj.link = source_proj.link
                                    target_proj.image_object_name = (
                                        source_proj.image_object_name
                                    )
                                    target_proj.position = source_proj.position
                                    target_proj.health_check_urls = (
                                        source_proj.health_check_urls or []
                                    )
                                    target_proj.has_changes = False
                                else:
                                    await project_crud.create_project(
                                        db,
                                        title=trans.get("title", source_proj.title),
                                        description=trans.get(
                                            "description", source_proj.description
                                        ),
                                        link=source_proj.link,
                                        image_object_name=source_proj.image_object_name,
                                        position=source_proj.position,
                                        owner_id=source_proj.owner_id,
                                        language=target_lang,
                                        health_check_urls=source_proj.health_check_urls
                                        or [],
                                        translation_group_id=source_proj.translation_group_id,
                                        has_changes=False,
                                    )

                            logger.info(
                                "[translation] %d projects translated %s → %s",
                                len(projects),
                                source_lang,
                                target_lang,
                            )
                        except Exception as exc:
                            projects_translation_success = False
                            logger.error(
                                "[translation] Project translation failed %s → %s: %s",
                                source_lang,
                                target_lang,
                                exc,
                            )

                    if projects_translation_success:
                        # Reset flags for source projects in this language batch
                        for proj in projects:
                            proj.has_changes = False
                    await db.commit()
        finally:
            logger.info("[translation] Releasing advisory lock (1234567890)")
            await db.execute(
                text("SELECT pg_advisory_unlock(1234567890)")
            )
            logger.info("[translation] Advisory lock released.")

    logger.info("[translation] Translation sync complete.")
