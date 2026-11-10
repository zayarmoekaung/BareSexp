"""Compiler for Context documents into BareSexp text."""

from __future__ import annotations

import re
from typing import Any

from .grammar import reduce_natural_language
from .grammar.types import ReduceOptions
from .minimizer import minimize_description
from .types import (
    BareSexpResult,
    CompileOptions,
    Context,
    MetadataEntry,
    MetadataStore,
    OutputMode,
)


def _escape_token(value: str) -> str:
    return value.replace("\\", "\\\\").replace('"', '\\"')


def _format_value(value: str, mode: OutputMode = "full") -> str:
    if isinstance(value, str):
        normalized = value.strip()
        effective = minimize_description(normalized) if mode == "minimal" else normalized
        if not effective or re.search(r'[\s()"\']', effective, re.UNICODE):
            return f'"{_escape_token(effective)}"'
        return effective
    return "null"


def _reduce_field(value: str, mode: OutputMode) -> str:
    if mode == "minimal":
        reduced = reduce_natural_language(value, options=ReduceOptions(aggressive=True))
        return reduced.simplified
    return value


def _add_context_metadata(
    metadata: MetadataStore,
    context_name: str,
    field_path: str,
    original: Any,
    mode: OutputMode,
    preserve_metadata: bool,
) -> None:
    if not preserve_metadata:
        return
    shortened = minimize_description(str(original)) if mode == "minimal" else str(original)
    entry = MetadataEntry(original=original, field_path=field_path, shortened=shortened)
    key = context_name or "context"
    if key not in metadata:
        metadata[key] = []
    metadata[key].append(entry)


def _estimate_token_count(value: str) -> int:
    return max(1, int(len(value.split()) * 1.2))


def compile_context(
    ctx: Context,
    *,
    mode: OutputMode = "full",
    preserve_metadata: bool = True,
    condense: bool = False,
) -> BareSexpResult:
    """Compile a Context into BareSexp text."""
    metadata: MetadataStore = {}
    indent = "" if condense else " "

    lines: list[str] = [f"(context {_format_value(ctx.name, mode)}"]

    if ctx.role:
        reduced = _reduce_field(ctx.role, mode)
        _add_context_metadata(metadata, ctx.name, "role", ctx.role, mode, preserve_metadata)
        lines.append(f"{indent}(role {_format_value(reduced, mode)})")

    if ctx.persona:
        reduced = _reduce_field(ctx.persona, mode)
        _add_context_metadata(metadata, ctx.name, "persona", ctx.persona, mode, preserve_metadata)
        lines.append(f"{indent}(persona {_format_value(reduced, mode)})")

    if ctx.background:
        reduced = _reduce_field(ctx.background, mode)
        _add_context_metadata(metadata, ctx.name, "background", ctx.background, mode, preserve_metadata)
        lines.append(f"{indent}(background {_format_value(reduced, mode)})")

    if ctx.domain:
        reduced = _reduce_field(ctx.domain, mode)
        _add_context_metadata(metadata, ctx.name, "domain", ctx.domain, mode, preserve_metadata)
        lines.append(f"{indent}(domain {_format_value(reduced, mode)})")

    if ctx.scope:
        reduced = _reduce_field(ctx.scope, mode)
        _add_context_metadata(metadata, ctx.name, "scope", ctx.scope, mode, preserve_metadata)
        lines.append(f"{indent}(scope {_format_value(reduced, mode)})")

    if ctx.decision:
        reduced = _reduce_field(ctx.decision, mode)
        _add_context_metadata(metadata, ctx.name, "decision", ctx.decision, mode, preserve_metadata)
        lines.append(f"{indent}(decision {_format_value(reduced, mode)})")

    if ctx.data:
        reduced = _reduce_field(ctx.data, mode)
        _add_context_metadata(metadata, ctx.name, "data", ctx.data, mode, preserve_metadata)
        lines.append(f"{indent}(data {_format_value(reduced, mode)})")

    if ctx.constraints:
        lines.append(f"{indent}(constraints")
        for c in ctx.constraints:
            reduced = _reduce_field(c, mode)
            _add_context_metadata(metadata, ctx.name, f"constraints.{c}", c, mode, preserve_metadata)
            child_indent = "" if condense else "  "
            lines.append(f"{indent}{child_indent}(constraint {_format_value(reduced, mode)})")
        lines.append(f"{indent})")

    if ctx.facts:
        lines.append(f"{indent}(facts")
        for f in ctx.facts:
            reduced = _reduce_field(f, mode)
            _add_context_metadata(metadata, ctx.name, f"facts.{f}", f, mode, preserve_metadata)
            child_indent = "" if condense else "  "
            lines.append(f"{indent}{child_indent}(fact {_format_value(reduced, mode)})")
        lines.append(f"{indent})")

    lines.append(")")

    context_sexp = "".join(lines) if condense else "\n".join(lines)
    token_count = _estimate_token_count(context_sexp)

    return BareSexpResult(
        baresexp=context_sexp,
        context_sexp=context_sexp,
        metadata=metadata,
        token_count=token_count,
    )
