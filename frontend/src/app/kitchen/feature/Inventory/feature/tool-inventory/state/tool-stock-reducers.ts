import { createReducer, on } from '@ngrx/store';
import { ToolStockActions } from './tool-stock-actions';
import { ToolStockState } from './tool-stock-state';

export const initialState: ToolStockState = {
  toolStocks: [],
  loading: false,
  error: null,
  adding: false,
  updating: false,
  deleting: false,
};

export const toolStockReducer = createReducer(
  initialState,
  on(ToolStockActions.loadToolStocks, (state) => ({
    ...state,
    error: null,
    loading: true,
  })),
  on(
    ToolStockActions.loadToolStocksSuccess,
    (state, { toolStocks }) => ({
      ...state,
      toolStocks,
      loading: false,
    })
  ),
  on(
    ToolStockActions.loadToolStocksFailure,
    (state, { error }) => ({
      ...state,
      error,
      loading: false,
    })
  ),
  on(ToolStockActions.loadToolStock, (state) => ({
    ...state,
    error: null,
    loading: true,
  })),
  on(
    ToolStockActions.loadToolStockSuccess,
    (state, { toolStock }) => {
      return {
        ...state,
        loading: false,
        toolStocks: state.toolStocks.map((stock) =>
          stock.toolStockID === toolStock.toolStockID
            ? toolStock
            : stock
        ),
      };
    }
  ),
  on(ToolStockActions.loadToolStockFailure, (state, { error }) => ({
    ...state,
    error,
    loading: false,
  })),
  on(ToolStockActions.addToolStock, (state) => ({
    ...state,
    error: null,
    adding: true,
  })),
  on(
    ToolStockActions.addToolStockSuccess,
    (state, { toolStock }) => ({
      ...state,
      adding: false,
      toolStocks: [...state.toolStocks, toolStock],
    })
  ),
  on(ToolStockActions.addToolStockFailure, (state, { error }) => ({
    ...state,
    error,
    adding: false,
  })),
  on(ToolStockActions.updateToolStock, (state) => ({
    ...state,
    error: null,
    updating: true,
  })),
  on(
    ToolStockActions.updateToolStockSuccess,
    (state, { toolStock }) => ({
      ...state,
      updating: false,
      toolStocks: state.toolStocks.map((stock) =>
        stock.toolStockID === toolStock.toolStockID
          ? toolStock
          : stock
      ),
    })
  ),
  on(
    ToolStockActions.updateToolStockFailure,
    (state, { error }) => ({
      ...state,
      error,
      updating: false,
    })
  ),
  on(ToolStockActions.deleteToolStock, (state) => ({
    ...state,
    error: null,
    deleting: true,
  })),
  on(
    ToolStockActions.deleteToolStockSuccess,
    (state, { toolStockID }) => ({
      ...state,
      deleting: false,
      toolStocks: state.toolStocks.filter(
        (stock) => stock.toolStockID !== toolStockID
      ),
    })
  ),
  on(
    ToolStockActions.deleteToolStockFailure,
    (state, { error }) => ({
      ...state,
      error,
      deleting: false,
    })
  )
);
