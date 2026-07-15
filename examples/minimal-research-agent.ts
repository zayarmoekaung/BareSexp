import { builder } from '../dist/index.js';

const full = builder
  .task({
    name: 'research-agent',
    description: 'Research and summarize the latest news about AI agents and tools for this week',
  })
  .step({
    name: 'collect-context',
    description: 'Gather recent sources and extract user-relevant facts',
  })
  .compile({ mode: 'full' });

const minimal = builder
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

console.log('FULL');
console.log(full.baresexp);
console.log('TOKENS', full.tokenCount);
console.log('MINIMAL');
console.log(minimal.baresexp);
console.log('TOKENS', minimal.tokenCount);
console.log('METADATA', JSON.stringify(minimal.metadata, null, 2));
