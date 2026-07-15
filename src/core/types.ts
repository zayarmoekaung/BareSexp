export interface Tool {
  name: string;
  description?: string;
  input?: string;
  output?: string;
}

export interface Step {
  name: string;
  description?: string;
  tools?: Tool[];
  input?: string;
  output?: string;
}

export interface OutputSpec {
  format?: string;
  schema?: string;
  description?: string;
}

export interface Options {
  strict?: boolean;
  indent?: number;
  includeMetadata?: boolean;
}

export interface Task {
  name: string;
  description?: string;
  steps?: Step[];
  tools?: Tool[];
  output?: OutputSpec;
  options?: Options;
}

export interface BareSexpDocument {
  task: Task;
}

export type BareSexpNode = Task | Step | Tool | OutputSpec | Options;
