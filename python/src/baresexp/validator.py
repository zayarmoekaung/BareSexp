"""Validator — checks structural correctness of BareSexp objects."""

from .types import Step, Task, Tool


def validate_baresexp(value: object) -> bool:
    """Return True if value is a structurally valid Task."""
    if not isinstance(value, Task):
        return False

    if not value.name or not value.name.strip():
        return False

    if value.steps is not None:
        for step in value.steps:
            if not _is_valid_step(step):
                return False

    if value.tools is not None:
        for tool in value.tools:
            if not _is_valid_tool(tool):
                return False

    return True


def _is_valid_step(value: object) -> bool:
    if not isinstance(value, Step):
        return False
    if not value.name or not value.name.strip():
        return False
    if value.tools is not None:
        for tool in value.tools:
            if not _is_valid_tool(tool):
                return False
    return True


def _is_valid_tool(value: object) -> bool:
    if not isinstance(value, Tool):
        return False
    return bool(value.name and value.name.strip())
