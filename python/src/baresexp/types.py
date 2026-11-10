"""Type definitions for BareSexp structured objects."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Literal

OutputMode = Literal["full", "minimal"]


@dataclass
class CompileOptions:
    """Options for compiling a task to BareSexp."""

    mode: OutputMode = "full"
    preserve_metadata: bool = True
    condense: bool = False
    indent: bool = True


@dataclass
class MetadataEntry:
    """Stores original and shortened values for a field."""

    original: object
    field_path: str
    shortened: str | None = None


@dataclass
class Tool:
    """A tool available to a step or task."""

    name: str = "tool"
    description: str | None = None
    input: str | None = None
    output: str | None = None
    metadata: list[MetadataEntry] = field(default_factory=list)


@dataclass
class Step:
    """A step within a task."""

    name: str = "step"
    description: str | None = None
    tools: list[Tool] = field(default_factory=list)
    input: str | None = None
    output: str | None = None
    metadata: list[MetadataEntry] = field(default_factory=list)


@dataclass
class OutputSpec:
    """Output format specification."""

    format: str | None = None
    schema: str | None = None
    description: str | None = None
    metadata: list[MetadataEntry] = field(default_factory=list)


@dataclass
class Options:
    """Task-level options."""

    strict: bool | None = None
    indent: int | None = None
    include_metadata: bool | None = None


@dataclass
class Task:
    """Top-level BareSexp task document."""

    name: str = "task"
    description: str | None = None
    steps: list[Step] = field(default_factory=list)
    tools: list[Tool] = field(default_factory=list)
    output: OutputSpec | None = None
    options: Options | None = None
    metadata: list[MetadataEntry] = field(default_factory=list)


@dataclass
class Context:
    """Context document — background, role, persona, constraints, facts, etc."""

    name: str = "context"
    role: str | None = None
    persona: str | None = None
    background: str | None = None
    domain: str | None = None
    constraints: list[str] = field(default_factory=list)
    facts: list[str] = field(default_factory=list)
    scope: str | None = None
    decision: str | None = None
    data: str | None = None
    metadata: list[MetadataEntry] = field(default_factory=list)


@dataclass
class BareSexpResult:
    """Result of compiling a task or context to BareSexp text."""

    baresexp: str
    metadata: dict[str, list[MetadataEntry]]
    context_sexp: str | None = None
    token_count: int = 0


MetadataStore = dict[str, list[MetadataEntry]]
