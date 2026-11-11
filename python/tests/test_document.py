"""Tests for BareSexpDocument and content field."""

from baresexp import (
    BareSexpDocument,
    builder,
    parse_baresexp,
)


def test_compile_parts_empty():
    doc = BareSexpDocument()
    parts = doc.compile_parts()
    assert parts.context == ""
    assert parts.task == ""
    assert parts.full == ""


def test_compile_parts_context_and_task():
    doc = (
        BareSexpDocument()
        .minimal()
        .context(name="reviewer", role="You are a code reviewer")
        .task(name="review", description="Review the code")
    )
    parts = doc.compile_parts()
    assert "(context reviewer" in parts.context
    assert "(role" in parts.context
    assert "(task review" in parts.task
    assert "(description" in parts.task
    assert "(context reviewer" in parts.full
    assert "(task review" in parts.full


def test_compile_context_only():
    doc = (
        BareSexpDocument()
        .minimal()
        .context(name="ctx", role="Helpful assistant")
        .task(name="task", description="Do something")
    )
    result = doc.compile_context()
    assert "(context ctx" in result.baresexp
    assert "(task" not in result.baresexp


def test_compile_task_only():
    doc = (
        BareSexpDocument()
        .minimal()
        .context(name="ctx", role="Helpful assistant")
        .task(name="task", description="Do something")
    )
    result = doc.compile_task()
    assert "(task task" in result.baresexp
    assert "(context" not in result.baresexp


def test_compile_full():
    doc = (
        BareSexpDocument()
        .minimal()
        .context(name="ctx", role="Helpful assistant")
        .task(name="task", description="Do something")
    )
    result = doc.compile()
    assert "(context ctx" in result.baresexp
    assert "(task task" in result.baresexp


def test_condensed_output():
    doc = (
        BareSexpDocument()
        .minimal()
        .context(name="ctx", role="Helpful assistant")
        .task(name="task", description="Do something")
    )
    from baresexp import CompileOptions
    parts = doc.compile_parts(options=CompileOptions(condense=True))
    assert "\n" not in parts.context
    assert "\n" not in parts.task
    assert "\n" not in parts.full


def test_multiple_contexts_and_tasks():
    doc = (
        BareSexpDocument()
        .minimal()
        .context(name="ctx1", role="First context")
        .context(name="ctx2", domain="Second context")
        .task(name="task1", description="First task")
        .task(name="task2", description="Second task")
    )
    parts = doc.compile_parts()
    assert "(context ctx1" in parts.context
    assert "(context ctx2" in parts.context
    assert "(task task1" in parts.task
    assert "(task task2" in parts.task


def test_task_with_content():
    doc = (
        BareSexpDocument()
        .minimal()
        .task(
            name="analyze",
            description="Process the CSV data",
            content="name,age\nAlice,30\nBob,25",
        )
    )
    result = doc.compile_task()
    assert "(task analyze" in result.baresexp
    assert "(description" in result.baresexp
    assert "(content" in result.baresexp


def test_last_task():
    doc = (
        BareSexpDocument()
        .task(name="first")
        .task(name="second")
    )
    assert doc.last_task().name == "second"


def test_last_task_empty():
    doc = BareSexpDocument()
    assert doc.last_task() is None


def test_parse_content():
    input_text = """(task analyze
  (description "Process CSV data")
  (content "name,age,Alice,30")
  (steps
    (step count
      (description "Count rows")
    )
  )
)"""
    parsed = parse_baresexp(input_text)
    assert parsed.name == "analyze"
    assert parsed.content == "name,age,Alice,30"
