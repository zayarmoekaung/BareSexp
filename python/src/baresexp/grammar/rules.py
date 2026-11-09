"""Default grammar rules for the natural language reducer — loaded from JSON."""

import json
import re
from pathlib import Path

from .types import GrammarRule, GrammarRuleExample, RuleAction, RuleCategory


def _normalize_verb_form(match: str) -> str:
    """Simple heuristic to normalize -ing verbs to base form."""
    base = match[:-3]
    if len(base) > 2 and base[-1] == base[-2]:
        return base[:-1]
    if base.endswith("ie"):
        return base[:-2] + "y"
    return base


def _normalize_suffix(match: str) -> str:
    """Strip common noun/verb suffixes."""
    return re.sub(r"(?:ed|tion|sion|ment)$", "", match, flags=re.IGNORECASE)


_normalizers = {
    "vrb-001": _normalize_verb_form,
    "vrb-002": _normalize_suffix,
}


def _load_rules() -> list[GrammarRule]:
    """Load grammar rules from the bundled JSON file."""
    json_path = Path(__file__).parent / "default-rules.json"
    with open(json_path, encoding="utf-8") as f:
        raw = json.load(f)

    rules = []
    for r in raw:
        action = RuleAction(r["action"])
        category = RuleCategory(r["category"])
        example = None
        if r.get("example"):
            example = GrammarRuleExample(**r["example"])

        # For normalize actions, use the built-in normalizer
        replacement = r.get("replacement")
        if action == RuleAction.NORMALIZE and r["id"] in _normalizers:
            replacement = _normalizers[r["id"]]

        rules.append(GrammarRule(
            id=r["id"],
            priority=r["priority"],
            pattern=r["pattern"],
            category=category,
            action=action,
            replacement=replacement,
            example=example,
            enabled=r.get("enabled", True),
        ))
    return rules


default_grammar_rules: list[GrammarRule] = _load_rules()


def load_rules_from_json(json_string: str) -> list[GrammarRule]:
    """Load grammar rules from a JSON string.

    Useful for loading user-provided rule files.

    Args:
        json_string: JSON string containing an array of rule objects.

    Returns:
        A list of compiled GrammarRule instances.
    """
    raw = json.loads(json_string)
    rules = []
    for r in raw:
        action = RuleAction(r["action"])
        category = RuleCategory(r["category"])
        example = None
        if r.get("example"):
            example = GrammarRuleExample(**r["example"])

        replacement = r.get("replacement")
        if action == RuleAction.NORMALIZE and r["id"] in _normalizers:
            replacement = _normalizers[r["id"]]

        rules.append(GrammarRule(
            id=r["id"],
            priority=r["priority"],
            pattern=r["pattern"],
            category=category,
            action=action,
            replacement=replacement,
            example=example,
            enabled=r.get("enabled", True),
        ))
    return rules
