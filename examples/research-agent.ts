import { builder, compileBareSexp } from '../dist/index.js';

const task = builder
  .task({ name: 'research-agent', description: 'Research a topic and return a concise summary' })
  .step({ name: 'collect-context', description: 'Gather reputable sources and extract key facts' })
  .tool({ name: 'web-search', description: 'Search the web for supporting references' })
  .build();

console.log(compileBareSexp(task));
