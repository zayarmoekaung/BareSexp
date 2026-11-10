"""Example: Natural Language Reducer

Demonstrates how to use the grammar reducer to simplify natural language
input into compact, lower-token expressions suitable for BareSexp.
"""

from baresexp import reduce_natural_language
from baresexp.grammar.types import GrammarRule, ReduceOptions, RuleAction, RuleCategory

# Example 1: Basic reduction
input1 = "Could you please search the web for the latest news about Florida man"
result1 = reduce_natural_language(input1)
print("Example 1: Basic reduction")
print(f'  Input:  "{result1.original}"')
print(f'  Output: "{result1.simplified}"')
print(f"  Rules applied: {', '.join(result1.applied_rules)}")
print()

# Example 2: Aggressive mode
input2 = "I would like to just find the best results for my query"
result2 = reduce_natural_language(input2, options=ReduceOptions(aggressive=True))
print("Example 2: Aggressive mode")
print(f'  Input:  "{result2.original}"')
print(f'  Output: "{result2.simplified}"')
print(f"  Rules applied: {', '.join(result2.applied_rules)}")
print()

# Example 3: Keep politeness
input3 = "Could you please help me find the data"
result3 = reduce_natural_language(input3, options=ReduceOptions(keep_politeness=True))
print("Example 3: Keep politeness")
print(f'  Input:  "{result3.original}"')
print(f'  Output: "{result3.simplified}"')
print(f"  Rules applied: {', '.join(result3.applied_rules)}")
print()

# Example 4: Complex input with multiple layers
input4 = "I think it would be great if you could basically just run the analysis and also find some related data for me"
result4 = reduce_natural_language(input4)
print("Example 4: Complex multi-layer input")
print(f'  Input:  "{result4.original}"')
print(f'  Output: "{result4.simplified}"')
print(f"  Rules applied: {len(result4.applied_rules)} rules")
print()

# Example 5: With custom rules
custom_rule = GrammarRule(
    id="custom-super",
    priority=200,
    pattern=r"\bsuper\s+",
    category=RuleCategory.FILLER,
    action=RuleAction.REMOVE,
)
result5 = reduce_natural_language(
    "Super find the best results",
    custom_rules=[custom_rule],
)
print("Example 5: Custom rules")
print(f'  Input:  "{result5.original}"')
print(f'  Output: "{result5.simplified}"')
print(f"  Rules applied: {', '.join(result5.applied_rules)}")
