"""Document — root container for BareSexp context and task nodes."""

from __future__ import annotations

from .compiler import compile_baresexp
from .context import compile_context
from .types import (
    BareSexpParts,
    BareSexpResult,
    CompileOptions,
    Context,
    MetadataEntry,
    MetadataStore,
    OutputMode,
    Task,
)


class BareSexpDocument:
    """Root container for BareSexp documents. Holds contexts and tasks
    and provides compile methods for each part separately or together."""

    def __init__(self) -> None:
        self._contexts: list[Context] = []
        self._tasks: list[Task] = []
        self._mode: OutputMode = "full"

    def minimal(self) -> BareSexpDocument:
        self._mode = "minimal"
        return self

    def full(self) -> BareSexpDocument:
        self._mode = "full"
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
        constraints: list[str] | None = None,
        facts: list[str] | None = None,
    ) -> BareSexpDocument:
        self._contexts.append(
            Context(
                name=name,
                role=role,
                persona=persona,
                background=background,
                domain=domain,
                scope=scope,
                decision=decision,
                data=data,
                constraints=constraints or [],
                facts=facts or [],
            )
        )
        return self

    def task(
        self,
        name: str = "task",
        *,
        description: str | None = None,
        content: str | None = None,
        steps: list | None = None,
        tools: list | None = None,
        output=None,
        options=None,
    ) -> BareSexpDocument:
        self._tasks.append(
            Task(
                name=name,
                description=description,
                content=content,
                steps=steps or [],
                tools=tools or [],
                output=output,
                options=options,
            )
        )
        return self

    def last_task(self) -> Task | None:
        """Returns the last added task, or None if no tasks."""
        return self._tasks[-1] if self._tasks else None

    def _opts(self, options: CompileOptions | None = None) -> CompileOptions:
        if options is None:
            return CompileOptions(mode=self._mode)
        if options.mode is None:
            options.mode = self._mode
        if options.preserve_metadata is None:
            options.preserve_metadata = True
        return options

    def compile(self, *, options: CompileOptions | None = None) -> BareSexpResult:
        """Compile the entire document (context + task concatenated)."""
        opts = self._opts(options)
        metadata: MetadataStore = {}
        parts: list[str] = []

        for ctx in self._contexts:
            r = compile_context(ctx, mode=opts.mode, preserve_metadata=opts.preserve_metadata, condense=opts.condense)
            for key, entries in r.metadata.items():
                if key not in metadata:
                    metadata[key] = []
                metadata[key].extend(entries)
            parts.append(r.baresexp)

        for t in self._tasks:
            r = compile_baresexp(t, mode=opts.mode, preserve_metadata=opts.preserve_metadata, condense=opts.condense)
            for key, entries in r.metadata.items():
                if key not in metadata:
                    metadata[key] = []
                metadata[key].extend(entries)
            parts.append(r.baresexp)

        sep = "" if opts.condense else "\n"
        full = sep.join(parts)
        token_count = sum(_estimate_token_count(p) for p in parts)
        return BareSexpResult(baresexp=full, metadata=metadata, token_count=token_count)

    def compile_context(self, *, options: CompileOptions | None = None) -> BareSexpResult:
        """Compile only the context part."""
        opts = self._opts(options)
        metadata: MetadataStore = {}
        parts: list[str] = []

        for ctx in self._contexts:
            r = compile_context(ctx, mode=opts.mode, preserve_metadata=opts.preserve_metadata, condense=opts.condense)
            for key, entries in r.metadata.items():
                if key not in metadata:
                    metadata[key] = []
                metadata[key].extend(entries)
            parts.append(r.baresexp)

        sep = "" if opts.condense else "\n"
        baresexp = sep.join(parts)
        token_count = sum(_estimate_token_count(p) for p in parts)
        return BareSexpResult(baresexp=baresexp, metadata=metadata, token_count=token_count)

    def compile_task(self, *, options: CompileOptions | None = None) -> BareSexpResult:
        """Compile only the task part."""
        opts = self._opts(options)
        metadata: MetadataStore = {}
        parts: list[str] = []

        for t in self._tasks:
            r = compile_baresexp(t, mode=opts.mode, preserve_metadata=opts.preserve_metadata, condense=opts.condense)
            for key, entries in r.metadata.items():
                if key not in metadata:
                    metadata[key] = []
                metadata[key].extend(entries)
            parts.append(r.baresexp)

        sep = "" if opts.condense else "\n"
        baresexp = sep.join(parts)
        token_count = sum(_estimate_token_count(p) for p in parts)
        return BareSexpResult(baresexp=baresexp, metadata=metadata, token_count=token_count)

    def compile_parts(self, *, options: CompileOptions | None = None) -> BareSexpParts:
        """Compile into separate context and task strings, plus full concatenation."""
        opts = self._opts(options)
        sep = "" if opts.condense else "\n"

        ctx_parts: list[str] = []
        for ctx in self._contexts:
            ctx_parts.append(
                compile_context(ctx, mode=opts.mode, preserve_metadata=opts.preserve_metadata, condense=opts.condense).baresexp
            )
        context = sep.join(ctx_parts)

        task_parts: list[str] = []
        for t in self._tasks:
            task_parts.append(
                compile_baresexp(t, mode=opts.mode, preserve_metadata=opts.preserve_metadata, condense=opts.condense).baresexp
            )
        task = sep.join(task_parts)

        full = sep.join(p for p in [context, task] if p)
        return BareSexpParts(context=context, task=task, full=full)


def _estimate_token_count(value: str) -> int:
    return max(1, int(len(value.split()) * 1.2))
