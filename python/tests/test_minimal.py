"""Minimal mode tests."""

import pytest

from baresexp import builder


def test_minimal_mode_shortens_output_and_stores_metadata():
    result = (
        builder
        .minimal()
        .task(
            "research-agent",
            description="Research and summarize the latest news about AI agents and tools for this week",
        )
        .step("collect-context", description="Gather recent sources and extract user-relevant facts")
        .compile(mode="minimal")
    )

    assert len(result.baresexp) < 220
    assert result.token_count > 0
    assert "research-agent" in result.metadata
    assert result.metadata["research-agent"][0].original == (
        "Research and summarize the latest news about AI agents and tools for this week"
    )


def test_minimal_vs_full_token_count():
    full = (
        builder
        .task(
            "florida-man-news",
            description="Summarize recent Florida Man news stories into a concise briefing",
        )
        .compile(mode="full")
    )

    minimal = (
        builder
        .minimal()
        .task(
            "florida-man-news",
            description="Summarize recent Florida Man news stories into a concise briefing",
        )
        .compile(mode="minimal")
    )

    assert minimal.token_count < full.token_count


def test_condense_removes_whitespace():
    result = (
        builder
        .task("compact-task", description="A task with condense enabled")
        .compile(condense=True)
    )

    assert "\n" not in result.baresexp
    assert "  " not in result.baresexp
