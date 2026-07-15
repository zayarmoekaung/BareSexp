import { builder, compileBareSexp } from '../dist/index.js';

const task = builder
  .task({
    name: 'florida-man-news-summarizer',
    description: 'Summarize recent Florida Man news stories into a concise briefing',
  })
  .step({
    name: 'collect-news',
    description: 'Gather recent Florida Man headlines and source links',
  })
  .tool({
    name: 'web-search',
    description: 'Search the web for recent Florida Man news stories',
  })
  .step({
    name: 'summarize',
    description: 'Condense the stories into a short, factual summary',
  })
  .tool({
    name: 'summary-writer',
    description: 'Write a concise bulletin with key events and tone',
  })
  .build();

console.log(compileBareSexp(task));
