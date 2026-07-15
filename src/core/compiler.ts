import { Task, Step, Tool, OutputSpec, Options, CompileOptions, BareSexpResult, MetadataEntry, MetadataStore } from './types.js';
import { minimizeDescription } from './minimizer.js';

function escapeToken(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

function formatValue(value: unknown, mode: CompileOptions['mode'] = 'full'): string {
  if (typeof value === 'string') {
    const normalized = value.trim();
    const effective = mode === 'minimal' ? minimizeDescription(normalized) : normalized;
    if (effective === '' || /[\s()"']/u.test(effective)) {
      return `"${escapeToken(effective)}"`;
    }
    return effective;
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  return 'null';
}

export function compileBareSexp(task: Task, options?: CompileOptions): BareSexpResult {
  const mode = options?.mode ?? 'full';
  const preserveMetadata = options?.preserveMetadata ?? true;
  const metadata: MetadataStore = {};
  const indent = '  ';
  const lines: string[] = [`(task ${formatValue(task.name, mode)}`];

  if (task.description) {
    addMetadata(metadata, task.name, 'description', task.description, mode, preserveMetadata);
    lines.push(`${indent}(description ${formatValue(task.description, mode)})`);
  }

  if (task.steps && task.steps.length > 0) {
    lines.push(`${indent}(steps`);
    for (const step of task.steps) {
      lines.push(compileStep(step, 2, mode, metadata, preserveMetadata, task.name));
    }
    lines.push(`${indent})`);
  }

  if (task.tools && task.tools.length > 0) {
    lines.push(`${indent}(tools`);
    for (const tool of task.tools) {
      lines.push(compileTool(tool, 2, mode, metadata, preserveMetadata, task.name));
    }
    lines.push(`${indent})`);
  }

  lines.push(')');
  const baresexp = lines.join('\n');
  const tokenCount = estimateTokenCount(baresexp);
  return { baresexp, metadata, tokenCount };
}

function compileStep(step: Step, indentLevel: number, mode: CompileOptions['mode'], metadata: MetadataStore, preserveMetadata: boolean, taskId: string): string {
  const indent = '  '.repeat(indentLevel);
  const childIndent = '  '.repeat(indentLevel + 1);
  const hasChildren = Boolean(step.description || step.tools?.length || step.input || step.output);
  const lines: string[] = [`${indent}(step ${formatValue(step.name, mode)}`];

  if (step.description) {
    addMetadata(metadata, taskId, `steps.${step.name}.description`, step.description, mode, preserveMetadata);
    lines.push(`${childIndent}(description ${formatValue(step.description, mode)})`);
  }
  if (step.tools && step.tools.length > 0) {
    lines.push(`${childIndent}(tools`);
    for (const tool of step.tools) {
      lines.push(compileTool(tool, indentLevel + 2, mode, metadata, preserveMetadata, taskId));
    }
    lines.push(`${childIndent})`);
  }
  if (step.input) {
    lines.push(`${childIndent}(input ${formatValue(step.input, mode)})`);
  }
  if (step.output) {
    lines.push(`${childIndent}(output ${formatValue(step.output, mode)})`);
  }
  if (!hasChildren) {
    return `${indent}(step ${formatValue(step.name, mode)})`;
  }
  lines.push(`${indent})`);
  return lines.join('\n');
}

function compileTool(tool: Tool, indentLevel: number, mode: CompileOptions['mode'], metadata: MetadataStore, preserveMetadata: boolean, taskId: string): string {
  const indent = '  '.repeat(indentLevel);
  const childIndent = '  '.repeat(indentLevel + 1);
  const hasChildren = Boolean(tool.description || tool.input || tool.output);
  const lines: string[] = [`${indent}(tool ${formatValue(tool.name, mode)}`];

  if (tool.description) {
    addMetadata(metadata, taskId, `tools.${tool.name}.description`, tool.description, mode, preserveMetadata);
    lines.push(`${childIndent}(description ${formatValue(tool.description, mode)})`);
  }
  if (tool.input) {
    lines.push(`${childIndent}(input ${formatValue(tool.input, mode)})`);
  }
  if (tool.output) {
    lines.push(`${childIndent}(output ${formatValue(tool.output, mode)})`);
  }
  if (!hasChildren) {
    return `${indent}(tool ${formatValue(tool.name, mode)})`;
  }
  lines.push(`${indent})`);
  return lines.join('\n');
}

function addMetadata(metadata: MetadataStore, taskId: string, fieldPath: string, original: unknown, mode: CompileOptions['mode'], preserveMetadata: boolean): MetadataEntry | undefined {
  if (!preserveMetadata) {
    return undefined;
  }
  const shortened = mode === 'minimal' ? minimizeDescription(String(original)) : String(original);
  const entry: MetadataEntry = { original, shortened, fieldPath };
  metadata[taskId] = [...(metadata[taskId] ?? []), entry];
  return entry;
}

function estimateTokenCount(value: string): number {
  return Math.max(1, Math.ceil(value.split(/\s+/u).filter(Boolean).length * 1.2));
}
