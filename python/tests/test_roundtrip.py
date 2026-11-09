"""Round-trip tests: compile -> parse -> validate."""

import pytest

from baresexp import builder, compile_baresexp, parse_baresexp, validate_baresexp


def test_builder_compiles_and_round_trips():
    task = (
        builder
        .task("research-agent", description="Research, summarize, and report")
        .step("collect-context", description="Gather relevant sources")
        .tool("web-search", description="Search the web for references")
        .build()
    )

    bare = compile_baresexp(task)
    parsed = parse_baresexp(bare.baresexp)

    assert validate_baresexp(parsed) is True
    assert parsed.name == "research-agent"
    assert parsed.steps[0].name == "collect-context"
    assert parsed.steps[0].tools[0].name == "web-search"


def test_parse_preserves_description():
    task = (
        builder
        .task("news-summary", description="Summarize today's top stories")
        .build()
    )

    bare = compile_baresexp(task)
    parsed = parse_baresexp(bare.baresexp)

    assert parsed.description == "Summarize today's top stories"


def test_parse_task_with_tools():
    task = (
        builder
        .task("multi-tool-task")
        .tool("search", description="Search the web")
        .tool("read", description="Read a URL")
        .build()
    )

    bare = compile_baresexp(task)
    parsed = parse_baresexp(bare.baresexp)

    assert len(parsed.tools) == 2
    assert parsed.tools[0].name == "search"
    assert parsed.tools[1].name == "read"


def test_step_with_input_output():
    task = (
        builder
        .task("pipeline")
        .step("fetch", description="Fetch data", input="url", output="raw_data")
        .build()
    )

    bare = compile_baresexp(task)
    parsed = parse_baresexp(bare.baresexp)

    assert parsed.steps[0].input == "url"
    assert parsed.steps[0].output == "raw_data"
