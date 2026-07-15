import { Task, Step, Tool, OutputSpec, Options, BareSexpDocument } from './types.js';

function tokenize(input: string): string[] {
  const tokens: string[] = [];
  let index = 0;

  while (index < input.length) {
    const char = input[index];
    if (/\s/u.test(char)) {
      index += 1;
      continue;
    }

    if (char === '(' || char === ')') {
      tokens.push(char);
      index += 1;
      continue;
    }

    if (char === '"') {
      let escaped = false;
      let value = '"';
      index += 1;
      while (index < input.length) {
        const current = input[index];
        if (escaped) {
          value += current;
          escaped = false;
        } else if (current === '\\') {
          value += current;
          escaped = true;
        } else if (current === '"') {
          value += current;
          index += 1;
          break;
        } else {
          value += current;
        }
        index += 1;
      }
      tokens.push(value);
      continue;
    }

    let value = '';
    while (index < input.length && !/\s|\(|\)/u.test(input[index])) {
      value += input[index];
      index += 1;
    }
    tokens.push(value);
  }

  return tokens;
}

function parseExpression(tokens: string[], index: number): { value: unknown; nextIndex: number } {
  if (tokens[index] === '(') {
    const items: unknown[] = [];
    let cursor = index + 1;
    while (cursor < tokens.length && tokens[cursor] !== ')') {
      if (tokens[cursor] === '(') {
        const parsed = parseExpression(tokens, cursor);
        items.push(parsed.value);
        cursor = parsed.nextIndex;
      } else {
        items.push(tokens[cursor]);
        cursor += 1;
      }
    }
    return { value: items, nextIndex: cursor + 1 };
  }

  return { value: tokens[index], nextIndex: index + 1 };
}

function parseScalar(value: unknown): string | number | boolean | undefined {
  if (typeof value !== 'string') {
    return value as string | number | boolean | undefined;
  }

  const trimmed = value.trim();
  if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
    return trimmed.slice(1, -1);
  }

  if (trimmed === 'true') {
    return true;
  }
  if (trimmed === 'false') {
    return false;
  }
  if (/^-?\d+(\.\d+)?$/u.test(trimmed)) {
    return Number(trimmed);
  }
  return trimmed;
}

function parseTask(parts: unknown[]): Task {
  const task: Task = {
    name: typeof parts[0] === 'string' ? parts[0] : 'task',
  };

  for (const child of parts.slice(1)) {
    if (!Array.isArray(child)) {
      continue;
    }

    const [key, ...body] = child as unknown[];
    if (typeof key !== 'string') {
      continue;
    }

    switch (key) {
      case 'description':
        task.description = parseScalar(body[0]) as string | undefined;
        break;
      case 'steps':
        task.steps = (body as unknown[]).map((item) => parseStep(item));
        break;
      case 'tools':
        task.tools = (body as unknown[]).map((item) => parseTool(item));
        break;
      case 'output':
        task.output = parseOutput(body);
        break;
      case 'options':
        task.options = parseOptions(body);
        break;
    }
  }

  return task;
}

function parseStep(node: unknown): Step {
  if (!Array.isArray(node)) {
    return { name: 'step' };
  }

  const [key, ...body] = node as unknown[];
  if (typeof key !== 'string' || key !== 'step') {
    return { name: 'step' };
  }

  const step: Step = {
    name: typeof body[0] === 'string' ? body[0] : 'step',
  };

  for (const child of body.slice(1)) {
    if (!Array.isArray(child)) {
      continue;
    }

    const [field, ...fieldBody] = child as unknown[];
    if (typeof field !== 'string') {
      continue;
    }

    switch (field) {
      case 'description':
        step.description = parseScalar(fieldBody[0]) as string | undefined;
        break;
      case 'tools':
        step.tools = (fieldBody as unknown[]).map((item) => parseTool(item));
        break;
      case 'input':
        step.input = parseScalar(fieldBody[0]) as string | undefined;
        break;
      case 'output':
        step.output = parseScalar(fieldBody[0]) as string | undefined;
        break;
    }
  }

  return step;
}

function parseTool(node: unknown): Tool {
  if (!Array.isArray(node)) {
    return { name: 'tool' };
  }

  const [key, ...body] = node as unknown[];
  if (typeof key !== 'string' || key !== 'tool') {
    return { name: 'tool' };
  }

  const tool: Tool = {
    name: typeof body[0] === 'string' ? body[0] : 'tool',
  };

  for (const child of body.slice(1)) {
    if (!Array.isArray(child)) {
      continue;
    }

    const [field, ...fieldBody] = child as unknown[];
    if (typeof field !== 'string') {
      continue;
    }

    switch (field) {
      case 'description':
        tool.description = parseScalar(fieldBody[0]) as string | undefined;
        break;
      case 'input':
        tool.input = parseScalar(fieldBody[0]) as string | undefined;
        break;
      case 'output':
        tool.output = parseScalar(fieldBody[0]) as string | undefined;
        break;
    }
  }

  return tool;
}

function parseOutput(parts: unknown[]): OutputSpec {
  const output: OutputSpec = {};
  for (const child of parts) {
    if (!Array.isArray(child)) {
      continue;
    }

    const [field, ...body] = child as unknown[];
    if (typeof field !== 'string') {
      continue;
    }

    switch (field) {
      case 'format':
        output.format = parseScalar(body[0]) as string | undefined;
        break;
      case 'schema':
        output.schema = parseScalar(body[0]) as string | undefined;
        break;
      case 'description':
        output.description = parseScalar(body[0]) as string | undefined;
        break;
    }
  }
  return output;
}

function parseOptions(parts: unknown[]): Options {
  const options: Options = {};
  for (const child of parts) {
    if (!Array.isArray(child)) {
      continue;
    }

    const [field, ...body] = child as unknown[];
    if (typeof field !== 'string') {
      continue;
    }

    switch (field) {
      case 'strict':
        options.strict = parseScalar(body[0]) as boolean | undefined;
        break;
      case 'indent':
        options.indent = parseScalar(body[0]) as number | undefined;
        break;
      case 'includeMetadata':
        options.includeMetadata = parseScalar(body[0]) as boolean | undefined;
        break;
    }
  }
  return options;
}

export function parseBareSexp(input: string): BareSexpDocument | Task {
  const tokens = tokenize(input.trim());
  if (tokens.length === 0) {
    return { name: 'task' } as Task;
  }

  const parsed = parseExpression(tokens, 0);
  if (Array.isArray(parsed.value)) {
    const [head, ...body] = parsed.value as unknown[];
    if (head === 'task') {
      return parseTask(body);
    }
  }

  return { name: 'task' } as Task;
}
