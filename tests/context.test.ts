import { describe, it, expect } from 'vitest';
import { builder, compileContext, parseContext, parseBareSexp } from '../src/index.js';
import type { Context } from '../src/core/types.js';

describe('Context', () => {
  describe('compileContext', () => {
    it('compiles a minimal context', () => {
      const ctx: Context = { name: 'test-context' };
      const result = compileContext(ctx);
      expect(result.baresexp).toContain('(context test-context');
      expect(result.contextSexp).toBe(result.baresexp);
    });

    it('compiles all context fields', () => {
      const ctx: Context = {
        name: 'ai-reviewer',
        role: 'You are a senior TypeScript engineer',
        persona: 'Direct, no-fluff communication',
        background: 'BareSexp is a minimal-token S-expression library',
        domain: 'AI agent frameworks',
        scope: 'Open-source tooling, 2025',
        decision: 'Prefer explicit over implicit types',
        constraints: ['Keep descriptions under 120 chars', 'Zero runtime dependencies'],
        facts: ['TypeScript + Python implementations', 'Grammar-based reduction'],
      };
      const result = compileContext(ctx, { mode: 'full' });

      expect(result.baresexp).toContain('(context ai-reviewer');
      expect(result.baresexp).toContain('(role');
      expect(result.baresexp).toContain('(persona');
      expect(result.baresexp).toContain('(background');
      expect(result.baresexp).toContain('(domain');
      expect(result.baresexp).toContain('(scope');
      expect(result.baresexp).toContain('(decision');
      expect(result.baresexp).toContain('(constraints');
      expect(result.baresexp).toContain('(constraint');
      expect(result.baresexp).toContain('(facts');
      expect(result.baresexp).toContain('(fact');
    });

    it('applies grammar reduction in minimal mode', () => {
      const ctx: Context = {
        name: 'assistant',
        role: 'Could you please be a helpful research assistant',
      };
      const result = compileContext(ctx, { mode: 'minimal' });
      // Grammar reducer should strip politeness
      expect(result.baresexp).not.toContain('Could you please');
    });

    it('produces condensed output', () => {
      const ctx: Context = {
        name: 'ctx',
        role: 'Senior engineer',
        domain: 'AI',
      };
      const result = compileContext(ctx, { condense: true });
      expect(result.baresexp).not.toContain('\n');
    });
  });

  describe('parseContext', () => {
    it('parses a simple context', () => {
      const parsed = parseContext('(context test-ctx)');
      expect(parsed.name).toBe('test-ctx');
    });

    it('parses all fields', () => {
      const input = `(context ai-reviewer
  (role "senior engineer")
  (domain "AI frameworks")
  (constraints
    (constraint "zero deps")
  )
  (facts
    (fact "TS and Python")
  )
)`;
      const parsed = parseContext(input);
      expect(parsed.name).toBe('ai-reviewer');
      expect(parsed.role).toBe('senior engineer');
      expect(parsed.domain).toBe('AI frameworks');
      expect(parsed.constraints).toEqual(['zero deps']);
      expect(parsed.facts).toEqual(['TS and Python']);
    });
  });

  describe('builder chaining', () => {
    it('chains context then task', () => {
      const result = builder
        .minimal()
        .context({
          name: 'reviewer',
          role: 'You are a senior TypeScript engineer',
        })
        .constraint('Keep it concise')
        .task({
          name: 'review',
          description: 'Review the code for correctness',
        })
        .step({ name: 'check', description: 'Check types' })
        .compile({ mode: 'minimal' });

      // baresexp contains the full concatenated output
      expect(result.baresexp).toContain('(context reviewer');
      expect(result.baresexp).toContain('(task review');
      expect(result.baresexp).toContain('(step check');
      // contextSexp is also available separately
      expect(result.contextSexp).toBeDefined();
      expect(result.contextSexp).toContain('(context reviewer');
    });

    it('chains task then context', () => {
      const result = builder
        .minimal()
        .task({
          name: 'research',
          description: 'Research AI tools',
        })
        .context({
          name: 'domain',
          domain: 'AI agent frameworks',
        })
        .task({
          name: 'subtask',
          description: 'Gather sources',
        })
        .compile({ mode: 'minimal' });

      expect(result.baresexp).toContain('(context domain');
      expect(result.baresexp).toContain('(task subtask');
      expect(result.contextSexp).toBeDefined();
    });

    it('standalone context compile', () => {
      const result = builder
        .minimal()
        .context({
          name: 'standalone',
          role: 'Helpful assistant',
        })
        .fact('Zero runtime dependencies')
        .compile({ mode: 'minimal' });

      expect(result.contextSexp).toContain('(context standalone');
      expect(result.contextSexp).toContain('(role');
      expect(result.contextSexp).toContain('(fact');
    });

    it('standalone task compile (backward compatible)', () => {
      const result = builder
        .minimal()
        .task({
          name: 'task-only',
          description: 'Do something',
        })
        .step({ name: 's1', description: 'Step one' })
        .compile({ mode: 'minimal' });

      expect(result.baresexp).toContain('(task task-only');
      expect(result.contextSexp).toBeUndefined();
    });
  });
});
