"""Tests for Context compilation, parsing, and builder chaining."""

from baresexp import (
    builder,
    compile_context,
    parse_context,
    parse_baresexp,
    Context,
)


class TestCompileContext:
    def test_minimal_context(self):
        ctx = Context(name="test-context")
        result = compile_context(ctx)
        assert "(context test-context" in result.baresexp
        assert result.context_sexp == result.baresexp

    def test_all_fields(self):
        ctx = Context(
            name="ai-reviewer",
            role="You are a senior TypeScript engineer",
            persona="Direct, no-fluff communication",
            background="BareSexp is a minimal-token S-expression library",
            domain="AI agent frameworks",
            scope="Open-source tooling, 2025",
            decision="Prefer explicit over implicit types",
            constraints=["Keep descriptions under 120 chars", "Zero runtime dependencies"],
            facts=["TypeScript + Python implementations", "Grammar-based reduction"],
        )
        result = compile_context(ctx, mode="full")

        assert "(context ai-reviewer" in result.baresexp
        assert "(role" in result.baresexp
        assert "(persona" in result.baresexp
        assert "(background" in result.baresexp
        assert "(domain" in result.baresexp
        assert "(scope" in result.baresexp
        assert "(decision" in result.baresexp
        assert "(constraints" in result.baresexp
        assert "(constraint" in result.baresexp
        assert "(facts" in result.baresexp
        assert "(fact" in result.baresexp

    def test_grammar_reduction_minimal(self):
        ctx = Context(
            name="assistant",
            role="Could you please be a helpful research assistant",
        )
        result = compile_context(ctx, mode="minimal")
        assert "Could you please" not in result.baresexp

    def test_condensed_output(self):
        ctx = Context(
            name="ctx",
            role="Senior engineer",
            domain="AI",
        )
        result = compile_context(ctx, condense=True)
        assert "\n" not in result.baresexp


class TestParseContext:
    def test_simple_context(self):
        parsed = parse_context("(context test-ctx)")
        assert parsed.name == "test-ctx"

    def test_all_fields(self):
        input_text = """(context ai-reviewer
  (role "senior engineer")
  (domain "AI frameworks")
  (constraints
    (constraint "zero deps")
  )
  (facts
    (fact "TS and Python")
  )
)"""
        parsed = parse_context(input_text)
        assert parsed.name == "ai-reviewer"
        assert parsed.role == "senior engineer"
        assert parsed.domain == "AI frameworks"
        assert parsed.constraints == ["zero deps"]
        assert parsed.facts == ["TS and Python"]


class TestBuilderChaining:
    def test_context_then_task(self):
        result = (
            builder
            .minimal()
            .context(
                name="reviewer",
                role="You are a senior TypeScript engineer",
            )
            .constraint("Keep it concise")
            .task(
                name="review",
                description="Review the code for correctness",
            )
            .step(name="check", description="Check types")
            .compile(mode="minimal")
        )

        # baresexp contains the full concatenated output
        assert "(context reviewer" in result.baresexp
        assert "(task review" in result.baresexp
        assert "(step check" in result.baresexp
        # context_sexp is also available separately
        assert result.context_sexp is not None
        assert "(context reviewer" in result.context_sexp

    def test_standalone_context(self):
        result = (
            builder
            .minimal()
            .context(
                name="standalone",
                role="Helpful assistant",
            )
            .fact("Zero runtime dependencies")
            .compile(mode="minimal")
        )

        assert "(context standalone" in result.context_sexp
        assert "(role" in result.context_sexp
        assert "(fact" in result.context_sexp

    def test_standalone_task_backward_compatible(self):
        result = (
            builder
            .minimal()
            .task(
                name="task-only",
                description="Do something",
            )
            .step(name="s1", description="Step one")
            .compile(mode="minimal")
        )

        assert "(task task-only" in result.baresexp
        assert result.context_sexp is None


class TestParseBaresexpContext:
    def test_parses_context_expression(self):
        parsed = parse_baresexp("(context my-ctx (role tester))")
        assert isinstance(parsed, Context)
        assert parsed.name == "my-ctx"
        assert parsed.role == "tester"
