import { createAction, props } from '@ngrx/store';
import { Step } from './step-state';

const loadSteps = createAction('[Step] Load');
const loadStepsSuccess = createAction('[Step] Load Success', props<{ steps: Step[] }>());
const loadStepsFailure = createAction('[Step] Load Failure', props<{ error: any }>());

const loadStep = createAction('[Step] Load Single', props<{ stepID: number }>());
const loadStepSuccess = createAction('[Step] Load Single Success', props<{ step: Step }>());
const loadStepFailure = createAction('[Step] Load Single Failure', props<{ error: any }>());

const addStep = createAction('[Step] Add', props<{ step: Step }>());
const addStepSuccess = createAction('[Step] Add Success', props<{ step: Step }>());
const addStepFailure = createAction('[Step] Add Failure', props<{ error: any }>());

const updateStep = createAction('[Step] Edit', props<{ step: any }>());
const updateStepSuccess = createAction('[Step] Edit Success', props<{ step: Step }>());
const updateStepFailure = createAction('[Step] Edit Failure', props<{ error: any }>());

const deleteStep = createAction('[Step] Delete', props<{ stepID: number }>());
const deleteStepSuccess = createAction('[Step] Delete Success', props<{ stepID: number }>());
const deleteStepFailure = createAction('[Step] Delete Failure', props<{ error: any }>());

export const StepActions = {
  loadSteps,
  loadStepsSuccess,
  loadStepsFailure,
  loadStep,
  loadStepSuccess,
  loadStepFailure,
  addStep,
  addStepSuccess,
  addStepFailure,
  updateStep,
  updateStepSuccess,
  updateStepFailure,
  deleteStep,
  deleteStepSuccess,
  deleteStepFailure,
};