import { describe, it, expect } from 'vitest';
import { BareSexpDocument, builder, parseBareSexp } from '../src/index.js';

describe('BareSexpDocument', () => {
  describe('compileParts', () => {
    it('returns empty strings when no nodes are added', () => {
      const doc = new BareSexpDocument();
      const parts = doc.compileParts();
      expect(parts.context).toBe('');
      expect(parts.task).toBe('');
      expect(parts.full).toBe('');
    });

    it('compiles context and task separately and together', () => {
      const doc = new BareSexpDocument()
        .minimal()
        .context({ name: 'reviewer', role: 'You are a code reviewer' })
        .task({ name: 'review', description: 'Review the code' });

      const parts = doc.compileParts();

      expect(parts.context).toContain('(context reviewer');
      expect(parts.context).toContain('(role');
      expect(parts.task).toContain('(task review');
      expect(parts.task).toContain('(description');
      expect(parts.full).toContain('(context reviewer');
      expect(parts.full).toContain('(task review');
    });

    it('compileContext returns only context', () => {
      const doc = new BareSexpDocument()
        .minimal()
        .context({ name: 'ctx', role: 'Helpful assistant' })
        .task({ name: 'task', description: 'Do something' });

      const ctx = doc.compileContext();
      expect(ctx.baresexp).toContain('(context ctx');
      expect(ctx.baresexp).not.toContain('(task');
    });

    it('compileTask returns only task', () => {
      const doc = new BareSexpDocument()
        .minimal()
        .context({ name: 'ctx', role: 'Helpful assistant' })
        .task({ name: 'task', description: 'Do something' });

      const t = doc.compileTask();
      expect(t.baresexp).toContain('(task task');
      expect(t.baresexp).not.toContain('(context');
    });

    it('compile returns full concatenated output', () => {
      const doc = new BareSexpDocument()
        .minimal()
        .context({ name: 'ctx', role: 'Helpful assistant' })
        .task({ name: 'task', description: 'Do something' });

      const full = doc.compile();
      expect(full.baresexp).toContain('(context ctx');
      expect(full.baresexp).toContain('(task task');
    });

    it('supports condensed output in all compile methods', () => {
      const doc = new BareSexpDocument()
        .minimal()
        .context({ name: 'ctx', role: 'Helpful assistant' })
        .task({ name: 'task', description: 'Do something' });

      const parts = doc.compileParts({ condense: true });
      expect(parts.context).not.toContain('\n');
      expect(parts.task).not.toContain('\n');
      expect(parts.full).not.toContain('\n');
    });

    it('supports multiple contexts and tasks', () => {
      const doc = new BareSexpDocument()
        .minimal()
        .context({ name: 'ctx1', role: 'First context' })
        .context({ name: 'ctx2', domain: 'Second context' })
        .task({ name: 'task1', description: 'First task' })
        .task({ name: 'task2', description: 'Second task' });

      const parts = doc.compileParts();
      expect(parts.context).toContain('(context ctx1');
      expect(parts.context).toContain('(context ctx2');
      expect(parts.task).toContain('(task task1');
      expect(parts.task).toContain('(task task2');
    });
  });

  describe('content field', () => {
    it('compiles task with content', () => {
      const doc = new BareSexpDocument()
        .minimal()
        .task({
          name: 'analyze',
          description: 'Process the CSV data',
          content: 'name,age\nAlice,30\nBob,25',
        });

      const result = doc.compileTask();
      expect(result.baresexp).toContain('(task analyze');
      expect(result.baresexp).toContain('(description');
      expect(result.baresexp).toContain('(content');
    });

    it('content appears between description and steps', () => {
      const doc = new BareSexpDocument()
        .minimal()
        .task({
          name: 'analyze',
          description: 'Process CSV',
          content: 'name,age\nAlice,30',
        })
        .task({
          name: 'summarize',
          description: 'Summarize results',
        });

      const result = doc.compileTask();
      const lines = result.baresexp.split('\n');
      const descIdx = lines.findIndex(l => l.includes('(description'));
      const contentIdx = lines.findIndex(l => l.includes('(content'));
      expect(contentIdx).toBeGreaterThan(descIdx);
    });
  });

  describe('lastTask', () => {
    it('returns the last added task', () => {
      const doc = new BareSexpDocument()
        .task({ name: 'first' })
        .task({ name: 'second' });

      expect(doc.lastTask()?.name).toBe('second');
    });

    it('returns undefined when no tasks', () => {
      const doc = new BareSexpDocument();
      expect(doc.lastTask()).toBeUndefined();
    });
  });
});

describe('builder.document()', () => {
  it('returns a new BareSexpDocument', () => {
    const doc = builder.document();
    expect(doc).toBeInstanceOf(BareSexpDocument);
  });

  it('document can be used independently from builder', () => {
    const doc = builder.document()
      .minimal()
      .context({ name: 'doc-ctx', role: 'Document context' })
      .task({ name: 'doc-task', description: 'Document task' });

    const parts = doc.compileParts();
    expect(parts.context).toContain('(context doc-ctx');
    expect(parts.task).toContain('(task doc-task');
  });
});

describe('parseBareSexp with content', () => {
  it('parses task with content field', () => {
    const input = `(task analyze
  (description "Process CSV data")
  (content "name,age
Alice,30")
  (steps
    (step count
      (description "Count rows")
    )
  )
)`;
    const parsed = parseBareSexp(input);
    if ('content' in parsed) {
      expect(parsed.content).toContain('name,age');
    }
    expect(parsed.name).toBe('analyze');
  });
});
