import { createAction, props } from '@ngrx/store';
import { Tool } from './tool-state';

const loadTools = createAction('[Tools] Load');
const loadToolsSuccess = createAction(
  '[Tools] Load Success',
  props<{ tools: Tool[] }>()
);
const loadToolsFailure = createAction(
  '[Tools] Load Failure',
  props<{ error: any }>()
);

const loadTool = createAction(
  '[Tools] Load Single',
  props<{ toolID: number }>()
);
const loadToolSuccess = createAction(
  '[Tools] Load Single Success',
  props<{ tool: Tool }>()
);
const loadToolFailure = createAction(
  '[Tools] Load Single Failure',
  props<{ error: any }>()
);

const addTool = createAction(
  '[Tools] Add',
  props<{ tool: Tool }>()
);
const addToolSuccess = createAction(
  '[Tools] Add Success',
  props<{ tool: Tool }>()
);
const addToolFailure = createAction(
  '[Tools] Add Failure',
  props<{ error: any }>()
);
const deleteTool = createAction(
  '[Tools] Delete',
  props<{ toolID: number }>()
);
const deleteToolSuccess = createAction(
  '[Tools] Delete Success',
  props<{ toolID: number }>()
);
const deleteToolFailure = createAction(
  '[Tools] Delete Failure',
  props<{ error: any }>()
);

const updateTool = createAction(
  '[Tools] Update',
  props<{ tool: Tool }>()
);
const updateToolSuccess = createAction(
  '[Tools] Update Success',
  props<{ tool: Tool }>()
);
const updateToolFailure = createAction(
  '[Tools] Update Failure',
  props<{ error: any }>()
);

export const ToolActions = {
  loadTools,
  loadToolsSuccess,
  loadToolsFailure,
  loadTool,
  loadToolSuccess,
  loadToolFailure,
  addTool,
  addToolSuccess,
  addToolFailure,
  deleteTool,
  deleteToolSuccess,
  deleteToolFailure,
  updateTool,
  updateToolSuccess,
  updateToolFailure
};

