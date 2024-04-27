import { createSelector } from '@ngrx/store';
import { Tool } from './tool-state';

export const selectTools = (state: any) => state.tool.tools;

export const selectToolByID = (toolID: number) =>
    createSelector(selectTools, (tools) => {
      return tools.find((tool: Tool) => tool.toolID === toolID)
    }
  );

export const selectDeleting = (state: any) => state.tool.deleting;

export const selectAdding = (state: any) => state.tool.adding;

export const selectUpdating = (state: any) => state.tool.updating;

export const selectError = (state: any) => state.tool.error;

export const selectLoading = (state: any) => state.tool.loading;
