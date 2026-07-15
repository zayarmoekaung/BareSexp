import { Task, Step, Tool, OutputSpec, Options } from './types.js';
import { compileBareSexp } from './compiler.js';

export interface BareSexpBuilder {
  task(input: Partial<Task>): TaskBuilder;
}

export class TaskBuilder {
  private taskData: Task;

  constructor(taskData: Partial<Task>) {
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

  compile(): string {
    return compileBareSexp(this.taskData);
  }
}

export class StepBuilder {
  constructor(
    private taskData: Task,
    private stepData: Step,
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
    return new StepBuilder(this.taskData, step);
  }

  build(): Task {
    return this.taskData;
  }

  compile(): string {
    return compileBareSexp(this.taskData);
  }
}

class BareSexpBuilderImpl implements BareSexpBuilder {
  task(input: Partial<Task>): TaskBuilder {
    return new TaskBuilder(input);
  }
}

export const builder: BareSexpBuilder = new BareSexpBuilderImpl();
