# BareSexp
[![npm version](https://img.shields.io/npm/v/baresexp.svg)](https://www.npmjs.com/package/baresexp)
[![PyPI version](https://img.shields.io/pypi/v/baresexp.svg)](https://pypi.org/project/baresexp/)

BareSexp is a minimal-token, lossless S-expression language plus a TypeScript + Python toolchain for AI agent instructions.

## Features

- Fluent builder API for tasks, steps, tools, and **context documents**
- Compiler that serializes typed objects into BareSexp text
- Parser that turns BareSexp text back into structured objects
- Validator for basic task, step, and tool structure checks
- Minimal mode with aggressive token reduction and local metadata storage
- Grammar-based natural language reduction — strips human-oriented grammar before compilation to produce systematically compact BareSexp expressions

## Getting started

Install the published package:

**TypeScript / Node.js**

```bash
npm install baresexp
```

**Python**

```bash
pip install baresexp
```

If you are working from source locally:

```bash
# TypeScript
npm install
npm run build

# Python
cd python
pip install -e ".[dev]"
```

## Testing

**Run all tests:**

```bash
# TypeScript (requires vitest)
npx vitest run

# Python
cd python && pytest tests/ -v
```

**Run grammar reducer tests only:**

```bash
# TypeScript
npx vitest run tests/grammar/reducer.test.ts

# Python
cd python && pytest tests/grammar/test_reducer.py -v
```

**Run examples:**

```bash
# TypeScript
node examples/minimal-research-agent.ts
node examples/natural-language-reducer.ts

# Python
cd python && python examples/minimal_research_agent.py
cd python && python examples/natural_language_reducer.py
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

## Context documents

BareSexp supports **context documents** as sibling expressions to tasks. Context carries the background information an agent needs before acting — role, persona, domain knowledge, constraints, facts, decision criteria, and data snippets.

Context can be compiled **standalone** or **chained** with a task from the same builder:

```ts
import { builder } from 'baresexp';

// Chained: context + task in one compile
const result = builder
  .minimal()
  .context({
    name: 'ai-reviewer',
    role: 'You are a senior TypeScript engineer reviewing code',
    domain: 'AI agent frameworks',
  })
  .constraint('Keep descriptions under 120 chars')
  .fact('Zero runtime dependencies')
  .task({
    name: 'review',
    description: 'Review the code for correctness and type safety',
  })
  .step({ name: 'check', description: 'Check types and lint' })
  .compile({ mode: 'minimal' });

console.log(result.baresexp);      // full prompt: (context ...) + (task ...)
console.log(result.contextSexp);   // context part only, if needed separately
```

```python
from baresexp import builder

# Chained: context + task in one compile
result = (
    builder
    .minimal()
    .context(
        name="ai-reviewer",
        role="You are a senior Python engineer reviewing code",
        domain="AI agent frameworks",
    )
    .constraint("Keep descriptions under 120 chars")
    .fact("Zero runtime dependencies")
    .task(
        name="review",
        description="Review the code for correctness and type safety",
    )
    .step(name="check", description="Check types and lint")
    .compile(mode="minimal")
)

print(result.baresexp)        # full prompt: (context ...) + (task ...)
print(result.context_sexp)    # context part only, if needed separately
```

### Context S-expression shape

```lisp
(context ai-reviewer
  (role you-senior-typescript-engineer-reviewing-code)
  (domain ai-agent-frameworks)
  (constraints
    (constraint keep-descriptions-under-120-chars)
  )
  (facts
    (fact zero-runtime-dependencies)
  )
)
(task review
  (description review-code-correctness-type-safety)
  (steps
    (step check
      (description check-types-lint)
    )
  )
)
```

### Context fields

| Field | Purpose |
|-------|---------|
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

All string fields pass through the **grammar reducer** in minimal mode for systematic compaction.

### Parser support

**TypeScript**

```ts
import { parseContext, parseBareSexp } from 'baresexp';

const ctx = parseContext('(context my-ctx (role tester))');
const doc = parseBareSexp('(context ...) (task ...)');
```

**Python**

```python
from baresexp import parse_context, parse_baresexp

ctx = parse_context("(context my-ctx (role tester))")
doc = parse_baresexp("(context ...) (task ...)")
```

## From natural language to compact BareSexp

BareSexp includes a **grammar-based natural language reducer** that sits before compilation. It applies a JSON-based grammar table to strip politeness, articles, fillers, auxiliaries, and normalize verb forms — producing simplified descriptions that the compiler then turns into systematically shorter BareSexp expressions.

The pipeline is:

```
Natural language → Grammar reducer → Simplified text → BareSexp compiler → Compact S-expression
```

### How it works

The reducer applies rules in priority order across 6 layers:

1. **Politeness & tone** — remove "could you please", "I would like", etc.
2. **Articles & determiners** — strip "the", "a", "some", "this", etc.
3. **Auxiliary & modal verbs** — remove "is", "will", "should", "have", etc.
4. **Filler & redundant phrases** — strip "just", "basically", "I think", "in order to", etc.
5. **Conjunctions & relative clauses** — simplify "and also", "which is", etc.
6. **Verb normalization** — reduce "-ing" forms and suffixes to base form

### Usage

```ts
import { reduceNaturalLanguage, builder } from 'baresexp';

// Step 1: Reduce natural language
const reduced = reduceNaturalLanguage(
  'Could you please search the web for the latest news about AI agents'
);
// reduced.simplified → "Search web latest news AI agents"

// Step 2: Feed into BareSexp builder
const task = builder
  .minimal()
  .task({ name: 'research-agent', description: reduced.simplified })
  .step({ name: 'collect', description: reduced.simplified })
  .compile({ mode: 'minimal' });

console.log(task.baresexp);
```

```python
from baresexp import reduce_natural_language, builder

# Step 1: Reduce natural language
reduced = reduce_natural_language(
    "Could you please search the web for the latest news about AI agents"
)
# reduced.simplified → "Search web latest news AI agents"

# Step 2: Feed into BareSexp builder
task = (
    builder
    .minimal()
    .task(name="research-agent", description=reduced.simplified)
    .step(name="collect", description=reduced.simplified)
    .compile(mode="minimal")
)

print(task.baresexp)
```

### Token savings from grammar reduction

| Input description | After reduction | BareSexp tokens |
|-------------------|-----------------|-----------------|
| `Could you please search the web for the latest news about Florida man` | `Search web latest news Florida man` | ~10 |
| `I think it would be great if you could basically just run the analysis` | `Run analysis` | ~4 |
| `I would like to find the best results for my query in order to understand the data` | `Find best results query understand data` | ~12 |

### Options

```ts
// Keep politeness but strip everything else
reduceNaturalLanguage(text, { keepPoliteness: true });

// Aggressive mode: extra stripping of pronouns, approximations, action verbs
reduceNaturalLanguage(text, { aggressive: true });

// Convert simplified text directly to BareSexp (skips manual builder step)
reduceNaturalLanguage(text, { toBareSexp: true });
```

```python
reduce_natural_language(text, options=ReduceOptions(keep_politeness=True))
reduce_natural_language(text, options=ReduceOptions(aggressive=True))
reduce_natural_language(text, options=ReduceOptions(to_baresexp=True))
```

### Custom grammar rules

Rules are defined in `default-rules.json` (34 rules, zero runtime deps). You can load your own rule set for domain-specific language:

```ts
import { reduceNaturalLanguage, loadRulesFromJson } from 'baresexp';
import { readFileSync } from 'fs';

const myRules = loadRulesFromJson(readFileSync('./my-rules.json', 'utf8'));
const reduced = reduceNaturalLanguage(text, {}, myRules);
```

```python
from baresexp import reduce_natural_language, load_rules_from_json

with open("my-rules.json") as f:
    my_rules = load_rules_from_json(f.read())

reduced = reduce_natural_language(text, custom_rules=my_rules)
```

Each rule in the JSON file follows this shape:

```json
{
  "id": "pol-001",
  "priority": 100,
  "pattern": "\\b(?:could|would|can|may)\\s+(?:you\\s+)?(?:please\\s+)?",
  "category": "politeness",
  "action": "remove",
  "example": { "before": "Could you please search", "after": "search" }
}
```

- **`priority`**: Higher = applied earlier
- **`action`**: `remove`, `replace`, or `normalize`
- **`category`**: `politeness`, `articles`, `auxiliaries`, `filler`, `conjunctions`, `relative-clauses`, `verb-form`, `prepositions`, `pronouns`, `structure`

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

## Verification

```bash
# TypeScript build + examples
npm run build
node examples/minimal-research-agent.ts
node examples/natural-language-reducer.ts

# TypeScript tests (requires vitest: npm install -D vitest)
npx vitest run

# Python tests
cd python && pytest tests/ -v

# Python examples
cd python && python examples/minimal_research_agent.py
cd python && python examples/natural_language_reducer.py
```

## Python Package Release Notes

### v1.0.0

Initial Python release — feature-equivalent to the TypeScript implementation.

- **Fluent builder API** — `builder.task(...).step(...).tool(...).compile()` with Pythonic keyword-only arguments
- **Full and minimal modes** — minimal mode achieves ~14 tokens vs ~37 full for the research agent example, matching TypeScript compression ratio
- **Round-trip support** — compile → parse → validate cycle preserves structure
- **Condense option** — removes all whitespace for smallest possible payload
- **Grammar-based natural language reduction** — JSON grammar table strips human-oriented grammar before compilation for systematically compact output
- **Zero runtime dependencies** — pure stdlib Python ≥3.10
- **Type hints throughout** — dataclasses with full type annotations
