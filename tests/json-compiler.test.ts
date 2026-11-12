import { describe, it, expect } from 'vitest';
import { compileJson, parseJson, builder, BareSexpDocument, reduceNaturalLanguage } from '../src/index.js';

describe('compileJson', () => {
  it('compiles a flat object without wrapper', () => {
    const result = compileJson({ name: 'Alice', age: 30, active: true });
    expect(result).toContain('(name Alice)');
    expect(result).toContain('(age 30)');
    expect(result).toContain('(active true)');
    expect(result).not.toContain('(json');
  });

  it('compiles nested objects', () => {
    const result = compileJson({
      user: { name: 'Bob', email: 'bob@test.com' },
    });
    expect(result).toContain('(user');
    expect(result).toContain('(name Bob)');
    expect(result).toContain('bob@test.com');
    expect(result).not.toContain('(json');
  });

  it('compiles arrays', () => {
    const result = compileJson({
      tags: ['alpha', 'beta', 'gamma'],
    });
    expect(result).toContain('(tags');
    expect(result).toContain('(item alpha)');
    expect(result).toContain('(item beta)');
  });

  it('compiles arrays of objects', () => {
    const result = compileJson({
      items: [{ id: 1 }, { id: 2 }],
    });
    expect(result).toContain('(items');
    expect(result).toContain('(item');
    expect(result).toContain('(id 1)');
    expect(result).toContain('(id 2)');
  });

  it('handles null values', () => {
    const result = compileJson({ missing: null });
    expect(result).toContain('(missing null)');
  });

  it('condenses output when condense is true', () => {
    const result = compileJson({ a: 1, b: 2 }, { condense: true });
    expect(result).not.toContain('\n');
    expect(result).toContain('(a 1)');
    expect(result).toContain('(b 2)');
  });

  it('minimizes field names in minimal mode', () => {
    const result = compileJson({ numberOfItems: 5 }, { mode: 'minimal' });
    expect(result).toContain('(numberofitems 5)');
  });
});

describe('parseJson', () => {
  it('parses a plain s-expression', () => {
    const obj = parseJson('(name Alice) (age 30) (active true)');
    expect(obj).toEqual({ name: 'Alice', age: 30, active: true });
  });

  it('parses a wrapped (json ...) s-expression', () => {
    const obj = parseJson('(json (name Alice) (age 30))');
    expect(obj).toEqual({ name: 'Alice', age: 30 });
  });

  it('parses nested objects', () => {
    const obj = parseJson('(user (name Bob) (email "bob@test.com"))');
    expect(obj).toEqual({ user: { name: 'Bob', email: 'bob@test.com' } });
  });

  it('parses arrays', () => {
    const obj = parseJson('(tags (item alpha) (item beta) (item gamma))');
    expect(obj).toEqual({ tags: ['alpha', 'beta', 'gamma'] });
  });

  it('parses arrays of objects', () => {
    const obj = parseJson('(items (item (id 1)) (item (id 2)))');
    expect(obj.items).toBeDefined();
    expect(Array.isArray(obj.items)).toBe(true);
    expect(obj.items).toHaveLength(2);
    expect(obj.items[0]).toEqual({ id: 1 });
    expect(obj.items[1]).toEqual({ id: 2 });
  });

  it('returns empty object for unrecognized input', () => {
    expect(parseJson('')).toEqual({});
  });

  it('round-trips compile → parse', () => {
    const original = { query: 'news', limit: 5, source: { name: 'api' } };
    const sexp = compileJson(original);
    const parsed = parseJson(sexp);
    expect(parsed.query).toBe('news');
    expect(parsed.limit).toBe(5);
    expect(parsed.source).toEqual({ name: 'api' });
  });
});

describe('TaskBuilder.jsonPayload', () => {
  it('chains on task builder and sets content', () => {
    const result = builder
      .minimal()
      .task({ name: 'fetch' })
      .jsonPayload({ query: 'AI news', limit: 5 })
      .compile();
    expect(result.baresexp).toContain('(task fetch');
    expect(result.baresexp).toContain('(content');
    expect(result.baresexp).toContain('(query');
    expect(result.baresexp).toContain('(limit 5)');
  });

  it('can be chained on task builder with steps', () => {
    const result = builder
      .minimal()
      .task({ name: 'research' })
      .step({ name: 'search', description: 'Search the web' })
      .jsonPayload({ query: 'data' })
      .compile();
    expect(result.baresexp).toContain('(content');
    expect(result.baresexp).toContain('(query data)');
    expect(result.baresexp).toContain('(step search');
  });
});

describe('BareSexpDocument.reduce chaining', () => {
  it('reduces text and attaches as task content via useReduced', () => {
    const doc = new BareSexpDocument()
      .minimal()
      .reduce('Could you please search the web for the latest news')
      .useReduced();
    const result = doc.compile();
    expect(result.baresexp).toContain('(content');
    expect(result.baresexp).toContain('Search web for latest news');
  });

  it('decodes JSON from last task content via .json()', () => {
    const doc = new BareSexpDocument()
      .task({ name: 'fetch', content: '(query news) (limit 10)' });
    const decoded = doc.json();
    expect(decoded).not.toBeNull();
    expect(decoded!.query).toBe('news');
    expect(decoded!.limit).toBe(10);
  });

  it('returns null when task has no content', () => {
    const doc = new BareSexpDocument()
      .task({ name: 'plain' });
    expect(doc.json()).toBeNull();
  });

  it('static compileJson and parseJson round-trip', () => {
    const sexp = BareSexpDocument.compileJson({ host: 'api.example.com', port: 443 });
    const parsed = BareSexpDocument.parseJson(sexp);
    expect(parsed.host).toBe('api.example.com');
    expect(parsed.port).toBe(443);
  });
});

describe('reduceNaturalLanguage standalone', () => {
  it('works without toBareSexp flag', () => {
    const result = reduceNaturalLanguage('Could you please help me with this task');
    expect(result.simplified).toBeTruthy();
    expect(result.appliedRules.length).toBeGreaterThan(0);
    expect(result.baresexp).toBeUndefined();
  });

  it('accepts custom rules', () => {
    const result = reduceNaturalLanguage('foo bar baz', {}, [
      {
        id: 'custom-001',
        priority: 100,
        pattern: /foo/gi,
        category: 'structure',
        action: 'replace',
        replacement: 'QUX',
      },
    ]);
    expect(result.simplified).toContain('ux');
    expect(result.appliedRules).toContain('custom-001');
  });
});
