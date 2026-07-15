import { Task, Step, Tool } from './types.js';

export function validateBareSexp(value: unknown): value is Task {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Partial<Task>;
  if (typeof candidate.name !== 'string' || candidate.name.trim() === '') {
    return false;
  }

  if (candidate.steps !== undefined && !Array.isArray(candidate.steps)) {
    return false;
  }

  if (candidate.tools !== undefined && !Array.isArray(candidate.tools)) {
    return false;
  }

  if (candidate.steps) {
    for (const step of candidate.steps) {
      if (!isValidStep(step)) {
        return false;
      }
    }
  }

  if (candidate.tools) {
    for (const tool of candidate.tools) {
      if (!isValidTool(tool)) {
        return false;
      }
    }
  }

  return true;
}

function isValidStep(value: unknown): value is Step {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const candidate = value as Partial<Step>;
  if (typeof candidate.name !== 'string' || candidate.name.trim() === '') {
    return false;
  }
  if (candidate.tools !== undefined && !Array.isArray(candidate.tools)) {
    return false;
  }
  if (candidate.tools) {
    for (const tool of candidate.tools) {
      if (!isValidTool(tool)) {
        return false;
      }
    }
  }
  return true;
}

function isValidTool(value: unknown): value is Tool {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const candidate = value as Partial<Tool>;
  return typeof candidate.name === 'string' && candidate.name.trim() !== '';
}
