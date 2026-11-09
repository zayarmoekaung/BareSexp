# baresexp (Python)

Minimal-token S-expression language for AI agent instructions.

## Install

```bash
pip install baresexp
```

## Quick start

```python
from baresexp import builder

result = (
    builder
    .task("research-agent", description="Research and summarize a topic")
    .step("collect", description="Gather sources")
    .tool("web-search", description="Search the web")
    .compile()
)

print(result.baresexp)
```

## Minimal mode

```python
from baresexp import builder

result = (
    builder
    .minimal()
    .task("research-agent", description="Research and summarize the latest news")
    .step("collect", description="Gather sources")
    .compile(mode="minimal")
)

print(result.baresexp)       # compact output
print(result.token_count)    # estimated token count
print(result.metadata)       # original ↔ shortened mapping
```

## API

| Function        | Description                          |
| --------------- | ------------------------------------ |
| `builder`       | Fluent builder entry point           |
| `compile_baresexp(task)` | Compile a Task to S-expression |
| `parse_baresexp(text)`   | Parse S-expression to a Task  |
| `validate_baresexp(obj)` | Validate a Task structure     |
| `minimize_description(text)` | Minimize a description string |
