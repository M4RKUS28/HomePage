"""Misc utility helpers."""


def truncate(text: str, max_length: int = 100) -> str:
    """Truncate text to *max_length* chars, appending '…' if needed."""
    if len(text) <= max_length:
        return text
    return text[: max_length - 1] + "…"
