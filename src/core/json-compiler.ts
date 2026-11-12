import { CompileOptions } from './types.js';
import { minimizeFieldName } from './minimizer.js';

const SPECIAL_CHARS = /[\s()"@,{}\[\]]/u;

function escapeToken(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

function formatValue(value: unknown, mode: CompileOptions['mode'] = 'full'): string {
  if (typeof value === 'string') {
    const normalized = value.trim();
    if (normalized === '' || SPECIAL_CHARS.test(normalized)) {
      return `"${escapeToken(normalized)}"`;
    }
    return mode === 'minimal' ? minimizeFieldName(normalized) : normalized;
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  if (value === null || value === undefined) {
    return 'null';
  }
  return `"${escapeToken(JSON.stringify(value))}"`;
}

function compileObject(
  obj: Record<string, unknown>,
  indentLevel: number,
  mode: CompileOptions['mode'],
  condense: boolean,
): string {
  const childIndent = condense ? '' : '  '.repeat(indentLevel + 1);
  const entries = Object.entries(obj);
  const lines: string[] = [];

  for (const [key, value] of entries) {
    const fieldName = mode === 'minimal' ? minimizeFieldName(key) : key;
    if (value === null || value === undefined) {
      lines.push(`${childIndent}(${fieldName} null)`);
    } else if (Array.isArray(value)) {
      lines.push(`${childIndent}(${fieldName}`);
      for (const item of value) {
        if (typeof item === 'object' && item !== null && !Array.isArray(item)) {
          lines.push(`${childIndent}  (item`);
          lines.push(compileObject(item as Record<string, unknown>, indentLevel + 3, mode, condense));
          lines.push(`${childIndent}  )`);
        } else {
          lines.push(`${childIndent}  (item ${formatValue(item, mode)})`);
        }
      }
      lines.push(`${childIndent})`);
    } else if (typeof value === 'object') {
      lines.push(`${childIndent}(${fieldName}`);
      lines.push(compileObject(value as Record<string, unknown>, indentLevel + 2, mode, condense));
      lines.push(`${childIndent})`);
    } else {
      lines.push(`${childIndent}(${fieldName} ${formatValue(value, mode)})`);
    }
  }

  return lines.join(condense ? '' : '\n');
}

/**
 * Compile a JSON-compatible object into a plain BareSexp s-expression.
 * No wrapper tag — just `(key value) ...` pairs.
 */
export function compileJson(obj: Record<string, unknown>, options?: CompileOptions): string {
  const mode = options?.mode ?? 'full';
  const condense = options?.condense ?? false;
  return compileObject(obj, 0, mode, condense);
}

function unquoteScalar(token: string): unknown {
  if (token.startsWith('"') && token.endsWith('"')) {
    return token.slice(1, -1).replace(/\\"/g, '"').replace(/\\\\/g, '\\');
  }
  if (token === 'true') return true;
  if (token === 'false') return false;
  if (token === 'null') return null;
  if (/^-?\d+(\.\d+)?$/u.test(token)) return Number(token);
  return token;
}

function tokenizeSexp(input: string): string[] {
  const tokens: string[] = [];
  let i = 0;
  while (i < input.length) {
    const ch = input[i];
    if (/\s/u.test(ch)) { i++; continue; }
    if (ch === '(' || ch === ')') { tokens.push(ch); i++; continue; }
    if (ch === '"') {
      let val = '"';
      i++;
      while (i < input.length) {
        const c = input[i];
        if (c === '\\' && i + 1 < input.length) { val += c + input[i + 1]; i += 2; continue; }
        if (c === '"') { val += '"'; i++; break; }
        val += c; i++;
      }
      tokens.push(val);
      continue;
    }
    let val = '';
    while (i < input.length && !/[\s()]/u.test(input[i])) { val += input[i]; i++; }
    tokens.push(val);
  }
  return tokens;
}

function parseSexpValue(tokens: string[], pos: { i: number }): unknown {
  if (pos.i >= tokens.length) return null;
  if (tokens[pos.i] !== '(') {
    return unquoteScalar(tokens[pos.i++]);
  }
  pos.i++; // skip (
  const key = tokens[pos.i++];
  if (key === 'item') {
    if (pos.i < tokens.length && tokens[pos.i] === '(') {
      const v = parseSexpObj(tokens, pos);
      pos.i++; // skip )
      return v;
    }
    const scalar = unquoteScalar(tokens[pos.i++]);
    return scalar;
  }
  if (pos.i < tokens.length && tokens[pos.i] === '(') {
    const peekPos = pos.i + 1;
    if (peekPos < tokens.length && tokens[peekPos] === 'item') {
      const arr: unknown[] = [];
      while (pos.i < tokens.length && tokens[pos.i] !== ')') {
        if (tokens[pos.i] === '(') {
          pos.i++;
          const itemKey = tokens[pos.i++];
          if (itemKey === 'item') {
            if (pos.i < tokens.length && tokens[pos.i] === '(') {
              arr.push(parseSexpObj(tokens, pos));
              pos.i++;
            } else {
              arr.push(unquoteScalar(tokens[pos.i++]));
            }
          }
          if (pos.i < tokens.length && tokens[pos.i] === ')') {
            pos.i++;
          }
        }
      }
      return { [key]: arr };
    } else {
      const obj = parseSexpObj(tokens, pos);
      pos.i++;
      return { [key]: obj };
    }
  }
  const val = unquoteScalar(tokens[pos.i++]);
  return { [key]: val };
}

function parseSexpObj(tokens: string[], pos: { i: number }): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  while (pos.i < tokens.length && tokens[pos.i] !== ')') {
    if (tokens[pos.i] === '(') {
      const entry = parseSexpValue(tokens, pos);
      if (entry !== null && entry !== undefined && typeof entry === 'object' && !Array.isArray(entry)) {
        Object.assign(result, entry as Record<string, unknown>);
      }
      if (pos.i < tokens.length && tokens[pos.i] === ')') {
        pos.i++;
      }
    } else {
      pos.i++;
    }
  }
  return result;
}

/**
 * Parse a BareSexp s-expression back into a JSON-compatible object.
 * Accepts both wrapped `(json ...)` and plain `(key value) ...` forms.
 */
export function parseJson(input: string): Record<string, unknown> {
  const tokens = tokenizeSexp(input.trim());
  if (tokens.length === 0) return {};

  // Handle optional (json ...) wrapper
  let startIdx = 0;
  if (tokens[0] === '(' && tokens.length > 1 && tokens[1] === 'json') {
    startIdx = 2; // skip (json
  }

  const pos = { i: startIdx };
  const result = parseSexpObj(tokens, pos);
  return result;
}
