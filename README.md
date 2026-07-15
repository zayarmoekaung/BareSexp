# BareSexp

BareSexp is a minimal-token, lossless S-expression language plus a TypeScript toolchain for AI agent instructions.

## Features

- Fluent builder API for tasks, steps, and tools
- Compiler that serializes typed objects into BareSexp text
- Parser that turns BareSexp text back into structured objects
- Validator for basic task, step, and tool structure checks
- Minimal mode with aggressive token reduction and local metadata storage
- Metadata-aware output results with original text and shortened variants

## Getting started

```bash
npm install
npm run build
npm test
```

## Basic example

```ts
import { builder, compileBareSexp } from './src/index.js';

const task = builder
  .task({ name: 'research-agent', description: 'Research and summarize' })
  .step({ name: 'collect-context', description: 'Gather sources' })
  .tool({ name: 'web-search', description: 'Search the web' })
  .build();

const result = compileBareSexp(task);
console.log(result.baresexp);
```

## Minimal mode example

```ts
import { builder } from './src/index.js';

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

console.log(result.baresexp);
console.log(result.metadata);
```

## Examples

- [examples/research-agent.ts](examples/research-agent.ts)
- [examples/tool-calling.ts](examples/tool-calling.ts)
- [examples/florida-man-news.ts](examples/florida-man-news.ts)
- [examples/minimal-research-agent.ts](examples/minimal-research-agent.ts)

## Verification

The project has been verified with:

```bash
npm run build
node examples/minimal-research-agent.ts
```
