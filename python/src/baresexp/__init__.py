"""BareSexp — minimal-token S-expression language for AI agent instructions."""

from .builder import BareSexpBuilder, builder
from .compiler import compile_baresexp
from .context import compile_context
from .document import BareSexpDocument
from .grammar import reduce_natural_language
from .grammar.types import (
    GrammarRule,
    GrammarRuleExample,
    ReduceOptions,
    ReduceResult,
    RuleAction,
    RuleCategory,
)
from .json_compiler import compile_json, parse_json
from .minimizer import minimize_description, minimize_field_name
from .parser import parse_baresexp, parse_context
from .types import (
    BareSexpParts,
    BareSexpResult,
    CompileOptions,
    Context,
    MetadataEntry,
    Options,
    OutputSpec,
    OutputMode,
    Step,
    Task,
    Tool,
)
from .validator import validate_baresexp

__all__ = [
    "BareSexpBuilder",
    "BareSexpDocument",
    "BareSexpParts",
    "BareSexpResult",
    "CompileOptions",
    "Context",
    "GrammarRule",
    "GrammarRuleExample",
    "MetadataEntry",
    "Options",
    "OutputMode",
    "OutputSpec",
    "ReduceOptions",
    "ReduceResult",
    "RuleAction",
    "RuleCategory",
    "Step",
    "Task",
    "Tool",
    "builder",
    "compile_baresexp",
    "compile_context",
    "compile_json",
    "parse_json",
    "minimize_description",
    "minimize_field_name",
    "parse_baresexp",
    "parse_context",
    "reduce_natural_language",
    "validate_baresexp",
]
