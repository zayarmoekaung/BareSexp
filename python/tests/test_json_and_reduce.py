"""Tests for JSON compilation, parsing, and reduce chaining."""

from baresexp import (
    BareSexpDocument,
    builder,
    compile_json,
    parse_json,
    reduce_natural_language,
    ReduceOptions,
)
from baresexp.grammar.types import GrammarRule, RuleCategory, RuleAction


class TestCompileJson:
    def test_flat_object_no_wrapper(self):
        result = compile_json({"name": "Alice", "age": 30, "active": True})
        assert "(name Alice)" in result
        assert "(age 30)" in result
        assert "(active true)" in result
        assert "(json" not in result

    def test_nested_objects(self):
        result = compile_json({"user": {"name": "Bob", "email": "bob@test.com"}})
        assert "(user" in result
        assert "(name Bob)" in result
        assert "bob@test.com" in result
        assert "(json" not in result

    def test_arrays(self):
        result = compile_json({"tags": ["alpha", "beta"]})
        assert "(tags" in result
        assert "(item alpha)" in result
        assert "(item beta)" in result

    def test_arrays_of_objects(self):
        result = compile_json({"items": [{"id": 1}, {"id": 2}]})
        assert "(items" in result
        assert "(item" in result
        assert "(id 1)" in result
        assert "(id 2)" in result

    def test_null_values(self):
        result = compile_json({"missing": None})
        assert "(missing null)" in result

    def test_condensed(self):
        result = compile_json({"a": 1, "b": 2}, condense=True)
        assert "\n" not in result
        assert "(a 1)" in result

    def test_minimal_mode(self):
        result = compile_json({"numberOfItems": 5}, mode="minimal")
        assert "(numberofitems 5)" in result


class TestParseJson:
    def test_plain_sexp(self):
        obj = parse_json('(name Alice) (age 30) (active true)')
        assert obj == {"name": "Alice", "age": 30, "active": True}

    def test_wrapped_json_sexp(self):
        obj = parse_json('(json (name Alice) (age 30))')
        assert obj == {"name": "Alice", "age": 30}

    def test_nested_objects(self):
        obj = parse_json('(user (name Bob) (email "bob@test.com"))')
        assert obj == {"user": {"name": "Bob", "email": "bob@test.com"}}

    def test_arrays(self):
        obj = parse_json('(tags (item alpha) (item beta))')
        assert obj == {"tags": ["alpha", "beta"]}

    def test_non_json_returns_empty(self):
        assert parse_json("") == {}

    def test_round_trip(self):
        original = {"query": "news", "limit": 5, "source": {"name": "api"}}
        sexp = compile_json(original)
        parsed = parse_json(sexp)
        assert parsed["query"] == "news"
        assert parsed["limit"] == 5
        assert parsed["source"] == {"name": "api"}


class TestBuilderJsonPayload:
    def test_chains_on_task_builder(self):
        result = (
            builder
            .minimal()
            .task(name="fetch")
            .json_payload({"query": "AI news", "limit": 5})
            .compile()
        )
        assert "(task fetch" in result.baresexp
        assert "(content" in result.baresexp
        assert "(query" in result.baresexp
        assert "(limit 5)" in result.baresexp

    def test_chained_after_step(self):
        result = (
            builder
            .minimal()
            .task(name="research")
            .step(name="search")
            .json_payload({"query": "data"})
            .compile()
        )
        assert "(content" in result.baresexp
        assert "(query data)" in result.baresexp
        assert "(step search)" in result.baresexp


class TestDocumentReduceChaining:
    def test_reduce_and_use_reduced(self):
        doc = (
            BareSexpDocument()
            .minimal()
            .reduce("Could you please search the web for the latest news")
            .use_reduced()
        )
        result = doc.compile()
        assert "(content" in result.baresexp
        assert "Search web for latest news" in result.baresexp

    def test_json_decodes_last_task_content(self):
        doc = BareSexpDocument().task(name="fetch", content="(query news) (limit 10)")
        decoded = doc.json()
        assert decoded is not None
        assert decoded["query"] == "news"
        assert decoded["limit"] == 10

    def test_json_returns_null_when_no_content(self):
        doc = BareSexpDocument().task(name="plain")
        assert doc.json() is None

    def test_static_compile_and_parse_json(self):
        sexp = BareSexpDocument.compile_json({"host": "api.example.com", "port": 443})
        parsed = BareSexpDocument.parse_json(sexp)
        assert parsed["host"] == "api.example.com"
        assert parsed["port"] == 443


class TestReduceStandalone:
    def test_basic_reduction(self):
        result = reduce_natural_language("Could you please help me with this task")
        assert result.simplified
        assert len(result.applied_rules) > 0
        assert result.baresexp is None

    def test_custom_rules(self):
        rule = GrammarRule(
            id="custom-001",
            priority=100,
            pattern="foo",
            category=RuleCategory.STRUCTURE,
            action=RuleAction.REPLACE,
            replacement="QUX",
        )
        result = reduce_natural_language("foo bar baz", custom_rules=[rule])
        assert "ux" in result.simplified.lower()
        assert "custom-001" in result.applied_rules
