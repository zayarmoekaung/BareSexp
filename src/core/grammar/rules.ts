import { GrammarRule, RuleCategory, RuleAction } from './types.js';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const rawRules = require('./default-rules.json');

function normalizeVerbForm(base: string): string {
  if (base.length > 2 && base[base.length - 1] === base[base.length - 2]) {
    return base.slice(0, -1);
  }
  if (base.endsWith('ie')) {
    return base.slice(0, -2) + 'y';
  }
  return base;
}

export const defaultGrammarRules: GrammarRule[] = rawRules.map((r: {
  id: string;
  priority: number;
  pattern: string;
  category: string;
  action: string;
  replacement?: string;
  example?: { before: string; after: string };
  enabled?: boolean;
}) => {
  let replacement: string | ((m: string) => string) | undefined;
  if (r.action === 'normalize') {
    if (r.id === 'vrb-001') {
      replacement = (match: string) => normalizeVerbForm(match.slice(0, -3));
    } else if (r.id === 'vrb-002') {
      replacement = (match: string) => match.replace(/(?:ed|tion|sion|ment)$/i, '');
    }
  } else if (r.replacement) {
    replacement = r.replacement;
  }

  return {
    id: r.id,
    priority: r.priority,
    pattern: new RegExp(r.pattern, 'gi'),
    category: r.category as RuleCategory,
    action: r.action as RuleAction,
    replacement,
    example: r.example,
    enabled: r.enabled !== false,
  };
});

/**
 * Load custom rules from a JSON string.
 * Useful for loading user-provided rule files.
 */
export function loadRulesFromJson(jsonString: string): GrammarRule[] {
  const raw: Array<{
    id: string;
    priority: number;
    pattern: string;
    category: string;
    action: string;
    replacement?: string;
    example?: { before: string; after: string };
    enabled?: boolean;
  }> = JSON.parse(jsonString);

  return raw.map((r) => {
    let replacement: string | ((m: string) => string) | undefined;
    if (r.action === 'normalize') {
      if (r.id === 'vrb-001') {
        replacement = (match: string) => {
          const base = match.slice(0, -3);
          if (base.length > 2 && base[base.length - 1] === base[base.length - 2]) {
            return base.slice(0, -1);
          }
          if (base.endsWith('ie')) return base.slice(0, -2) + 'y';
          return base;
        };
      } else if (r.id === 'vrb-002') {
        replacement = (match: string) => match.replace(/(?:ed|tion|sion|ment)$/i, '');
      }
    } else if (r.replacement) {
      replacement = r.replacement;
    }

    return {
      id: r.id,
      priority: r.priority,
      pattern: new RegExp(r.pattern, 'gi'),
      category: r.category as RuleCategory,
      action: r.action as RuleAction,
      replacement,
      example: r.example,
      enabled: r.enabled !== false,
    };
  });
}
