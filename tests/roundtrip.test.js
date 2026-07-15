const test = require('node:test');
const assert = require('node:assert/strict');
const { builder, compileBareSexp, parseBareSexp, validateBareSexp } = require('../dist/index.js');

test('builder compiles and round-trips a task', () => {
  const task = builder
    .task({ name: 'research-agent', description: 'Research, summarize, and report' })
    .step({ name: 'collect-context', description: 'Gather relevant sources' })
    .tool({ name: 'web-search', description: 'Search the web for references' })
    .build();

  const bare = compileBareSexp(task);
  const parsed = parseBareSexp(bare);

  assert.equal(validateBareSexp(parsed), true);
  assert.equal(parsed.name, 'research-agent');
  assert.equal(parsed.steps?.[0]?.name, 'collect-context');
  assert.equal(parsed.steps?.[0]?.tools?.[0]?.name, 'web-search');
});
