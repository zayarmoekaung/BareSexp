/**
 * Example: Natural Language Reducer
 *
 * Demonstrates how to use the grammar reducer to simplify natural language
 * input into compact, lower-token expressions suitable for BareSexp.
 */

import { reduceNaturalLanguage } from '../src/index.js';

// Example 1: Basic reduction
const input1 = 'Could you please search the web for the latest news about Florida man';
const result1 = reduceNaturalLanguage(input1);
console.log('Example 1: Basic reduction');
console.log(`  Input:  "${result1.original}"`);
console.log(`  Output: "${result1.simplified}"`);
console.log(`  Rules applied: ${result1.appliedRules.join(', ')}`);
console.log();

// Example 2: Aggressive mode
const input2 = 'I would like to just find the best results for my query';
const result2 = reduceNaturalLanguage(input2, { aggressive: true });
console.log('Example 2: Aggressive mode');
console.log(`  Input:  "${result2.original}"`);
console.log(`  Output: "${result2.simplified}"`);
console.log(`  Rules applied: ${result2.appliedRules.join(', ')}`);
console.log();

// Example 3: Keep politeness
const input3 = 'Could you please help me find the data';
const result3 = reduceNaturalLanguage(input3, { keepPoliteness: true });
console.log('Example 3: Keep politeness');
console.log(`  Input:  "${result3.original}"`);
console.log(`  Output: "${result3.simplified}"`);
console.log(`  Rules applied: ${result3.appliedRules.join(', ')}`);
console.log();

// Example 4: Complex input with multiple layers
const input4 = 'I think it would be great if you could basically just run the analysis and also find some related data for me';
const result4 = reduceNaturalLanguage(input4);
console.log('Example 4: Complex multi-layer input');
console.log(`  Input:  "${result4.original}"`);
console.log(`  Output: "${result4.simplified}"`);
console.log(`  Rules applied: ${result4.appliedRules.length} rules`);
console.log();

// Example 5: With custom rules
const result5 = reduceNaturalLanguage(
  'Super find the best results',
  {},
  [
    {
      id: 'custom-super',
      priority: 200,
      pattern: /\bsuper\s+/gi,
      category: 'filler',
      action: 'remove',
    },
  ],
);
console.log('Example 5: Custom rules');
console.log(`  Input:  "${result5.original}"`);
console.log(`  Output: "${result5.simplified}"`);
console.log(`  Rules applied: ${result5.appliedRules.join(', ')}`);
