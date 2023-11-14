export interface Tool {
  toolID: number;
  name: string;
  brand?: string;
  totalStock?: number;
}

export interface ToolState {
  tools: Tool[];
  loading: boolean;
  adding: boolean;
  updating: boolean;
  deleting: boolean;
  error: ToolError | null;
}

export interface ToolError {
  errorType: string;
  message: string;
  statusCode?: number;
  rawError?: any;
}