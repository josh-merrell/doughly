import { createSelector } from '@ngrx/store';
import { Step } from './step-state';

export const selectSteps = (state: any) => state.step.steps;

export const selectStepByID = (stepID: number) => {
  return createSelector(selectSteps, (steps: Step[]) => {
    return steps.find((step: Step) => step.stepID === stepID)
  });
};

export const selectStepByTitle = (title: string) => {
  return createSelector(selectSteps, (steps: Step[]) => {
    return steps.find((step: Step) => step.title === title)
  });
};

export const selectLatestAddedStep = (state: any) => state.step.latestAddedStep;

export const selectDeleting = (state: any) => state.step.deleting;

export const selectAdding = (state: any) => state.step.adding;

export const selectUpdating = (state: any) => state.step.updating;

export const selectError = (state: any) => state.step.error;

export const selectLoading = (state: any) => state.step.loading;