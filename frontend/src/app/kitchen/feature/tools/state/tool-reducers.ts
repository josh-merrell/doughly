import { createReducer, on } from '@ngrx/store';
import { ToolActions } from './tool-actions';
import { ToolState } from './tool-state';

export const initialState: ToolState = {
  tools: [],
  loading: false,
  deleting: false,
  adding: false,
  updating: false,
  error: null,
};

export const ToolReducer = createReducer(
  initialState,
  on(ToolActions.loadTools, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),
  on(ToolActions.loadToolsSuccess, (state, { tools }) => ({
    ...state,
    tools,
    loading: false,
  })),
  on(ToolActions.loadToolsFailure, (state, { error }) => ({
    ...state,
    error,
    loading: false,
  })),
  on(ToolActions.loadTool, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),
  on(ToolActions.loadToolSuccess, (state, { tool }) => {
    return {
      ...state,
      loading: false,
      tools: state.tools.map((storeTool) =>
        storeTool.toolID === tool.toolID
          ? tool
          : storeTool
      ),
    };
  }),
  on(ToolActions.loadToolFailure, (state, { error }) => ({
    ...state,
    error,
    loading: false,
  })),
  on(ToolActions.addTool, (state) => ({
    ...state,
    adding: true,
    error: null,
  })),
  on(ToolActions.addToolSuccess, (state, { tool }) => ({
    ...state,
    adding: false,
    tools: [...state.tools, tool],
  })),
  on(ToolActions.addToolFailure, (state, { error }) => ({
    ...state,
    error,
    adding: false,
  })),
  on(ToolActions.deleteTool, (state) => ({
    ...state,
    deleting: true,
    error: null,
  })),
  on(ToolActions.deleteToolSuccess, (state, { toolID }) => ({
    ...state,
    deleting: false,
    tools: state.tools.filter((tool) => tool.toolID !== toolID),
  })),
  on(ToolActions.deleteToolFailure, (state, { error }) => ({
    ...state,
    error,
    deleting: false,
  })),
  on(ToolActions.updateTool, (state) => ({
    ...state,
    updating: true,
    error: null,
  })),
  on(ToolActions.updateToolSuccess, (state, { tool }) => ({
    ...state,
    updating: false,
    tools: state.tools.map((storeTool) =>
      storeTool.toolID === tool.toolID
        ? tool : storeTool
    ),
  })),
  on(ToolActions.updateToolFailure, (state, { error }) => ({
    ...state,
    error,
    updating: false,
  }))
);