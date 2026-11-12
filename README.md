# BareSexp

[![npm version](https://img.shields.io/npm/v/baresexp.svg)](https://www.npmjs.com/package/baresexp)
[![PyPI version](https://img.shields.io/pypi/v/baresexp.svg)](https://pypi.org/project/baresexp/)

BareSexp is a minimal-token, lossless S-expression language plus a TypeScript + Python toolchain for AI agent instructions.

## Features

- **Builder API** — fluent chaining for single tasks with steps, tools, and output specs
- **BareSexpDocument** — root container for multiple contexts and tasks; compile all or each part separately
- Compiler that serializes typed objects into BareSexp text, with full and minimal modes
- Parser that turns BareSexp text back into structured objects
- Validator for basic task, step, and tool structure checks
- Grammar-based natural language reduction — strips human-oriented grammar before compilation for systematically compact output
- JSON compilation — `compileJson()` / `parseJson()` turn JSON objects into plain S-expressions and back
- `content` field on tasks for arbitrary user-provided data (CSV, JSON, code, queries, pre-compiled BareSexp)

## Quick start

### Install

```bash
# TypeScript / Node.js
npm install baresexp

# Python
pip install baresexp
```

## Two ways to build

BareSexp offers two APIs for different complexity levels. Pick the one that matches your use case.

| | **Builder API** | **BareSexpDocument** |
|---|---|---|
| **Use when** | You need one task, fast | You need multiple contexts and/or tasks |
| **Entry point** | `builder` | `new BareSexpDocument()` |
| **Contexts** | One, chained via `.context()` → `.task()` | Many — each `.context()` appends |
| **Tasks** | One — each `.task()` replaces | Many — each `.task()` appends |
| **Steps / tools** | `.step()`, `.tool()` chain | Pass as arrays in `.task({ steps: [...], tools: [...] })` |
| **Compile** | `.compile()` — single result | `.compile()`, `.compileContext()`, `.compileTask()`, `.compileParts()` |
| **Grammar reducer** | Use `reduceNaturalLanguage()` standalone | `.reduce()` + `.useReduced()` chained on document |
| **JSON payload** | `.task().jsonPayload({ ... })` | Set `content` on `.task()` directly |

### Builder API — single task

```ts
import { builder } from 'baresexp';

const result = builder
  .minimal()
  .task({ name: 'research', description: 'Research and summarize' })
  .step({ name: 'collect', description: 'Gather sources' })
  .tool({ name: 'web-search', description: 'Search the web' })
  .compile({ mode: 'minimal' });

console.log(result.baresexp);
```

```python
from baresexp import builder

result = (
    builder
    .minimal()
    .task(name="research", description="Research and summarize")
    .step(name="collect", description="Gather sources")
    .tool(name="web-search", description="Search the web")
    .compile(mode="minimal")
)

print(result.baresexp)
```

### Document API — multiple contexts and tasks

```ts
import { BareSexpDocument } from 'baresexp';

const doc = new BareSexpDocument()
  .minimal()
  .context({ name: 'reviewer', role: 'You are a senior code reviewer' })
  .context({ name: 'project', domain: 'TypeScript' })
  .task({ name: 'review', description: 'Review the code' })
  .task({ name: 'summarize', description: 'Write a summary' });

const parts = doc.compileParts();
parts.context  // "(context reviewer ...)\n(context project ...)"
parts.task     // "(task review ...)\n(task summarize ...)"
parts.full     // concatenated
```

```python
from baresexp import BareSexpDocument

doc = (
    BareSexpDocument()
    .minimal()
    .context(name="reviewer", role="You are a senior code reviewer")
    .context(name="project", domain="TypeScript")
    .task(name="review", description="Review the code")
    .task(name="summarize", description="Write a summary")
)

parts = doc.compile_parts()
```

## Document API

### Compile methods

| Method | Returns | Use when |
|---|---|---|
| `doc.compile()` | `BareSexpResult` | You want the full document as one string |
| `doc.compileContext()` | `BareSexpResult` | You need just the context part |
| `doc.compileTask()` | `BareSexpResult` | You need just the task part |
| `doc.compileParts()` | `BareSexpParts` | You need context and task as separate strings |

```ts
const parts = doc.compileParts();

parts.context  // "(context reviewer ...)"
parts.task     // "(task review ...)"
parts.full     // "(context ...)\n(task ...)"

// Send to your app however you want — BareSexp doesn't care about roles:
await llm.chat([
  { role: 'system', content: parts.context },
  { role: 'user',   content: parts.task },
]);
```

### Grammar reducer chaining

The grammar reducer can be chained directly on `BareSexpDocument`:

```ts
const result = new BareSexpDocument()
  .minimal()
  .reduce('Could you please search the web for the latest news')
  .useReduced()
  .compile();
```

```python
result = (
    BareSexpDocument()
    .minimal()
    .reduce("Could you please search the web for the latest news")
    .use_reduced()
    .compile()
)
```

The reduced text is attached as the next task's `content` field.

## Builder API

### Chaining steps, tools, and output

```ts
builder
  .minimal()
  .task({ name: 'research' })
  .step({ name: 'collect', description: 'Gather sources' })
  .tool({ name: 'web-search', description: 'Search the web' })
  .output({ format: 'markdown' })
  .compile();
```

Steps and tools nest under the current task. Each `.step()` or `.tool()` call returns the builder for further chaining.

### JSON payload on the builder

Compile a JSON object and attach it as the task's `content`:

```ts
builder
  .minimal()
  .task({ name: 'fetch' })
  .jsonPayload({ query: 'AI news', limit: 5 })
  .compile();
```

Also works after `.step()` — sets the parent task's content:

```ts
builder
  .minimal()
  .task({ name: 'research' })
  .step({ name: 'search' })
  .jsonPayload({ query: 'data' })
  .compile();
```

```python
result = (
    builder
    .minimal()
    .task(name="fetch")
    .json_payload({"query": "AI news", "limit": 5})
    .compile()
)
```

## Task content field

Tasks have a `content` field for arbitrary user-provided data — CSV, JSON, code snippets, user queries, or any payload the agent needs to process.

```ts
const doc = new BareSexpDocument()
  .minimal()
  .task({
    name: 'analyze',
    description: 'Process the CSV data and return a summary',
    content: 'name,age,city\nAlice,30,NYC\nBob,25,LA',
  });
```

```lisp
(task analyze
  (description "Process the CSV data and return a summary")
  (content "name,age,city
Alice,30,NYC
Bob,25,LA")
)
```

Decode a task's s-expression content back to a JSON object:

```ts
const doc = new BareSexpDocument()
  .task({ name: 'fetch', content: '(query news) (limit 5)' });

const obj = doc.json();
// → { query: 'news', limit: 5 }
```

## Output modes

| Mode | Description |
|---|---|
| `full` | Verbose, human-readable S-expressions with full descriptions |
| `minimal` | Aggressively compact — strips stop words, kebab-cases identifiers, applies grammar reduction |

```ts
// Full mode — readable
const full = builder.task({ name: 'research', description: 'Research AI tools' }).compile({ mode: 'full' });

// Minimal mode — compact
const minimal = builder.minimal().task({ name: 'research', description: 'Research AI tools' }).compile({ mode: 'minimal' });

// Condense — removes all whitespace for smallest payload
const compact = builder.minimal().task({ name: 'research', description: 'Research AI tools' }).compile({ mode: 'minimal', condense: true });
```

### Token comparison

| Format | Tokens |
|---|---|
| Full | ~84 |
| Minimal | ~14 |
| Condensed | ~14 (single line) |

## Context documents

Context carries background information an agent needs — role, persona, domain knowledge, constraints, facts, decision criteria.

### Context fields

| Field | Purpose |
|---|---|
| `name` | Required identifier |
| `role` | "You are a ..." persona assignment |
| `persona` | Communication style, tone |
| `background` | Project/domain narrative |
| `domain` | Subject area |
| `scope` | Boundaries, timeframes, exclusions |
| `decision` | Decision-making framework |
| `constraints` | Array of rules the agent must follow |
| `facts` | Array of key facts / data points |
| `data` | Raw data snippets, logs, samples |

All string fields pass through the grammar reducer in minimal mode.

### S-expression shape

```lisp
(context ai-reviewer
  (role you-senior-engineer-reviewing-code)
  (domain ai-agent-frameworks)
  (constraints
    (constraint keep-comments-under-80-chars)
  )
  (facts
    (fact zero-runtime-dependencies)
  )
)
(task review
  (description review-code-correctness)
  (steps
    (step check
      (description check-types-lint)
    )
  )
)
```

### Parser support

```ts
import { parseContext, parseBareSexp } from 'baresexp';

const ctx = parseContext('(context my-ctx (role tester))');
const doc = parseBareSexp('(context ...) (task ...)');
```

```python
from baresexp import parse_context, parse_baresexp

ctx = parse_context("(context my-ctx (role tester))")
doc = parse_baresexp("(context ...) (task ...)")
```

## Natural language reduction

BareSexp includes a grammar-based reducer that strips politeness, articles, fillers, auxiliaries, and normalizes verb forms — producing simplified text that compiles into shorter S-expressions.

```
Natural language → Grammar reducer → Simplified text → BareSexp compiler → Compact S-expression
```

### Grammar layers (applied by priority)

1. **Politeness & tone** — "could you please", "I would like"
2. **Articles & determiners** — "the", "a", "some", "this"
3. **Auxiliary & modal verbs** — "is", "will", "should", "have"
4. **Filler & redundant phrases** — "just", "basically", "in order to"
5. **Conjunctions & relative clauses** — "and also", "which is"
6. **Verb normalization** — "-ing" and suffix forms to base verb

### Standalone usage

```ts
import { reduceNaturalLanguage } from 'baresexp';

const reduced = reduceNaturalLanguage(
  'Could you please search the web for the latest news about AI agents'
);
// reduced.simplified → "Search web latest news AI agents"
```

```python
from baresexp import reduce_natural_language

reduced = reduce_natural_language(
    "Could you please search the web for the latest news about AI agents"
)
# reduced.simplified → "Search web latest news AI agents"
```

### Options

```ts
reduceNaturalLanguage(text, { keepPoliteness: true });   // keep polite phrases
reduceNaturalLanguage(text, { aggressive: true });        // extra stripping
reduceNaturalLanguage(text, { toBareSexp: true });        // direct to S-expression
```

### Custom rules

```ts
import { reduceNaturalLanguage, loadRulesFromJson } from 'baresexp';

const myRules = loadRulesFromJson('...');
reduceNaturalLanguage(text, {}, myRules);
```

### Token savings

| Input | After reduction | Tokens |
|---|---|---|
| `Could you please search the web for the latest news about Florida man` | `Search web latest news Florida man` | ~10 |
| `I think it would be great if you could basically just run the analysis` | `Run analysis` | ~4 |

## JSON compilation

BareSexp can compile any JSON-compatible object into a plain S-expression (no wrapper tag) and parse it back. Nested objects become nested s-expressions, arrays produce named groups with `(item ...)` children, and primitives render as bare tokens or quoted strings.

### Standalone: compile

```ts
import { compileJson, parseJson } from 'baresexp';

const sexp = compileJson({
  query: 'latest AI news',
  limit: 5,
  source: { name: 'news-api', version: 2 },
  tags: ['tech', 'ai'],
});
// → "(query "latest AI news")\n(limit 5)\n(source\n  (name news-api)\n  (version 2)\n)\n(tags\n  (item tech)\n  (item ai)\n)"
```

```python
from baresexp import compile_json, parse_json

sexp = compile_json({
    "query": "latest AI news",
    "limit": 5,
    "source": {"name": "news-api", "version": 2},
    "tags": ["tech", "ai"],
})
```

### Standalone: parse

Decode any BareSexp s-expression back into a JSON object:

```ts
const obj = parseJson(sexp);
// { query: 'latest AI news', limit: 5, source: { name: 'news-api', version: 2 }, tags: ['tech', 'ai'] }
```

```python
obj = parse_json(sexp)
```

### Static methods on BareSexpDocument

```ts
BareSexpDocument.compileJson({ host: 'api.example.com', port: 443 });
BareSexpDocument.parseJson('(host api.example.com) (port 443)');
```

```python
BareSexpDocument.compile_json({"host": "api.example.com", "port": 443})
BareSexpDocument.parse_json("(host api.example.com) (port 443)")
```

### Options

| Option | Default | Effect |
|---|---|---|
| `mode` | `'full'` | `'minimal'` minimizes field names |
| `condense` | `false` | Removes all whitespace for smallest payload |

## Examples

**TypeScript**

- [examples/research-agent.ts](examples/research-agent.ts)
- [examples/tool-calling.ts](examples/tool-calling.ts)
- [examples/florida-man-news.ts](examples/florida-man-news.ts)
- [examples/minimal-research-agent.ts](examples/minimal-research-agent.ts)
- [examples/natural-language-reducer.ts](examples/natural-language-reducer.ts)

**Python**

- [python/examples/research_agent.py](python/examples/research_agent.py)
- [python/examples/minimal_research_agent.py](python/examples/minimal_research_agent.py)
- [python/examples/natural_language_reducer.py](python/examples/natural_language_reducer.py)

## Testing

```bash
# TypeScript (requires vitest: npm install -D vitest)
npx vitest run

# Python
cd python && pytest tests/ -v
```

## Release notes

### v1.3.1

JSON ↔ BareSexp round-trip and grammar-reducer chaining.

- **`compileJson` / `compile_json`** — compile any JSON-compatible object into a plain BareSexp s-expression (no wrapper tag); nested objects become nested s-expressions, arrays produce `(item ...)` children
- **`parseJson` / `parse_json`** — parse any BareSexp s-expression back into a JSON object; round-trip safe; accepts both plain `(key value)` and legacy `(json ...)` wrapped forms
- **`TaskBuilder.jsonPayload()` / `_TaskBuilder.json_payload()`** — chain JSON compilation on the task builder: `.task({name:'x'}).jsonPayload({...}).compile()`; also works after `.step()`
- **`BareSexpDocument.json()` / `.json()`** — decode the last task's content back to a JSON object
- **Static `compileJson` / `compile_json` and `parseJson` / `parse_json`** — standalone compile and parse
- **`.reduce()` + `.useReduced()` / `.use_reduced()`** — chain the grammar reducer directly on BareSexpDocument; reduced text attaches as the next task's content
- **Content field preserved** — the `content` field is no longer minimized in minimal mode, so structured payloads survive intact
- **TypeScript + Python** — feature-equivalent implementations

### v1.3.0

BareSexpDocument root container, separate context/task compilation, and task content field.

- **BareSexpDocument** — new root container class that holds contexts and tasks as arrays; nothing gets consumed or reset, so any compile method works at any time
- **Separate compile methods** — `compile()`, `compileContext()`, `compileTask()`, `compileParts()` on both `BareSexpDocument` and the builder's document accessor; returns `{ context, task, full }` without importing LLM role vocabulary
- **Task content field** — `content` on `Task` for arbitrary user data (CSV, JSON, code, queries); compiled as `(content "...")` in the S-expression; parsed and round-tripped
- **Parser support** — `parseBareSexp()` and `parse_baresexp()` recognize `(content ...)` inside task expressions
- **builder.document()** — get a `BareSexpDocument` from the existing builder for gradual migration
- **TypeScript + Python** — feature-equivalent implementations with matching APIs and types

### v1.2.2

Context compilation — sibling documents for agent background information.

- **Context type** — `role`, `persona`, `background`, `domain`, `scope`, `decision`, `data`, `constraints[]`, `facts[]`
- **Standalone or chained** — `.context().constraint().fact().task().step().compile()` from a single builder
- **Grammar reduction** — all context string fields pass through the grammar reducer in minimal mode
- **Full prompt output** — chained compile returns `baresexp` as concatenated `(context ...)\n(task ...)`; `contextSexp` / `context_sexp` available separately
- **Parser support** — `parseContext()` and `parseBareSexp()` recognize `(context ...)` top-level form
- **TypeScript + Python** — feature-equivalent implementations

### v1.0.0

Initial Python release — feature-equivalent to the TypeScript implementation.

- **Fluent builder API** — `builder.task(...).step(...).tool(...).compile()` with Pythonic keyword-only arguments
- **Full and minimal modes** — minimal mode achieves ~14 tokens vs ~37 full for the research agent
- **Round-trip support** — compile → parse → validate cycle preserves structure
- **Condense option** — removes all whitespace for smallest possible payload
- **Grammar-based natural language reduction** — JSON grammar table strips human-oriented grammar
- **Zero runtime dependencies** — pure stdlib Python ≥3.10
