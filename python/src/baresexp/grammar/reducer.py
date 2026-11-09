"""Natural language grammar reducer engine."""

import re
from typing import Optional

from .rules import default_grammar_rules
from .types import GrammarRule, ReduceOptions, ReduceResult


def reduce_natural_language(
    text: str,
    options: Optional[ReduceOptions] = None,
    custom_rules: Optional[list[GrammarRule]] = None,
) -> ReduceResult:
    """Reduce natural language text using grammar rules.

    Args:
        text: The input natural language text.
        options: Options controlling reduction behavior.
        custom_rules: Additional rules to apply (higher priority than defaults).

    Returns:
        A ReduceResult containing the original text, simplified text,
        and the list of applied rule IDs.
    """
    if options is None:
        options = ReduceOptions()

    # Merge and filter rules
    rules = list(default_grammar_rules)
    if custom_rules:
        rules = list(custom_rules) + rules

    # Apply option-based filtering
    filtered_rules = []
    for rule in rules:
        # Aggressive mode: enable rules that are disabled specifically for aggressiveness
        if options.aggressive and rule.id.startswith("agr"):
            filtered_rules.append(rule)
            continue
        # Skip explicitly disabled rules (non-aggressive ones)
        if not rule.enabled:
            continue
        # Option-based exclusions
        if rule.category.value == "articles" and options.keep_articles:
            continue
        if rule.category.value == "politeness" and options.keep_politeness:
            continue
        filtered_rules.append(rule)

    # Sort by priority descending
    filtered_rules.sort(key=lambda r: r.priority, reverse=True)

    result = text
    applied_rules: list[str] = []

    for rule in filtered_rules:
        pattern = re.compile(rule.pattern, re.IGNORECASE)
        if pattern.search(result):
            applied_rules.append(rule.id)

            if rule.action.value == "remove":
                result = pattern.sub("", result)
            elif rule.action.value == "replace":
                result = pattern.sub(rule.replacement or "", result)
            elif rule.action.value in ("rewrite", "normalize"):
                if callable(rule.replacement):
                    result = pattern.sub(lambda m: rule.replacement(m.group(0)), result)
                elif rule.replacement:
                    result = pattern.sub(rule.replacement, result)
                else:
                    result = pattern.sub("", result)

    # Clean up whitespace and punctuation
    result = re.sub(r"\s{2,}", " ", result)  # collapse multiple spaces
    result = re.sub(r"\s*([.,;!?])\s*", r"\1", result)  # tighten punctuation
    result = re.sub(r"^[\s.,;!?]+|[\s.,;!?]+$", "", result)  # trim edges
    result = re.sub(r"\s{2,}", " ", result)  # second pass
    result = result.strip()

    # Normalize to sentence case
    if result:
        result = result[0].upper() + result[1:].lower()

    reduce_result = ReduceResult(
        original=text,
        simplified=result,
        applied_rules=applied_rules,
    )

    # Optional: convert to BareSexp
    if options.to_baresexp and result:
        from baresexp import compile_baresexp
        from baresexp.types import Step, Task

        task = Task(name="reduced-task", steps=[Step(description=result)])
        reduce_result.baresexp = compile_baresexp(task)

    return reduce_result
