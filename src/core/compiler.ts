import { Task, Step, Tool, OutputSpec, Options } from './types.js';

function escapeToken(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

function formatValue(value: unknown): string {
  if (typeof value === 'string') {
    const normalized = value.trim();
    if (normalized === '' || /[\s()"']/u.test(normalized)) {
      return `"${escapeToken(normalized)}"`;
    }
    return normalized;
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  return 'null';
}

export function compileBareSexp(task: Task): string {
  const indent = '  ';
  const lines: string[] = [`(task ${formatValue(task.name)}`];

  if (task.description) {
    lines.push(`${indent}(description ${formatValue(task.description)})`);
  }

  if (task.steps && task.steps.length > 0) {
    lines.push(`${indent}(steps`);
    for (const step of task.steps) {
      lines.push(compileStep(step, 2));
    }
    lines.push(`${indent})`);
  }

  if (task.tools && task.tools.length > 0) {
    lines.push(`${indent}(tools`);
    for (const tool of task.tools) {
      lines.push(compileTool(tool, 2));
    }
    lines.push(`${indent})`);
  }

  if (task.output) {
    lines.push(compileOutput(task.output, 1));
  }

  if (task.options) {
    lines.push(compileOptions(task.options, 1));
  }

  lines.push(')');
  return lines.join('\n');
}

function compileStep(step: Step, indentLevel: number): string {
  const indent = '  '.repeat(indentLevel);
  const childIndent = '  '.repeat(indentLevel + 1);
  const hasChildren = Boolean(step.description || step.tools?.length || step.input || step.output);

  if (!hasChildren) {
    return `${indent}(step ${formatValue(step.name)})`;
  }

  const lines: string[] = [`${indent}(step ${formatValue(step.name)}`];
  if (step.description) {
    lines.push(`${childIndent}(description ${formatValue(step.description)})`);
  }
  if (step.tools && step.tools.length > 0) {
    lines.push(`${childIndent}(tools`);
    for (const tool of step.tools) {
      lines.push(compileTool(tool, indentLevel + 2));
    }
    lines.push(`${childIndent})`);
  }
  if (step.input) {
    lines.push(`${childIndent}(input ${formatValue(step.input)})`);
  }
  if (step.output) {
    lines.push(`${childIndent}(output ${formatValue(step.output)})`);
  }
  lines.push(`${indent})`);
  return lines.join('\n');
}

function compileTool(tool: Tool, indentLevel: number): string {
  const indent = '  '.repeat(indentLevel);
  const childIndent = '  '.repeat(indentLevel + 1);
  const hasChildren = Boolean(tool.description || tool.input || tool.output);

  if (!hasChildren) {
    return `${indent}(tool ${formatValue(tool.name)})`;
  }

  const lines: string[] = [`${indent}(tool ${formatValue(tool.name)}`];
  if (tool.description) {
    lines.push(`${childIndent}(description ${formatValue(tool.description)})`);
  }
  if (tool.input) {
    lines.push(`${childIndent}(input ${formatValue(tool.input)})`);
  }
  if (tool.output) {
    lines.push(`${childIndent}(output ${formatValue(tool.output)})`);
  }
  lines.push(`${indent})`);
  return lines.join('\n');
}

function compileOutput(output: OutputSpec, indentLevel: number): string {
  const indent = '  '.repeat(indentLevel);
  const childIndent = '  '.repeat(indentLevel + 1);
  const lines: string[] = [`${indent}(output`];
  if (output.format) {
    lines.push(`${childIndent}(format ${formatValue(output.format)})`);
  }
  if (output.schema) {
    lines.push(`${childIndent}(schema ${formatValue(output.schema)})`);
  }
  if (output.description) {
    lines.push(`${childIndent}(description ${formatValue(output.description)})`);
  }
  lines.push(`${indent})`);
  return lines.join('\n');
}

function compileOptions(options: Options, indentLevel: number): string {
  const indent = '  '.repeat(indentLevel);
  const childIndent = '  '.repeat(indentLevel + 1);
  const lines: string[] = [`${indent}(options`];
  if (options.strict !== undefined) {
    lines.push(`${childIndent}(strict ${formatValue(options.strict)})`);
  }
  if (options.indent !== undefined) {
    lines.push(`${childIndent}(indent ${formatValue(options.indent)})`);
  }
  if (options.includeMetadata !== undefined) {
    lines.push(`${childIndent}(includeMetadata ${formatValue(options.includeMetadata)})`);
  }
  lines.push(`${indent})`);
  return lines.join('\n');
}
