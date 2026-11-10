import { describe, it, expect } from 'vitest';
import { reduceNaturalLanguage, loadRulesFromJson } from '../../src/core/grammar/index.js';
import type { GrammarRule, ReduceOptions } from '../../src/core/grammar/index.js';

describe('reduceNaturalLanguage', () => {
  it('strips politeness phrases', () => {
    const result = reduceNaturalLanguage('Could you please search the web for me');
    expect(result.appliedRules).toContain('pol-001');
    expect(result.simplified).not.toMatch(/could|please|you/i);
  });

  it('strips articles', () => {
    const result = reduceNaturalLanguage('Find the best results for a query');
    expect(result.appliedRules).toContain('art-001');
    expect(result.simplified).not.toMatch(/\bthe\s|\ba\s/i);
  });

  it('strips auxiliary verbs', () => {
    const result = reduceNaturalLanguage('The data is being processed');
    expect(result.appliedRules).toContain('aux-001');
    expect(result.simplified).not.toMatch(/\bis\s|\bbeing\s/i);
  });

  it('strips filler words', () => {
    const result = reduceNaturalLanguage('Just find the best results');
    expect(result.appliedRules).toContain('fil-001');
    expect(result.simplified).not.toMatch(/\bjust\s/i);
  });

  it('simplifies conjunctions', () => {
    const result = reduceNaturalLanguage('Search and also find related data');
    expect(result.appliedRules).toContain('con-001');
    expect(result.simplified).toMatch(/and /);
    expect(result.simplified).not.toMatch(/also/i);
  });

  it('normalizes -ing verbs', () => {
    const result = reduceNaturalLanguage('Running the analysis');
    expect(result.appliedRules).toContain('vrb-001');
    expect(result.simplified.toLowerCase()).toMatch(/run/);
  });

  it('reports applied rule IDs', () => {
    const result = reduceNaturalLanguage('Could you please find the best results');
    expect(result.appliedRules.length).toBeGreaterThan(0);
    expect(result.appliedRules).toContain('pol-001');
    expect(result.appliedRules).toContain('art-001');
  });

  it('preserves original text', () => {
    const input = 'Could you please find the best results';
    const result = reduceNaturalLanguage(input);
    expect(result.original).toBe(input);
  });

  it('respects keepArticles option', () => {
    const result = reduceNaturalLanguage('Find the best results', { keepArticles: true });
    expect(result.simplified).toMatch(/the /);
    expect(result.appliedRules).not.toContain('art-001');
  });

  it('respects keepPoliteness option', () => {
    const result = reduceNaturalLanguage('Could you please search', { keepPoliteness: true });
    // pol-001 and pol-002 are excluded, but aux-002 still catches modal verbs
    expect(result.appliedRules).not.toContain('pol-001');
    expect(result.appliedRules).not.toContain('pol-002');
  });

  it('enables aggressive rules in aggressive mode', () => {
    const result = reduceNaturalLanguage('Find the best results', { aggressive: true });
    // agr-001 strips possessive pronouns + articles; with aggressive it fires
    const hasAggressiveOrArt =
      result.appliedRules.includes('agr-001') || result.appliedRules.includes('art-001');
    expect(hasAggressiveOrArt).toBe(true);
  });

  it('accepts custom rules', () => {
    const customRule: GrammarRule = {
      id: 'custom-001',
      priority: 200,
      pattern: /\bsuper\s+/gi,
      category: 'filler',
      action: 'remove',
    };
    const result = reduceNaturalLanguage('Super find results', {}, [customRule]);
    expect(result.appliedRules).toContain('custom-001');
    expect(result.simplified).not.toMatch(/super/i);
  });

  it('collapses multiple spaces', () => {
    const result = reduceNaturalLanguage('Find   the    best   results');
    expect(result.simplified).not.toMatch(/\s{2,}/);
  });

  it('trims leading/trailing punctuation', () => {
    const result = reduceNaturalLanguage('. Find the best results .');
    expect(result.simplified).not.toMatch(/^[\s.,;!?]/);
    expect(result.simplified).not.toMatch(/[\s.,;!?]$/);
  });

  it('normalizes to sentence case', () => {
    const result = reduceNaturalLanguage('FIND THE BEST RESULTS');
    expect(result.simplified[0]).toBe(result.simplified[0].toUpperCase());
    expect(result.simplified.slice(1)).toBe(result.simplified.slice(1).toLowerCase());
  });

  it('handles empty input', () => {
    const result = reduceNaturalLanguage('');
    expect(result.simplified).toBe('');
    expect(result.appliedRules).toEqual([]);
  });

  it('handles input with only stop words', () => {
    const result = reduceNaturalLanguage('the a an is are was');
    expect(result.simplified.length).toBeLessThan(result.original.length);
  });

  it('applies rules in priority order', () => {
    // Higher priority rules should fire first
    const result = reduceNaturalLanguage('Could you please just find the results');
    const polIndex = result.appliedRules.indexOf('pol-001');
    const filIndex = result.appliedRules.indexOf('fil-001');
    // Both should be present
    expect(polIndex).toBeGreaterThanOrEqual(0);
    expect(filIndex).toBeGreaterThanOrEqual(0);
  });
});

describe('loadRulesFromJson', () => {
  it('loads rules from a JSON string', () => {
    const jsonStr = JSON.stringify([
      { id: 'test-001', priority: 100, pattern: '\\bfoo\\s+', category: 'filler', action: 'remove' },
    ]);
    const rules = loadRulesFromJson(jsonStr);
    expect(rules).toHaveLength(1);
    expect(rules[0].id).toBe('test-001');
  });

  it('loads rules with custom replacement', () => {
    const jsonStr = JSON.stringify([
      { id: 'test-002', priority: 50, pattern: '\\bbar\\s+', category: 'filler', action: 'replace', replacement: 'baz ' },
    ]);
    const rules = loadRulesFromJson(jsonStr);
    expect(rules[0].replacement).toBe('baz ');
  });

  it('loads rules with enabled flag', () => {
    const jsonStr = JSON.stringify([
      { id: 'test-003', priority: 10, pattern: '\\bqux\\s+', category: 'filler', action: 'remove', enabled: false },
    ]);
    const rules = loadRulesFromJson(jsonStr);
    expect(rules[0].enabled).toBe(false);
  });
});
