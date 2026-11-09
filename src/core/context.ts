import {
  Context,
  CompileOptions,
  BareSexpResult,
  MetadataEntry,
  MetadataStore,
  OutputMode,
} from './types.js';
import { minimizeDescription } from './minimizer.js';
import { reduceNaturalLanguage } from './grammar/index.js';

function escapeToken(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

function formatValue(value: string, mode: OutputMode = 'full'): string {
  const normalized = value.trim();
  const effective = mode === 'minimal' ? minimizeDescription(normalized) : normalized;
  if (effective === '' || /[\s()"']/u.test(effective)) {
    return `"${escapeToken(effective)}"`;
  }
  return effective;
}

function reduceField(value: string, mode: OutputMode): string {
  if (mode === 'minimal') {
    const reduced = reduceNaturalLanguage(value, { aggressive: true });
    return reduced.simplified;
  }
  return value;
}

function addContextMetadata(
  metadata: MetadataStore,
  contextName: string,
  fieldPath: string,
  original: unknown,
  mode: OutputMode,
  preserveMetadata: boolean,
): void {
  if (!preserveMetadata) return;
  const shortened = mode === 'minimal' ? minimizeDescription(String(original)) : String(original);
  const entry: MetadataEntry = { original, shortened, fieldPath };
  const key = contextName || 'context';
  metadata[key] = [...(metadata[key] ?? []), entry];
}

function estimateTokenCount(value: string): number {
  return Math.max(1, Math.ceil(value.split(/\s+/u).filter(Boolean).length * 1.2));
}

export function compileContext(
  ctx: Context,
  options?: CompileOptions,
): BareSexpResult {
  const mode = options?.mode ?? 'full';
  const preserveMetadata = options?.preserveMetadata ?? true;
  const condense = options?.condense ?? false;
  const metadata: MetadataStore = {};
  const indent = condense ? '' : ' ';

  const lines: string[] = [`(context ${formatValue(ctx.name, mode)}`];

  if (ctx.role) {
    const reduced = reduceField(ctx.role, mode);
    addContextMetadata(metadata, ctx.name, 'role', ctx.role, mode, preserveMetadata);
    lines.push(`${indent}(role ${formatValue(reduced, mode)})`);
  }

  if (ctx.persona) {
    const reduced = reduceField(ctx.persona, mode);
    addContextMetadata(metadata, ctx.name, 'persona', ctx.persona, mode, preserveMetadata);
    lines.push(`${indent}(persona ${formatValue(reduced, mode)})`);
  }

  if (ctx.background) {
    const reduced = reduceField(ctx.background, mode);
    addContextMetadata(metadata, ctx.name, 'background', ctx.background, mode, preserveMetadata);
    lines.push(`${indent}(background ${formatValue(reduced, mode)})`);
  }

  if (ctx.domain) {
    const reduced = reduceField(ctx.domain, mode);
    addContextMetadata(metadata, ctx.name, 'domain', ctx.domain, mode, preserveMetadata);
    lines.push(`${indent}(domain ${formatValue(reduced, mode)})`);
  }

  if (ctx.scope) {
    const reduced = reduceField(ctx.scope, mode);
    addContextMetadata(metadata, ctx.name, 'scope', ctx.scope, mode, preserveMetadata);
    lines.push(`${indent}(scope ${formatValue(reduced, mode)})`);
  }

  if (ctx.decision) {
    const reduced = reduceField(ctx.decision, mode);
    addContextMetadata(metadata, ctx.name, 'decision', ctx.decision, mode, preserveMetadata);
    lines.push(`${indent}(decision ${formatValue(reduced, mode)})`);
  }

  if (ctx.data) {
    const reduced = reduceField(ctx.data, mode);
    addContextMetadata(metadata, ctx.name, 'data', ctx.data, mode, preserveMetadata);
    lines.push(`${indent}(data ${formatValue(reduced, mode)})`);
  }

  if (ctx.constraints && ctx.constraints.length > 0) {
    lines.push(`${indent}(constraints`);
    for (const c of ctx.constraints) {
      const reduced = reduceField(c, mode);
      addContextMetadata(metadata, ctx.name, `constraints.${c}`, c, mode, preserveMetadata);
      lines.push(`${indent}${indent}(constraint ${formatValue(reduced, mode)})`);
    }
    lines.push(`${indent})`);
  }

  if (ctx.facts && ctx.facts.length > 0) {
    lines.push(`${indent}(facts`);
    for (const f of ctx.facts) {
      const reduced = reduceField(f, mode);
      addContextMetadata(metadata, ctx.name, `facts.${f}`, f, mode, preserveMetadata);
      lines.push(`${indent}${indent}(fact ${formatValue(reduced, mode)})`);
    }
    lines.push(`${indent})`);
  }

  lines.push(')');

  const contextSexp = condense ? lines.join('') : lines.join('\n');
  const tokenCount = estimateTokenCount(contextSexp);

  return { baresexp: contextSexp, contextSexp, metadata, tokenCount };
}
