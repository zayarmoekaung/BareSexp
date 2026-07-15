# BareSexp

BareSexp is a minimal-token, lossless S-expression language plus a TypeScript toolchain for AI agent instructions.

## Features

- Fluent builder API for tasks, steps, and tools
- BareSexp compiler for serializing typed objects
- Parser for turning BareSexp text back into objects
- Validator for core structure checks

## Getting started

```bash
npm install
npm run build
```

## Example

```ts
import { builder, compileBareSexp } from './src/index.js';

const task = builder
  .task({ name: 'research-agent', description: 'Research and summarize' })
  .step({ name: 'collect-context', description: 'Gather sources' })
  .tool({ name: 'web-search', description: 'Search the web' })
  .build();

console.log(compileBareSexp(task));
```
