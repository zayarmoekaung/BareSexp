"""Example: full vs minimal mode comparison."""

from baresexp import builder

full = (
    builder
    .task(
        "research-agent",
        description="Research and summarize the latest news about AI agents and tools for this week",
    )
    .step("collect-context", description="Gather recent sources and extract user-relevant facts")
    .compile(mode="full")
)

minimal = (
    builder
    .minimal()
    .task(
        "research-agent",
        description="Research and summarize the latest news about AI agents and tools for this week",
    )
    .step("collect-context", description="Gather recent sources and extract user-relevant facts")
    .compile(mode="minimal")
)

print("FULL")
print(full.baresexp)
print("TOKENS", full.token_count)
print()
print("MINIMAL")
print(minimal.baresexp)
print("TOKENS", minimal.token_count)
print()
print("METADATA")
for task_id, entries in minimal.metadata.items():
    print(f"  {task_id}:")
    for entry in entries:
        print(f"    {entry.field_path}: {entry.original!r} -> {entry.shortened!r}")
