export interface ToolStockState {
  toolStocks: ToolStock[];
  loading: boolean;
  adding: boolean;
  updating: boolean;
  deleting: boolean;
  error: ToolStockError | null;
}
export interface ToolStock {
  IDtype?: number;
  toolStockID: number;
  toolID: number;
  userID: string;
  quantity: number;
}

export interface ToolStockRow {
  toolStockID: number;
  name: string;
  brand?: string;
  quantity: string;
}

export interface ToolStockError {
  errorType: string;
  message: string;
  statusCode?: number;
  rawError?: any;
}
