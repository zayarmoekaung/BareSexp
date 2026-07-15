import { builder, compileBareSexp } from '../dist/index.js';

const task = builder
  .task({ name: 'tool-calling-agent', description: 'Use tools to complete a task' })
  .step({ name: 'plan', description: 'Determine the next action' })
  .tool({ name: 'calculator', description: 'Perform numeric calculations' })
  .build();

console.log(compileBareSexp(task));
