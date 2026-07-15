export type OutputMode = 'full' | 'minimal';

export interface CompileOptions {
  mode?: OutputMode;
  indent?: boolean;
  preserveMetadata?: boolean;
  condense?: boolean;
}

export interface MetadataEntry {
  original: unknown;
  shortened?: string;
  fieldPath: string;
}

export interface MetadataStore {
  [taskId: string]: MetadataEntry[];
}

export interface BareSexpResult {
  baresexp: string;
  metadata: MetadataStore;
  tokenCount?: number;
}

export interface Tool {
  name: string;
  description?: string;
  input?: string;
  output?: string;
  metadata?: MetadataEntry[];
}

export interface Step {
  name: string;
  description?: string;
  tools?: Tool[];
  input?: string;
  output?: string;
  metadata?: MetadataEntry[];
}

export interface OutputSpec {
  format?: string;
  schema?: string;
  description?: string;
  metadata?: MetadataEntry[];
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
  metadata?: MetadataEntry[];
}

export interface BareSexpDocument {
  task: Task;
}

export type BareSexpNode = Task | Step | Tool | OutputSpec | Options;
