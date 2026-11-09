export type RuleCategory =
  | 'politeness'
  | 'articles'
  | 'auxiliaries'
  | 'filler'
  | 'conjunctions'
  | 'relative-clauses'
  | 'verb-form'
  | 'prepositions'
  | 'pronouns'
  | 'structure';

export type RuleAction = 'remove' | 'replace' | 'rewrite' | 'normalize';

export interface GrammarRule {
  id: string;
  priority: number;
  pattern: RegExp;
  category: RuleCategory;
  action: RuleAction;
  replacement?: string | ((match: string, groups?: RegExpMatchArray) => string);
  example?: {
    before: string;
    after: string;
  };
  enabled?: boolean;
}

export interface ReduceOptions {
  keepArticles?: boolean;
  keepPoliteness?: boolean;
  aggressive?: boolean;
  toBareSexp?: boolean;
}

export interface ReduceResult {
  original: string;
  simplified: string;
  appliedRules: string[];
  baresexp?: string;
}
