"""Minimizer — reduces descriptions to compact kebab-case tokens."""

import re

_STOP_WORDS = frozenset({
    "a", "an", "and", "the", "for", "to", "of", "in", "on", "with",
    "from", "into", "about", "this", "that", "these", "those",
    "latest", "recent", "new", "very", "your", "our", "their",
    "its", "is", "are", "be", "been", "being", "will", "can",
    "could", "should", "would", "use", "using", "used", "or",
})


def minimize_description(text: str) -> str:
    """Collapse a prose description into a short kebab-case token string."""
    normalized = re.sub(r"[^a-zA-Z0-9\s-]", " ", text)
    normalized = re.sub(r"\s+", " ", normalized).strip()

    if not normalized:
        return "desc"

    words = [
        w for w in normalized.split(" ")
        if len(w) > 1 and w.lower() not in _STOP_WORDS
    ]

    if not words:
        return _kebab(normalized)[:24]

    core = words[:6]
    return _kebab(" ".join(w.lower() for w in core))


def minimize_field_name(name: str) -> str:
    """Normalize a field name to kebab-case."""
    return _kebab(name)


def _kebab(value: str) -> str:
    return re.sub(r"^-+|-+$", "", re.sub(r"[^a-z0-9]+", "-", value.lower()))[:40]
