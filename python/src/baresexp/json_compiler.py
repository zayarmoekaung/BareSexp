"""Compile arbitrary JSON-compatible Python dicts into BareSexp s-expressions and parse them back."""

from __future__ import annotations

import json
import re
from typing import Any

from .minimizer import minimize_field_name
from .types import OutputMode


def _escape_token(value: str) -> str:
    return value.replace("\\", "\\\\").replace('"', '\\"')


def _format_value(value: Any, mode: OutputMode = "full") -> str:
    if isinstance(value, str):
        normalized = value.strip()
        if not normalized or re.search(r'[\s()"\',@{}\[\]]', normalized):
            return f'"{_escape_token(normalized)}"'
        if mode == "minimal":
            normalized = minimize_field_name(normalized)
        return normalized
    if isinstance(value, bool):
        return "true" if value else "false"
    if isinstance(value, (int, float)):
        return str(value)
    if value is None:
        return "null"
    return f'"{_escape_token(json.dumps(value))}"'


def _compile_obj(
    obj: dict[str, Any],
    indent_level: int,
    mode: OutputMode,
    condense: bool,
) -> str:
    lines: list[str] = []
    child_indent = "" if condense else "  " * (indent_level + 1)

    for key, value in obj.items():
        field_name = minimize_field_name(key) if mode == "minimal" else key
        if value is None:
            lines.append(f"{child_indent}({field_name} null)")
        elif isinstance(value, list):
            lines.append(f"{child_indent}({field_name}")
            for item in value:
                if isinstance(item, dict):
                    lines.append(f"{child_indent}  (item")
                    lines.append(_compile_obj(item, indent_level + 3, mode, condense))
                    lines.append(f"{child_indent}  )")
                else:
                    lines.append(f"{child_indent}  (item {_format_value(item, mode)})")
            lines.append(f"{child_indent})")
        elif isinstance(value, dict):
            lines.append(f"{child_indent}({field_name}")
            lines.append(_compile_obj(value, indent_level + 2, mode, condense))
            lines.append(f"{child_indent})")
        else:
            lines.append(f"{child_indent}({field_name} {_format_value(value, mode)})")

    sep = "" if condense else "\n"
    return sep.join(lines)


def compile_json(
    obj: dict[str, Any],
    *,
    mode: OutputMode = "full",
    condense: bool = False,
) -> str:
    """Compile a JSON-compatible dict into a plain BareSexp s-expression.

    No wrapper tag — just ``(key value) ...`` pairs.
    """
    return _compile_obj(obj, 0, mode, condense)


def _unquote_scalar(token: str) -> Any:
    if token.startswith('"') and token.endswith('"'):
        return token[1:-1].replace('\\"', '"').replace('\\\\', '\\')
    if token == "true":
        return True
    if token == "false":
        return False
    if token == "null":
        return None
    try:
        if "." in token:
            return float(token)
        return int(token)
    except ValueError:
        return token


def _tokenize_sexp(input: str) -> list[str]:
    tokens: list[str] = []
    i = 0
    while i < len(input):
        ch = input[i]
        if re.match(r'\s', ch):
            i += 1
            continue
        if ch in ('(', ')'):
            tokens.append(ch)
            i += 1
            continue
        if ch == '"':
            val = '"'
            i += 1
            while i < len(input):
                c = input[i]
                if c == '\\' and i + 1 < len(input):
                    val += c + input[i + 1]
                    i += 2
                    continue
                if c == '"':
                    val += '"'
                    i += 1
                    break
                val += c
                i += 1
            tokens.append(val)
            continue
        val = ""
        while i < len(input) and not re.match(r'[\s()]', input[i]):
            val += input[i]
            i += 1
        tokens.append(val)
    return tokens


def _parse_sexp_value(tokens: list[str], pos: list[int]) -> Any | None:
    if pos[0] >= len(tokens):
        return None
    if tokens[pos[0]] == '(':
        pos[0] += 1
        key = tokens[pos[0]]
        pos[0] += 1
        if key == 'item':
            if pos[0] < len(tokens) and tokens[pos[0]] == '(':
                v = _parse_sexp_obj(tokens, pos)
                pos[0] += 1
                return v
            scalar = _unquote_scalar(tokens[pos[0]])
            pos[0] += 1
            return scalar
        if pos[0] < len(tokens) and tokens[pos[0]] == '(':
            peek = pos[0] + 1
            if peek < len(tokens) and tokens[peek] == 'item':
                arr: list[Any] = []
                while pos[0] < len(tokens) and tokens[pos[0]] != ')':
                    if tokens[pos[0]] == '(':
                        pos[0] += 1
                        item_key = tokens[pos[0]]
                        pos[0] += 1
                        if item_key == 'item':
                            if pos[0] < len(tokens) and tokens[pos[0]] == '(':
                                arr.append(_parse_sexp_obj(tokens, pos))
                                pos[0] += 1
                            else:
                                arr.append(_unquote_scalar(tokens[pos[0]]))
                                pos[0] += 1
                        if pos[0] < len(tokens) and tokens[pos[0]] == ')':
                            pos[0] += 1
                return {key: arr}
            else:
                obj = _parse_sexp_obj(tokens, pos)
                pos[0] += 1
                return {key: obj}
        val = _unquote_scalar(tokens[pos[0]])
        pos[0] += 1
        return {key: val}
    scalar = _unquote_scalar(tokens[pos[0]])
    pos[0] += 1
    return scalar


def _parse_sexp_obj(tokens: list[str], pos: list[int]) -> dict[str, Any]:
    result: dict[str, Any] = {}
    while pos[0] < len(tokens) and tokens[pos[0]] != ')':
        if tokens[pos[0]] == '(':
            entry = _parse_sexp_value(tokens, pos)
            if entry is not None and isinstance(entry, dict):
                result.update(entry)
            if pos[0] < len(tokens) and tokens[pos[0]] == ')':
                pos[0] += 1
        else:
            pos[0] += 1
    return result


def parse_json(input: str) -> dict[str, Any]:
    """Parse a BareSexp s-expression back into a JSON-compatible dict.

    Accepts both wrapped ``(json ...)`` and plain ``(key value) ...`` forms.
    """
    tokens = _tokenize_sexp(input.strip())
    if not tokens:
        return {}

    start = 0
    if tokens[0] == '(' and len(tokens) > 1 and tokens[1] == 'json':
        start = 2

    pos = [start]
    return _parse_sexp_obj(tokens, pos)
