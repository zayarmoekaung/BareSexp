import { GrammarRule, ReduceOptions, ReduceResult } from './types.js';
import { defaultGrammarRules } from './rules.js';

export function reduceNaturalLanguage(
  text: string,
  options?: ReduceOptions,
  customRules?: GrammarRule[],
): ReduceResult {
  const opts: ReduceOptions = {
    keepArticles: false,
    keepPoliteness: false,
    aggressive: false,
    toBareSexp: false,
    ...options,
  };

  // Merge and filter rules
  let rules = [...defaultGrammarRules];
  if (customRules && customRules.length > 0) {
    rules = [...customRules, ...rules];
  }

  // Apply option-based filtering
  rules = rules.filter((rule) => {
    // Aggressive mode: enable rules that are disabled specifically for aggressiveness
    if (opts.aggressive && rule.id.startsWith('agr')) {
      return true;
    }
    // Skip explicitly disabled rules (non-aggressive ones)
    if (rule.enabled === false) return false;
    // Option-based exclusions
    if (rule.category === 'articles' && opts.keepArticles) return false;
    if (rule.category === 'politeness' && opts.keepPoliteness) return false;
    return true;
  });

  // Sort by priority descending
  rules.sort((a, b) => b.priority - a.priority);

  let result = text;
  const appliedRules: string[] = [];

  for (const rule of rules) {
    const { pattern, action, replacement } = rule;
    // Test if pattern matches
    const testPattern = new RegExp(pattern.source, pattern.flags);
    if (testPattern.test(result)) {
      appliedRules.push(rule.id);

      switch (action) {
        case 'remove':
          result = result.replace(pattern, '');
          break;
        case 'replace':
          result = result.replace(pattern, replacement as string);
          break;
        case 'rewrite':
        case 'normalize':
          if (typeof replacement === 'function') {
            result = result.replace(pattern, (match, ...args) =>
              replacement(match, args as unknown as RegExpMatchArray | undefined),
            );
          } else if (replacement) {
            result = result.replace(pattern, replacement);
          } else {
            // normalize without explicit replacement: just remove match
            result = result.replace(pattern, '');
          }
          break;
      }
    }
  }

  // Clean up whitespace and punctuation
  result = result
    .replace(/\s{2,}/g, ' ') // collapse multiple spaces
    .replace(/\s*([.,;!?])\s*/g, '$1') // tighten punctuation
    .replace(/^[\s.,;!?]+|[\s.,;!?]+$/g, '') // trim leading/trailing punctuation+space
    .replace(/\s{2,}/g, ' ') // second pass after replacements
    .trim();

  // Normalize to sentence case
  if (result.length > 0) {
    result = result.charAt(0).toUpperCase() + result.slice(1).toLowerCase();
  }

  const reduceResult: ReduceResult = {
    original: text,
    simplified: result,
    appliedRules,
  };

  // Optional: convert to BareSexp
  if (opts.toBareSexp && result) {
    // Lazy import to avoid circular deps
    import('../compiler.js').then(({ compileBareSexp }) => {
      const task = {
        name: 'reduced-task',
        steps: [{ name: 'reduce', description: result }],
      };
      const compiled = compileBareSexp(task);
      reduceResult.baresexp = compiled.baresexp;
    });
  }

  return reduceResult;
}
