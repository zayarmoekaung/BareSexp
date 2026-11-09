"""Parser — turns BareSexp text back into typed objects."""

from __future__ import annotations

import re
from typing import Any

from .types import OutputSpec, Options, Step, Task, Tool


def _tokenize(input_text: str) -> list[str]:
    tokens: list[str] = []
    index = 0

    while index < len(input_text):
        char = input_text[index]
        if re.match(r"\s", char, re.UNICODE):
            index += 1
            continue

        if char in ("(", ")"):
            tokens.append(char)
            index += 1
            continue

        if char == '"':
            escaped = False
            value = '"'
            index += 1
            while index < len(input_text):
                current = input_text[index]
                if escaped:
                    value += current
                    escaped = False
                elif current == "\\":
                    value += current
                    escaped = True
                elif current == '"':
                    value += current
                    index += 1
                    break
                else:
                    value += current
                index += 1
            tokens.append(value)
            continue

        value = ""
        while index < len(input_text) and not re.match(r"[\s()]", input_text[index], re.UNICODE):
            value += input_text[index]
            index += 1
        tokens.append(value)

    return tokens


def _parse_expression(tokens: list[str], index: int) -> tuple[Any, int]:
    if tokens[index] == "(":
        items: list[Any] = []
        cursor = index + 1
        while cursor < len(tokens) and tokens[cursor] != ")":
            if tokens[cursor] == "(":
                parsed, cursor = _parse_expression(tokens, cursor)
                items.append(parsed)
            else:
                items.append(tokens[cursor])
                cursor += 1
        return items, cursor + 1

    return tokens[index], index + 1


def _parse_scalar(value: Any) -> str | int | float | bool | None:
    if not isinstance(value, str):
        return value

    trimmed = value.strip()
    if trimmed.startswith('"') and trimmed.endswith('"'):
        return trimmed[1:-1]

    if trimmed == "true":
        return True
    if trimmed == "false":
        return False
    if re.match(r"^-?\d+(\.\d+)?$", trimmed):
        return float(trimmed) if "." in trimmed else int(trimmed)
    return trimmed


def _parse_task(parts: list[Any]) -> Task:
    task = Task(
        name=parts[0] if isinstance(parts[0], str) else "task",
    )

    for child in parts[1:]:
        if not isinstance(child, list):
            continue

        key = child[0] if child else None
        body = child[1:]
        if not isinstance(key, str):
            continue

        if key == "description":
            task.description = _parse_scalar(body[0]) if body else None
        elif key == "steps":
            task.steps = [_parse_step(item) for item in body if isinstance(item, list)]
        elif key == "tools":
            task.tools = [_parse_tool(item) for item in body if isinstance(item, list)]
        elif key == "output":
            task.output = _parse_output(body)
        elif key == "options":
            task.options = _parse_options(body)

    return task


def _parse_step(node: Any) -> Step:
    if not isinstance(node, list):
        return Step()

    key = node[0] if node else None
    body = node[1:]
    if not isinstance(key, str) or key != "step":
        return Step()

    step = Step(
        name=body[0] if body and isinstance(body[0], str) else "step",
    )

    for child in body[1:]:
        if not isinstance(child, list):
            continue

        field_name = child[0] if child else None
        field_body = child[1:]
        if not isinstance(field_name, str):
            continue

        if field_name == "description":
            step.description = _parse_scalar(field_body[0]) if field_body else None
        elif field_name == "tools":
            step.tools = [_parse_tool(item) for item in field_body if isinstance(item, list)]
        elif field_name == "input":
            step.input = _parse_scalar(field_body[0]) if field_body else None
        elif field_name == "output":
            step.output = _parse_scalar(field_body[0]) if field_body else None

    return step


def _parse_tool(node: Any) -> Tool:
    if not isinstance(node, list):
        return Tool()

    key = node[0] if node else None
    body = node[1:]
    if not isinstance(key, str) or key != "tool":
        return Tool()

    tool = Tool(
        name=body[0] if body and isinstance(body[0], str) else "tool",
    )

    for child in body[1:]:
        if not isinstance(child, list):
            continue

        field_name = child[0] if child else None
        field_body = child[1:]
        if not isinstance(field_name, str):
            continue

        if field_name == "description":
            tool.description = _parse_scalar(field_body[0]) if field_body else None
        elif field_name == "input":
            tool.input = _parse_scalar(field_body[0]) if field_body else None
        elif field_name == "output":
            tool.output = _parse_scalar(field_body[0]) if field_body else None

    return tool


def _parse_output(parts: list[Any]) -> OutputSpec:
    output = OutputSpec()
    for child in parts:
        if not isinstance(child, list):
            continue

        field_name = child[0] if child else None
        field_body = child[1:]
        if not isinstance(field_name, str):
            continue

        if field_name == "format":
            output.format = _parse_scalar(field_body[0]) if field_body else None
        elif field_name == "schema":
            output.schema = _parse_scalar(field_body[0]) if field_body else None
        elif field_name == "description":
            output.description = _parse_scalar(field_body[0]) if field_body else None

    return output


def _parse_options(parts: list[Any]) -> Options:
    options = Options()
    for child in parts:
        if not isinstance(child, list):
            continue

        field_name = child[0] if child else None
        field_body = child[1:]
        if not isinstance(field_name, str):
            continue

        if field_name == "strict":
            val = _parse_scalar(field_body[0]) if field_body else None
            options.strict = bool(val) if val is not None else None
        elif field_name == "indent":
            val = _parse_scalar(field_body[0]) if field_body else None
            options.indent = int(val) if val is not None else None
        elif field_name == "includeMetadata":
            val = _parse_scalar(field_body[0]) if field_body else None
            options.include_metadata = bool(val) if val is not None else None

    return options


def parse_baresexp(input_text: str) -> Task:
    """Parse BareSexp text into a Task object."""
    tokens = _tokenize(input_text.strip())
    if not tokens:
        return Task()

    parsed, _ = _parse_expression(tokens, 0)
    if isinstance(parsed, list):
        head, *body = parsed
        if head == "task":
            return _parse_task(body)

    return Task()
