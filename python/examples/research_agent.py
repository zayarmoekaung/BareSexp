"""Example: basic research agent with the builder API."""

from baresexp import builder, compile_baresexp

task = (
    builder
    .task("research-agent", description="Research a topic and return a concise summary")
    .step("collect-context", description="Gather reputable sources and extract key facts")
    .tool("web-search", description="Search the web for supporting references")
    .build()
)

result = compile_baresexp(task)
print(result.baresexp)
