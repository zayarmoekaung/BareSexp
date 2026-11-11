import { Task, Step, Tool, OutputSpec, Options, CompileOptions, BareSexpResult, BareSexpParts, MetadataStore, OutputMode, Context } from './types.js';
import { compileBareSexp } from './compiler.js';
import { compileContext } from './context.js';
import { BareSexpDocument } from './document.js';

export interface BareSexpBuilder {
  task(input: Partial<Task>): TaskBuilder;
  context(input: Partial<Context>): ContextBuilder;
  document(): BareSexpDocument;
  minimal(): BareSexpBuilder;
  full(): BareSexpBuilder;
  compile(options?: CompileOptions): BareSexpResult;
  getMetadata(taskId?: string): MetadataStore;
  clearMetadata(): void;
}

export class TaskBuilder {
  private taskData: Task;
  private parent: BareSexpBuilderImpl | null;

  constructor(
    taskData: Partial<Task>,
    private compileContext: { mode: OutputMode; preserveMetadata: boolean; metadata: MetadataStore; contextData: Context | null },
    parent?: BareSexpBuilderImpl,
  ) {
    this.taskData = {
      name: taskData.name ?? 'task',
      description: taskData.description,
      steps: taskData.steps ?? [],
      tools: taskData.tools ?? [],
      output: taskData.output,
      options: taskData.options,
    };
    this.parent = parent ?? null;
  }

  step(input: Partial<Step>): StepBuilder {
    const step: Step = {
      name: input.name ?? 'step',
      description: input.description,
      tools: input.tools ?? [],
      input: input.input,
      output: input.output,
    };
    this.taskData.steps = [...(this.taskData.steps ?? []), step];
    return new StepBuilder(this.taskData, step, this.compileContext);
  }

  tool(input: Partial<Tool>): TaskBuilder {
    const tool: Tool = {
      name: input.name ?? 'tool',
      description: input.description,
      input: input.input,
      output: input.output,
    };
    this.taskData.tools = [...(this.taskData.tools ?? []), tool];
    return this;
  }

  output(input: Partial<OutputSpec>): TaskBuilder {
    this.taskData.output = { ...this.taskData.output, ...input };
    return this;
  }

  options(input: Partial<Options>): TaskBuilder {
    this.taskData.options = { ...this.taskData.options, ...input };
    return this;
  }

  context(input: Partial<Context>): ContextBuilder {
    return new ContextBuilder(input, this.compileContext, this.parent ?? undefined);
  }

  build(): Task {
    return this.taskData;
  }

  compile(options?: CompileOptions): BareSexpResult {
    const taskResult = compileBareSexp(this.taskData, {
      mode: options?.mode ?? this.compileContext.mode,
      preserveMetadata: options?.preserveMetadata ?? this.compileContext.preserveMetadata,
      condense: options?.condense ?? false,
    });
    Object.assign(this.compileContext.metadata, taskResult.metadata);

    // If context was also set, compile it and concatenate
    if (this.compileContext.contextData) {
      const ctxResult = compileContext(this.compileContext.contextData, {
        mode: options?.mode ?? this.compileContext.mode,
        preserveMetadata: options?.preserveMetadata ?? this.compileContext.preserveMetadata,
        condense: options?.condense ?? false,
      });
      Object.assign(this.compileContext.metadata, ctxResult.metadata);
      const fullBaresexp = ctxResult.baresexp + (options?.condense ? '' : '\n') + taskResult.baresexp;
      return {
        baresexp: fullBaresexp,
        contextSexp: ctxResult.contextSexp,
        metadata: this.compileContext.metadata,
        tokenCount: (taskResult.tokenCount ?? 0) + (ctxResult.tokenCount ?? 0),
      };
    }

    return taskResult;
  }
}

export class StepBuilder {
  constructor(
    private taskData: Task,
    private stepData: Step,
    private compileContext: { mode: OutputMode; preserveMetadata: boolean; metadata: MetadataStore; contextData: Context | null },
  ) {}

  tool(input: Partial<Tool>): StepBuilder {
    const tool: Tool = {
      name: input.name ?? 'tool',
      description: input.description,
      input: input.input,
      output: input.output,
    };
    this.stepData.tools = [...(this.stepData.tools ?? []), tool];
    return this;
  }

  step(input: Partial<Step>): StepBuilder {
    const step: Step = {
      name: input.name ?? 'step',
      description: input.description,
      tools: input.tools ?? [],
      input: input.input,
      output: input.output,
    };
    this.taskData.steps = [...(this.taskData.steps ?? []), step];
    return new StepBuilder(this.taskData, step, this.compileContext);
  }

  context(input: Partial<Context>): ContextBuilder {
    return new ContextBuilder(input, this.compileContext);
  }

  build(): Task {
    return this.taskData;
  }

  compile(options?: CompileOptions): BareSexpResult {
    const taskResult = compileBareSexp(this.taskData, {
      mode: options?.mode ?? this.compileContext.mode,
      preserveMetadata: options?.preserveMetadata ?? this.compileContext.preserveMetadata,
      condense: options?.condense ?? false,
    });
    Object.assign(this.compileContext.metadata, taskResult.metadata);

    if (this.compileContext.contextData) {
      const ctxResult = compileContext(this.compileContext.contextData, {
        mode: options?.mode ?? this.compileContext.mode,
        preserveMetadata: options?.preserveMetadata ?? this.compileContext.preserveMetadata,
        condense: options?.condense ?? false,
      });
      Object.assign(this.compileContext.metadata, ctxResult.metadata);
      const fullBaresexp = ctxResult.baresexp + (options?.condense ? '' : '\n') + taskResult.baresexp;
      return {
        baresexp: fullBaresexp,
        contextSexp: ctxResult.contextSexp,
        metadata: this.compileContext.metadata,
        tokenCount: (taskResult.tokenCount ?? 0) + (ctxResult.tokenCount ?? 0),
      };
    }

    return taskResult;
  }
}

export class ContextBuilder {
  private contextData: Context;
  private parent: BareSexpBuilderImpl | null;

  constructor(
    contextData: Partial<Context>,
    private compileContext: { mode: OutputMode; preserveMetadata: boolean; metadata: MetadataStore; contextData: Context | null },
    parent?: BareSexpBuilderImpl,
  ) {
    this.contextData = {
      name: contextData.name ?? 'context',
      role: contextData.role,
      persona: contextData.persona,
      background: contextData.background,
      domain: contextData.domain,
      constraints: contextData.constraints,
      facts: contextData.facts,
      scope: contextData.scope,
      decision: contextData.decision,
      data: contextData.data,
    };
    this.parent = parent ?? null;
  }

  role(value: string): this {
    this.contextData.role = value;
    return this;
  }

  persona(value: string): this {
    this.contextData.persona = value;
    return this;
  }

  background(value: string): this {
    this.contextData.background = value;
    return this;
  }

  domain(value: string): this {
    this.contextData.domain = value;
    return this;
  }

  constraint(value: string): this {
    this.contextData.constraints = [...(this.contextData.constraints ?? []), value];
    return this;
  }

  fact(value: string): this {
    this.contextData.facts = [...(this.contextData.facts ?? []), value];
    return this;
  }

  scope(value: string): this {
    this.contextData.scope = value;
    return this;
  }

  decision(value: string): this {
    this.contextData.decision = value;
    return this;
  }

  data(value: string): this {
    this.contextData.data = value;
    return this;
  }

  task(input: Partial<Task>): TaskBuilder {
    if (this.parent) {
      this.parent.contextData = { ...this.contextData };
      return this.parent.task(input);
    }
    this.compileContext.contextData = { ...this.contextData };
    return new TaskBuilder(input, this.compileContext, undefined);
  }

  build(): Context {
    return this.contextData;
  }

  compile(options?: CompileOptions): BareSexpResult {
    const result = compileContext(this.contextData, {
      mode: options?.mode ?? this.compileContext.mode,
      preserveMetadata: options?.preserveMetadata ?? this.compileContext.preserveMetadata,
      condense: options?.condense ?? false,
    });
    Object.assign(this.compileContext.metadata, result.metadata);
    return result;
  }
}

class BareSexpBuilderImpl implements BareSexpBuilder {
  private mode: OutputMode = 'full';
  private metadata: MetadataStore = {};
  contextData: Context | null = null;

  document(): BareSexpDocument {
    return new BareSexpDocument();
  }

  task(input: Partial<Task>): TaskBuilder {
    const ctxData = this.contextData;
    this.contextData = null; // Reset after use
    return new TaskBuilder(input, { mode: this.mode, preserveMetadata: true, metadata: this.metadata, contextData: ctxData }, this);
  }

  context(input: Partial<Context>): ContextBuilder {
    return new ContextBuilder(input, { mode: this.mode, preserveMetadata: true, metadata: this.metadata, contextData: this.contextData }, this);
  }

  minimal(): this {
    this.mode = 'minimal';
    return this;
  }

  full(): this {
    this.mode = 'full';
    return this;
  }

  compile(options?: CompileOptions): BareSexpResult {
    const task = { name: 'task' } as Task;
    return compileBareSexp(task, { ...options, mode: options?.mode ?? this.mode });
  }

  getMetadata(taskId?: string): MetadataStore {
    if (taskId) {
      return { [taskId]: this.metadata[taskId] ?? [] };
    }
    return this.metadata;
  }

  clearMetadata(): void {
    this.metadata = {};
  }
}

export const builder: BareSexpBuilder = new BareSexpBuilderImpl();
