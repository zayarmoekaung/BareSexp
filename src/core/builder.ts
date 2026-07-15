import { Task, Step, Tool, OutputSpec, Options, CompileOptions, BareSexpResult, MetadataStore, OutputMode } from './types.js';
import { compileBareSexp } from './compiler.js';

export interface BareSexpBuilder {
  task(input: Partial<Task>): TaskBuilder;
  minimal(): BareSexpBuilder;
  full(): BareSexpBuilder;
  compile(options?: CompileOptions): BareSexpResult;
  getMetadata(taskId?: string): MetadataStore;
  clearMetadata(): void;
}

export class TaskBuilder {
  private taskData: Task;

  constructor(
    taskData: Partial<Task>,
    private compileContext: { mode: OutputMode; preserveMetadata: boolean; metadata: MetadataStore } = { mode: 'full', preserveMetadata: true, metadata: {} },
  ) {
    this.taskData = {
      name: taskData.name ?? 'task',
      description: taskData.description,
      steps: taskData.steps ?? [],
      tools: taskData.tools ?? [],
      output: taskData.output,
      options: taskData.options,
    };
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
    return new StepBuilder(this.taskData, step);
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

  build(): Task {
    return this.taskData;
  }

  compile(options?: CompileOptions): BareSexpResult {
    const result = compileBareSexp(this.taskData, {
      mode: options?.mode ?? this.compileContext.mode,
      preserveMetadata: options?.preserveMetadata ?? this.compileContext.preserveMetadata,
      condense: options?.condense ?? false,
    });
    Object.assign(this.compileContext.metadata, result.metadata);
    return result;
  }
}

export class StepBuilder {
  constructor(
    private taskData: Task,
    private stepData: Step,
    private compileContext: { mode: OutputMode; preserveMetadata: boolean; metadata: MetadataStore } = { mode: 'full', preserveMetadata: true, metadata: {} },
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

  build(): Task {
    return this.taskData;
  }

  compile(options?: CompileOptions): BareSexpResult {
    const result = compileBareSexp(this.taskData, {
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

  task(input: Partial<Task>): TaskBuilder {
    return new TaskBuilder(input, { mode: this.mode, preserveMetadata: true, metadata: this.metadata });
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
