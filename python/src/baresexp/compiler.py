"""Compiler — serializes typed Task objects into BareSexp text."""

from __future__ import annotations

import re
from typing import Any

from .minimizer import minimize_description
from .types import (
    BareSexpResult,
    CompileOptions,
    MetadataEntry,
    MetadataStore,
    OutputMode,
    Step,
    Task,
    Tool,
)


def _escape_token(value: str) -> str:
    return value.replace("\\", "\\\\").replace('"', '\\"')


def _format_value(value: Any, mode: OutputMode = "full") -> str:
    if isinstance(value, str):
        normalized = value.strip()
        effective = minimize_description(normalized) if mode == "minimal" else normalized
        if not effective or re.search(r'[\s()"\']', effective, re.UNICODE):
            return f'"{_escape_token(effective)}"'
        return effective
    if isinstance(value, (int, float)):
        return str(value)
    if isinstance(value, bool):
        return "true" if value else "false"
    return "null"


def compile_baresexp(
    task: Task,
    *,
    mode: OutputMode = "full",
    preserve_metadata: bool = True,
    condense: bool = False,
) -> BareSexpResult:
    """Compile a Task into BareSexp text."""
    metadata: MetadataStore = {}
    indent = "" if condense else " "
    lines: list[str] = [f"(task {_format_value(task.name, mode)}"]

    if task.description:
        _add_metadata(metadata, task.name, "description", task.description, mode, preserve_metadata)
        lines.append(f"{indent}(description {_format_value(task.description, mode)})")

    if task.steps:
        lines.append(f"{indent}(steps")
        for step in task.steps:
            lines.append(_compile_step(step, condense, 2, mode, metadata, preserve_metadata, task.name))
        lines.append(f"{indent})")

    if task.tools:
        lines.append(f"{indent}(tools")
        for tool in task.tools:
            lines.append(_compile_tool(tool, condense, 2, mode, metadata, preserve_metadata, task.name))
        lines.append(f"{indent})")

    lines.append(")")

    baresexp = "".join(lines) if condense else "\n".join(lines)
    token_count = _estimate_token_count(baresexp)
    return BareSexpResult(baresexp=baresexp, metadata=metadata, token_count=token_count)


def _compile_step(
    step: Step,
    condense: bool,
    indent_level: int,
    mode: OutputMode,
    metadata: MetadataStore,
    preserve_metadata: bool,
    task_id: str,
) -> str:
    indent = "" if condense else "  " * indent_level
    child_indent = "" if condense else "  " * (indent_level + 1)
    has_children = bool(step.description or step.tools or step.input or step.output)
    lines: list[str] = [f"{indent}(step {_format_value(step.name, mode)}"]

    if step.description:
        _add_metadata(metadata, task_id, f"steps.{step.name}.description", step.description, mode, preserve_metadata)
        lines.append(f"{child_indent}(description {_format_value(step.description, mode)})")

    if step.tools:
        lines.append(f"{child_indent}(tools")
        for tool in step.tools:
            lines.append(_compile_tool(tool, condense, indent_level + 2, mode, metadata, preserve_metadata, task_id))
        lines.append(f"{child_indent})")

    if step.input:
        lines.append(f"{child_indent}(input {_format_value(step.input, mode)})")
    if step.output:
        lines.append(f"{child_indent}(output {_format_value(step.output, mode)})")

    if not has_children:
        return f"{indent}(step {_format_value(step.name, mode)})"

    lines.append(f"{indent})")
    return "".join(lines) if condense else "\n".join(lines)


def _compile_tool(
    tool: Tool,
    condense: bool,
    indent_level: int,
    mode: OutputMode,
    metadata: MetadataStore,
    preserve_metadata: bool,
    task_id: str,
) -> str:
    indent = "" if condense else "  " * indent_level
    child_indent = "" if condense else "  " * (indent_level + 1)
    has_children = bool(tool.description or tool.input or tool.output)
    lines: list[str] = [f"{indent}(tool {_format_value(tool.name, mode)}"]

    if tool.description:
        _add_metadata(metadata, task_id, f"tools.{tool.name}.description", tool.description, mode, preserve_metadata)
        lines.append(f"{child_indent}(description {_format_value(tool.description, mode)})")

    if tool.input:
        lines.append(f"{child_indent}(input {_format_value(tool.input, mode)})")
    if tool.output:
        lines.append(f"{child_indent}(output {_format_value(tool.output, mode)})")

    if not has_children:
        return f"{indent}(tool {_format_value(tool.name, mode)})"

    lines.append(f"{indent})")
    return "".join(lines) if condense else "\n".join(lines)


def _add_metadata(
    metadata: MetadataStore,
    task_id: str,
    field_path: str,
    original: Any,
    mode: OutputMode,
    preserve_metadata: bool,
) -> MetadataEntry | None:
    if not preserve_metadata:
        return None
    shortened = minimize_description(str(original)) if mode == "minimal" else str(original)
    entry = MetadataEntry(original=original, field_path=field_path, shortened=shortened)
    if task_id not in metadata:
        metadata[task_id] = []
    metadata[task_id].append(entry)
    return entry


def _estimate_token_count(value: str) -> int:
    return max(1, int(len(value.split()) * 1.2))
