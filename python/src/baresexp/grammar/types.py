"""Types for the natural language grammar reducer."""

from dataclasses import dataclass, field
from enum import Enum
from typing import Callable, Optional


class RuleCategory(str, Enum):
    POLITENESS = "politeness"
    ARTICLES = "articles"
    AUXILIARIES = "auxiliaries"
    FILLER = "filler"
    CONJUNCTIONS = "conjunctions"
    RELATIVE_CLAUSES = "relative-clauses"
    VERB_FORM = "verb-form"
    PREPOSITIONS = "prepositions"
    PRONOUNS = "pronouns"
    STRUCTURE = "structure"


class RuleAction(str, Enum):
    REMOVE = "remove"
    REPLACE = "replace"
    REWRITE = "rewrite"
    NORMALIZE = "normalize"


@dataclass
class GrammarRuleExample:
    """An example showing a rule's effect."""
    before: str
    after: str


@dataclass
class GrammarRule:
    """A single grammar transformation rule."""
    id: str
    priority: int
    pattern: str  # regex pattern string
    category: RuleCategory
    action: RuleAction
    replacement: Optional[str] = None
    example: Optional[GrammarRuleExample] = None
    enabled: bool = True


@dataclass
class ReduceOptions:
    """Options controlling the reduction behavior."""
    keep_articles: bool = False
    keep_politeness: bool = False
    aggressive: bool = False
    to_baresexp: bool = False


@dataclass
class ReduceResult:
    """Result of reducing natural language text."""
    original: str
    simplified: str
    applied_rules: list[str] = field(default_factory=list)
    baresexp: Optional[str] = None
