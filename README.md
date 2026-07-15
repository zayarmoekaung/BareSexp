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

Install the published package:

```bash
npm install baresexp
```

If you are working from source locally:

```bash
npm install
npm run build
npm test
```

## Basic example

```ts
import { builder, compileBareSexp } from 'baresexp';

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
import { builder } from 'baresexp';

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

## Prompt comparison

A normal prompt is verbose and easy to read, while BareSexp is structured and compact. The condense option removes line breaks and extra whitespace so the same instruction can be emitted as a single compact token-efficient string.

### Condense option

Use `compile({ condense: true })` or the builder equivalent to remove line breaks from the generated output. This is useful when you want the smallest possible payload for an agent prompt while still keeping the original meaning intact in metadata.

```ts
const result = builder
  .task({
    name: 'florida-man-news-summarizer',
    description: 'Summarize recent Florida Man news stories into a concise briefing',
  })
  .compile({ mode: 'full', condense: true });

console.log(result.baresexp);
```

### Example: condensed BareSexp vs full BareSexp

#### Raw prompt idea

```text
You are a Florida Man news summarizer. Summarize recent Florida Man news stories into a concise briefing.
```

#### Condensed BareSexp

```text
(task florida-man-news-summarizer(description summarize-florida-man-news-stories-conci)(steps(step collect-news(description gather-florida-man-headlines-source-link)(tools(tool web-search(description search-web-florida-man-news-stories))))(step summarize(description condense-stories-short-factual-summary)(tools(tool summary-writer(description write-concise-bulletin-key-events-tone))))))
```

#### Full BareSexp

```text
(task florida-man-news-summarizer
 (description "Summarize recent Florida Man news stories into a concise briefing")
 (steps
    (step collect-news
      (description "Gather recent Florida Man headlines and source links")
      (tools
        (tool web-search
          (description "Search the web for recent Florida Man news stories")
        )
      )
    )
    (step summarize
      (description "Condense the stories into a short, factual summary")
      (tools
        (tool summary-writer
          (description "Write a concise bulletin with key events and tone")
        )
      )
    )
 )
)
```

### Token comparison

- Condensed BareSexp: about 14 tokens
- Full BareSexp: about 84 tokens

This shows how the condense option can dramatically reduce payload size while remaining structurally clear for the agent.

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
