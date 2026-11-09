"""Builder — fluent API for constructing BareSexp tasks."""

from __future__ import annotations

from .compiler import compile_baresexp
from .types import (
    BareSexpResult,
    MetadataStore,
    Options,
    OutputMode,
    OutputSpec,
    Step,
    Task,
    Tool,
)


# Forward reference for return types
_OutputMode = OutputMode


class _StepBuilder:
    """Fluent builder for a single step."""

    def __init__(self, task_data: Task, step: Step, mode: OutputMode) -> None:
        self._task_data = task_data
        self._step = step
        self._mode = mode

    def tool(
        self,
        name: str = "tool",
        *,
        description: str | None = None,
        input: str | None = None,
        output: str | None = None,
    ) -> _StepBuilder:
        t = Tool(name=name, description=description, input=input, output=output)
        self._step.tools.append(t)
        return self

    def step(
        self,
        name: str = "step",
        *,
        description: str | None = None,
        input: str | None = None,
        output: str | None = None,
    ) -> _StepBuilder:
        s = Step(name=name, description=description, input=input, output=output)
        self._task_data.steps.append(s)
        return _StepBuilder(self._task_data, s, self._mode)

    def build(self) -> Task:
        return self._task_data

    def compile(
        self,
        *,
        mode: OutputMode | None = None,
        preserve_metadata: bool = True,
        condense: bool = False,
    ) -> BareSexpResult:
        return compile_baresexp(
            self._task_data,
            mode=mode or self._mode,
            preserve_metadata=preserve_metadata,
            condense=condense,
        )


class _TaskBuilder:
    """Fluent builder for a task."""

    def __init__(self, task_data: Task, mode: OutputMode) -> None:
        self._task_data = task_data
        self._mode = mode

    def step(
        self,
        name: str = "step",
        *,
        description: str | None = None,
        input: str | None = None,
        output: str | None = None,
    ) -> _StepBuilder:
        s = Step(name=name, description=description, input=input, output=output)
        self._task_data.steps.append(s)
        return _StepBuilder(self._task_data, s, self._mode)

    def tool(
        self,
        name: str = "tool",
        *,
        description: str | None = None,
        input: str | None = None,
        output: str | None = None,
    ) -> _TaskBuilder:
        t = Tool(name=name, description=description, input=input, output=output)
        self._task_data.tools.append(t)
        return self

    def output(
        self,
        *,
        format: str | None = None,
        schema: str | None = None,
        description: str | None = None,
    ) -> _TaskBuilder:
        self._task_data.output = OutputSpec(
            format=format, schema=schema, description=description
        )
        return self

    def options(
        self,
        *,
        strict: bool | None = None,
        indent: int | None = None,
        include_metadata: bool | None = None,
    ) -> _TaskBuilder:
        self._task_data.options = Options(
            strict=strict, indent=indent, include_metadata=include_metadata
        )
        return self

    def build(self) -> Task:
        return self._task_data

    def compile(
        self,
        *,
        mode: OutputMode | None = None,
        preserve_metadata: bool = True,
        condense: bool = False,
    ) -> BareSexpResult:
        return compile_baresexp(
            self._task_data,
            mode=mode or self._mode,
            preserve_metadata=preserve_metadata,
            condense=condense,
        )


class BareSexpBuilder:
    """Top-level builder entry point."""

    def __init__(self) -> None:
        self._mode: OutputMode = "full"

    def minimal(self) -> BareSexpBuilder:
        """Switch to minimal output mode for all subsequent compiles."""
        self._mode = "minimal"
        return self

    def full(self) -> BareSexpBuilder:
        """Switch to full output mode."""
        self._mode = "full"
        return self

    def task(
        self,
        name: str = "task",
        *,
        description: str | None = None,
    ) -> _TaskBuilder:
        t = Task(name=name, description=description)
        return _TaskBuilder(t, self._mode)


builder = BareSexpBuilder()
