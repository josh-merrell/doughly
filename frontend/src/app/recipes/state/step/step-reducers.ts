import { createReducer, on } from '@ngrx/store';
import { StepActions } from './step-actions';
import { StepState } from './step-state';

export const initialState: StepState = {
  steps: [],
  loading: false,
  error: null,
  adding: false,
  updating: false,
  deleting: false,
};

export const StepReducer = createReducer(
  initialState,
  on(StepActions.loadSteps, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),
  on(StepActions.loadStepsSuccess, (state, { steps }) => ({
    ...state,
    steps,
    loading: false,
  })),
  on(StepActions.loadStepsFailure, (state, { error }) => ({
    ...state,
    error,
    loading: false,
  })),
  on(StepActions.loadStep, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),
  on(StepActions.loadStepSuccess, (state, { step }) => {
    return {
      ...state,
      loading: false,
      steps: state.steps.map((existingStep) => existingStep.stepID === step.stepID ? step :   existingStep
      ),
    };
  }),
  on(StepActions.loadStepFailure, (state, { error }) => ({
    ...state,
    error,
    loading: false,
  })),
  on(StepActions.addStep, (state) => ({
    ...state,
    adding: true,
    error: null,
  })),
  on(StepActions.addStepSuccess, (state, { step }) => ({
    ...state,
    steps: [...state.steps, step],
    adding: false,
  })),
  on(StepActions.addStepFailure, (state, { error }) => ({
    ...state,
    error,
    adding: false,
  })),
  on(StepActions.updateStep, (state) => ({
    ...state,
    updating: true,
    error: null,
  })),
  on(StepActions.updateStepSuccess, (state, { step }) => ({
    ...state,
    steps: state.steps.map((existingStep) => existingStep.stepID === step.stepID ? step :   existingStep
    ),
    updating: false,
  })),
  on(StepActions.updateStepFailure, (state, { error }) => ({
    ...state,
    error,
    updating: false,
  })),
  on(StepActions.deleteStep, (state) => ({
    ...state,
    deleting: true,
    error: null,
  })),
  on(StepActions.deleteStepSuccess, (state, { stepID }) => ({
    ...state,
    steps: state.steps.filter((existingStep) => existingStep.stepID !== stepID),
    deleting: false,
  })),
  on(StepActions.deleteStepFailure, (state, { error }) => ({
    ...state,
    error,
    deleting: false,
  }))
)