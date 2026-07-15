const test = require('node:test');
const assert = require('node:assert/strict');
const { builder } = require('../dist/index.js');

test('minimal mode shortens output and stores metadata', () => {
  const result = builder
    .minimal()
    .task({
      name: 'research-agent',
      description: 'Research and summarize the latest news about AI agents and tools for this week',
    })
    .step({
      name: 'collect-context',
      description: 'Gather recent sources and extract user-relevant facts',
    })
    .compile({ mode: 'minimal' });

  assert.ok(result.baresexp.length < 220);
  assert.ok(result.tokenCount > 0);
  assert.ok(result.metadata['research-agent']);
  assert.equal(result.metadata['research-agent'][0].original, 'Research and summarize the latest news about AI agents and tools for this week');
});
