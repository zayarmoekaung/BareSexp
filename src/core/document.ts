import { Context, Task, CompileOptions, BareSexpResult, BareSexpParts, MetadataStore, OutputMode } from './types.js';
import { compileBareSexp } from './compiler.js';
import { compileContext } from './context.js';

export class BareSexpDocument {
  private contexts: Context[] = [];
  private tasks: Task[] = [];
  private mode: OutputMode = 'full';

  minimal(): this {
    this.mode = 'minimal';
    return this;
  }

  full(): this {
    this.mode = 'full';
    return this;
  }

  context(input: Partial<Context>): this {
    this.contexts.push({
      name: input.name ?? 'context',
      role: input.role,
      persona: input.persona,
      background: input.background,
      domain: input.domain,
      scope: input.scope,
      decision: input.decision,
      data: input.data,
      constraints: input.constraints ?? [],
      facts: input.facts ?? [],
    });
    return this;
  }

  task(input: Partial<Task>): this {
    this.tasks.push({
      name: input.name ?? 'task',
      description: input.description,
      content: input.content,
      steps: input.steps ?? [],
      tools: input.tools ?? [],
      output: input.output,
      options: input.options,
    });
    return this;
  }

  /** Returns the last added task, or undefined if none. */
  lastTask(): Task | undefined {
    return this.tasks[this.tasks.length - 1];
  }

  private compileOpts(options?: CompileOptions): CompileOptions {
    return { mode: options?.mode ?? this.mode, preserveMetadata: options?.preserveMetadata ?? true, condense: options?.condense ?? false };
  }

  /** Compile the entire document (context + task concatenated). */
  compile(options?: CompileOptions): BareSexpResult {
    const opts = this.compileOpts(options);
    const metadata: MetadataStore = {};
    const parts: string[] = [];

    for (const ctx of this.contexts) {
      const r = compileContext(ctx, opts);
      Object.assign(metadata, r.metadata);
      parts.push(r.baresexp);
    }
    for (const t of this.tasks) {
      const r = compileBareSexp(t, opts);
      Object.assign(metadata, r.metadata);
      parts.push(r.baresexp);
    }

    const sep = opts.condense ? '' : '\n';
    const full = parts.join(sep);
    const tokenCount = parts.reduce((sum, p) => sum + estimateTokenCount(p), 0);
    return { baresexp: full, metadata, tokenCount };
  }

  /** Compile only the context part. */
  compileContext(options?: CompileOptions): BareSexpResult {
    const opts = this.compileOpts(options);
    const metadata: MetadataStore = {};
    const parts: string[] = [];

    for (const ctx of this.contexts) {
      const r = compileContext(ctx, opts);
      Object.assign(metadata, r.metadata);
      parts.push(r.baresexp);
    }

    const sep = opts.condense ? '' : '\n';
    const baresexp = parts.join(sep);
    const tokenCount = parts.reduce((sum, p) => sum + estimateTokenCount(p), 0);
    return { baresexp, metadata, tokenCount };
  }

  /** Compile only the task part. */
  compileTask(options?: CompileOptions): BareSexpResult {
    const opts = this.compileOpts(options);
    const metadata: MetadataStore = {};
    const parts: string[] = [];

    for (const t of this.tasks) {
      const r = compileBareSexp(t, opts);
      Object.assign(metadata, r.metadata);
      parts.push(r.baresexp);
    }

    const sep = opts.condense ? '' : '\n';
    const baresexp = parts.join(sep);
    const tokenCount = parts.reduce((sum, p) => sum + estimateTokenCount(p), 0);
    return { baresexp, metadata, tokenCount };
  }

  /** Compile into separate context and task strings, plus the full concatenation. */
  compileParts(options?: CompileOptions): BareSexpParts {
    const opts = this.compileOpts(options);
    const sep = opts.condense ? '' : '\n';

    const ctxParts: string[] = [];
    for (const ctx of this.contexts) {
      ctxParts.push(compileContext(ctx, opts).baresexp);
    }
    const context = ctxParts.join(sep);

    const taskParts: string[] = [];
    for (const t of this.tasks) {
      taskParts.push(compileBareSexp(t, opts).baresexp);
    }
    const task = taskParts.join(sep);

    const full = [context, task].filter(Boolean).join(sep);
    return { context, task, full };
  }
}

function estimateTokenCount(value: string): number {
  return Math.max(1, Math.ceil(value.split(/\s+/u).filter(Boolean).length * 1.2));
}
