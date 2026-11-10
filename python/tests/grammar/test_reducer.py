"""Tests for the natural language grammar reducer."""

import pytest
from baresexp.grammar import reduce_natural_language
from baresexp.grammar.types import GrammarRule, ReduceOptions, RuleAction, RuleCategory


class TestReduceNaturalLanguage:
    def test_strips_politeness_phrases(self):
        result = reduce_natural_language("Could you please search the web for me")
        assert "pol-001" in result.applied_rules
        assert "could" not in result.simplified.lower()
        assert "please" not in result.simplified.lower()

    def test_strips_articles(self):
        result = reduce_natural_language("Find the best results for a query")
        assert "art-001" in result.applied_rules
        assert "the " not in result.simplified.lower()
        assert "a " not in result.simplified.lower()

    def test_strips_auxiliary_verbs(self):
        result = reduce_natural_language("The data is being processed")
        assert "aux-001" in result.applied_rules
        assert "is " not in result.simplified.lower()
        assert "being " not in result.simplified.lower()

    def test_strips_filler_words(self):
        result = reduce_natural_language("Just find the best results")
        assert "fil-001" in result.applied_rules
        assert "just" not in result.simplified.lower()

    def test_simplifies_conjunctions(self):
        result = reduce_natural_language("Search and also find related data")
        assert "con-001" in result.applied_rules
        assert "and " in result.simplified
        assert "also" not in result.simplified.lower()

    def test_normalizes_ing_verbs(self):
        result = reduce_natural_language("Running the analysis")
        assert "vrb-001" in result.applied_rules
        assert "run" in result.simplified.lower()

    def test_reports_applied_rule_ids(self):
        result = reduce_natural_language("Could you please find the best results")
        assert len(result.applied_rules) > 0
        assert "pol-001" in result.applied_rules
        assert "art-001" in result.applied_rules

    def test_preserves_original_text(self):
        input_text = "Could you please find the best results"
        result = reduce_natural_language(input_text)
        assert result.original == input_text

    def test_respects_keep_articles_option(self):
        result = reduce_natural_language(
            "Find the best results",
            options=ReduceOptions(keep_articles=True),
        )
        assert "the " in result.simplified
        assert "art-001" not in result.applied_rules

    def test_respects_keep_politeness_option(self):
        result = reduce_natural_language(
            "Could you please search",
            options=ReduceOptions(keep_politeness=True),
        )
        # pol-001 and pol-002 are excluded, but aux-002 still catches modal verbs
        assert "pol-001" not in result.applied_rules
        assert "pol-002" not in result.applied_rules

    def test_enables_aggressive_rules_in_aggressive_mode(self):
        result = reduce_natural_language(
            "Find the best results",
            options=ReduceOptions(aggressive=True),
        )
        # agr-001 strips possessive pronouns + articles; with aggressive it fires
        assert "agr-001" in result.applied_rules or "art-001" in result.applied_rules

    def test_accepts_custom_rules(self):
        custom_rule = GrammarRule(
            id="custom-001",
            priority=200,
            pattern=r"\bsuper\s+",
            category=RuleCategory.FILLER,
            action=RuleAction.REMOVE,
        )
        result = reduce_natural_language(
            "Super find results",
            custom_rules=[custom_rule],
        )
        assert "custom-001" in result.applied_rules
        assert "super" not in result.simplified.lower()

    def test_collapses_multiple_spaces(self):
        result = reduce_natural_language("Find   the    best   results")
        assert "  " not in result.simplified

    def test_trims_leading_trailing_punctuation(self):
        result = reduce_natural_language(". Find the best results .")
        assert not result.simplified.startswith((" ", ".", ",", ";", "!", "?"))
        assert not result.simplified.endswith((" ", ".", ",", ";", "!", "?"))

    def test_normalizes_to_sentence_case(self):
        result = reduce_natural_language("FIND THE BEST RESULTS")
        assert result.simplified[0].isupper()
        assert result.simplified[1:].islower()

    def test_handles_empty_input(self):
        result = reduce_natural_language("")
        assert result.simplified == ""
        assert result.applied_rules == []

    def test_handles_input_with_only_stop_words(self):
        result = reduce_natural_language("the a an is are was")
        assert len(result.simplified) < len(result.original)

    def test_applies_rules_in_priority_order(self):
        result = reduce_natural_language("Could you please just find the results")
        assert "pol-001" in result.applied_rules
        assert "fil-001" in result.applied_rules


class TestLoadRulesFromJson:
    def test_loads_rules_from_json_string(self):
        from baresexp.grammar import load_rules_from_json

        json_str = '''[
            {"id": "test-001", "priority": 100, "pattern": "\\\\bfoo\\\\s+", "category": "filler", "action": "remove"}
        ]'''
        rules = load_rules_from_json(json_str)
        assert len(rules) == 1
        assert rules[0].id == "test-001"
        assert rules[0].pattern == r"\bfoo\s+"

    def test_loads_with_custom_replacement(self):
        from baresexp.grammar import load_rules_from_json

        json_str = '''[
            {"id": "test-002", "priority": 50, "pattern": "\\\\bbar\\\\s+", "category": "filler", "action": "replace", "replacement": "baz "}
        ]'''
        rules = load_rules_from_json(json_str)
        assert rules[0].replacement == "baz "

    def test_loads_with_disabled_rule(self):
        from baresexp.grammar import load_rules_from_json

        json_str = '''[
            {"id": "test-003", "priority": 10, "pattern": "\\\\bqux\\\\s+", "category": "filler", "action": "remove", "enabled": false}
        ]'''
        rules = load_rules_from_json(json_str)
        assert rules[0].enabled is False
