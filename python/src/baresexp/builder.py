"""Builder — fluent API for constructing BareSexp tasks and contexts."""

from __future__ import annotations

from .compiler import compile_baresexp
from .context import compile_context
from .types import (
    BareSexpResult,
    Context,
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

    def __init__(
        self,
        task_data: Task,
        step: Step,
        mode: OutputMode,
        context_data: Context | None = None,
    ) -> None:
        self._task_data = task_data
        self._step = step
        self._mode = mode
        self._context_data: Context | None = context_data

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
        return _StepBuilder(self._task_data, s, self._mode, self._context_data)

    def context(
        self,
        name: str = "context",
        *,
        role: str | None = None,
        persona: str | None = None,
        background: str | None = None,
        domain: str | None = None,
        scope: str | None = None,
        decision: str | None = None,
        data: str | None = None,
    ) -> _ContextBuilder:
        ctx = Context(
            name=name,
            role=role,
            persona=persona,
            background=background,
            domain=domain,
            scope=scope,
            decision=decision,
            data=data,
        )
        return _ContextBuilder(ctx, self._mode)

    def build(self) -> Task:
        return self._task_data

    def compile(
        self,
        *,
        mode: OutputMode | None = None,
        preserve_metadata: bool = True,
        condense: bool = False,
    ) -> BareSexpResult:
        task_result = compile_baresexp(
            self._task_data,
            mode=mode or self._mode,
            preserve_metadata=preserve_metadata,
            condense=condense,
        )

        if self._context_data:
            ctx_result = compile_context(
                self._context_data,
                mode=mode or self._mode,
                preserve_metadata=preserve_metadata,
                condense=condense,
            )
            for key, entries in ctx_result.metadata.items():
                if key not in task_result.metadata:
                    task_result.metadata[key] = []
                task_result.metadata[key].extend(entries)
            sep = "" if condense else "\n"
            return BareSexpResult(
                baresexp=ctx_result.baresexp + sep + task_result.baresexp,
                context_sexp=ctx_result.context_sexp,
                metadata=task_result.metadata,
                token_count=task_result.token_count + ctx_result.token_count,
            )

        return task_result


class _TaskBuilder:
    """Fluent builder for a task."""

    def __init__(
        self,
        task_data: Task,
        mode: OutputMode,
        context_data: Context | None = None,
    ) -> None:
        self._task_data = task_data
        self._mode = mode
        self._context_data: Context | None = context_data

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
        return _StepBuilder(self._task_data, s, self._mode, self._context_data)

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

    def context(
        self,
        name: str = "context",
        *,
        role: str | None = None,
        persona: str | None = None,
        background: str | None = None,
        domain: str | None = None,
        scope: str | None = None,
        decision: str | None = None,
        data: str | None = None,
    ) -> _ContextBuilder:
        ctx = Context(
            name=name,
            role=role,
            persona=persona,
            background=background,
            domain=domain,
            scope=scope,
            decision=decision,
            data=data,
        )
        return _ContextBuilder(ctx, self._mode, task_builder=self)

    def build(self) -> Task:
        return self._task_data

    def compile(
        self,
        *,
        mode: OutputMode | None = None,
        preserve_metadata: bool = True,
        condense: bool = False,
    ) -> BareSexpResult:
        task_result = compile_baresexp(
            self._task_data,
            mode=mode or self._mode,
            preserve_metadata=preserve_metadata,
            condense=condense,
        )

        if self._context_data:
            ctx_result = compile_context(
                self._context_data,
                mode=mode or self._mode,
                preserve_metadata=preserve_metadata,
                condense=condense,
            )
            # Merge metadata
            for key, entries in ctx_result.metadata.items():
                if key not in task_result.metadata:
                    task_result.metadata[key] = []
                task_result.metadata[key].extend(entries)
            sep = "" if condense else "\n"
            return BareSexpResult(
                baresexp=ctx_result.baresexp + sep + task_result.baresexp,
                context_sexp=ctx_result.context_sexp,
                metadata=task_result.metadata,
                token_count=task_result.token_count + ctx_result.token_count,
            )

        return task_result


class _ContextBuilder:
    """Fluent builder for a context document."""

    def __init__(
        self,
        context_data: Context,
        mode: OutputMode,
        task_builder: _TaskBuilder | None = None,
    ) -> None:
        self._context_data = context_data
        self._mode = mode
        self._task_builder = task_builder

    def role(self, value: str) -> _ContextBuilder:
        self._context_data.role = value
        return self

    def persona(self, value: str) -> _ContextBuilder:
        self._context_data.persona = value
        return self

    def background(self, value: str) -> _ContextBuilder:
        self._context_data.background = value
        return self

    def domain(self, value: str) -> _ContextBuilder:
        self._context_data.domain = value
        return self

    def constraint(self, value: str) -> _ContextBuilder:
        self._context_data.constraints.append(value)
        return self

    def fact(self, value: str) -> _ContextBuilder:
        self._context_data.facts.append(value)
        return self

    def scope(self, value: str) -> _ContextBuilder:
        self._context_data.scope = value
        return self

    def decision(self, value: str) -> _ContextBuilder:
        self._context_data.decision = value
        return self

    def data(self, value: str) -> _ContextBuilder:
        self._context_data.data = value
        return self

    def task(
        self,
        name: str = "task",
        *,
        description: str | None = None,
    ) -> _TaskBuilder:
        if self._task_builder:
            # Parent _TaskBuilder — set context on it
            self._task_builder._context_data = Context(
                name=self._context_data.name,
                role=self._context_data.role,
                persona=self._context_data.persona,
                background=self._context_data.background,
                domain=self._context_data.domain,
                constraints=list(self._context_data.constraints),
                facts=list(self._context_data.facts),
                scope=self._context_data.scope,
                decision=self._context_data.decision,
                data=self._context_data.data,
            )
            return self._task_builder
        # Standalone — create new TaskBuilder with context
        t = Task(name=name, description=description)
        return _TaskBuilder(t, self._mode, context_data=Context(
            name=self._context_data.name,
            role=self._context_data.role,
            persona=self._context_data.persona,
            background=self._context_data.background,
            domain=self._context_data.domain,
            constraints=list(self._context_data.constraints),
            facts=list(self._context_data.facts),
            scope=self._context_data.scope,
            decision=self._context_data.decision,
            data=self._context_data.data,
        ))

    def build(self) -> Context:
        return self._context_data

    def compile(
        self,
        *,
        mode: OutputMode | None = None,
        preserve_metadata: bool = True,
        condense: bool = False,
    ) -> BareSexpResult:
        return compile_context(
            self._context_data,
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

    def context(
        self,
        name: str = "context",
        *,
        role: str | None = None,
        persona: str | None = None,
        background: str | None = None,
        domain: str | None = None,
        scope: str | None = None,
        decision: str | None = None,
        data: str | None = None,
    ) -> _ContextBuilder:
        ctx = Context(
            name=name,
            role=role,
            persona=persona,
            background=background,
            domain=domain,
            scope=scope,
            decision=decision,
            data=data,
        )
        return _ContextBuilder(ctx, self._mode)


builder = BareSexpBuilder()
