import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, mergeMap, concatMap } from 'rxjs/operators';
import { of } from 'rxjs';
import { ToolService } from  '../data/tool.service';
import { ToolActions } from './tool-actions';
import { Tool } from './tool-state';

@Injectable()
export class ToolEffects {
  constructor(private actions$: Actions, private toolService: ToolService) {}

  addTool$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(ToolActions.addTool),
      mergeMap((action) =>
        this.toolService.add(action.tool).pipe(
          map((tool: Tool) => ToolActions.addToolSuccess({ tool })),
          catchError((error) =>
            of(
              ToolActions.addToolFailure({
                error: {
                  message: error.error.error,
                  statusCode: error.status,
                  rawError: error,
                },
              })
            )
          )
        )
      )
    );
  });

  loadTools$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ToolActions.loadTools),
      mergeMap(() =>
        this.toolService.getAll().pipe(
          map((tools: Tool[]) => ToolActions.loadToolsSuccess({ tools })),
          catchError((error) =>
            of(
              ToolActions.loadToolsFailure({
                error: {
                  message: error.error.error,
                  statusCode: error.status,
                  rawError: error,
                },
              })
            )
          )
        )
      )
    )
  );

  loadTool$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ToolActions.loadTool),
      mergeMap((action) =>
        this.toolService.getByID(action.toolID).pipe(
          map((tool: Tool) => ToolActions.loadToolSuccess({ tool })),
          catchError((error) =>
            of(
              ToolActions.loadToolFailure({
                error: {
                  message: error.error.error,
                  statusCode: error.status,
                  rawError: error,
                },
              })
            )
          )
        )
      )
    )
  );

  updateTool$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ToolActions.updateTool),
      mergeMap((action) =>
        this.toolService.update(action.tool).pipe(
          map((tool: Tool) => ToolActions.updateToolSuccess({ tool })),
          catchError((error) =>
            of(
              ToolActions.updateToolFailure({
                error: {
                  message: error.error.error,
                  statusCode: error.status,
                  rawError: error,
                },
              })
            )
          )
        )
      )
    )
  );

  deleteTool$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ToolActions.deleteTool),
      mergeMap((action) =>
        this.toolService.delete(action.toolID).pipe(
          map(() => ToolActions.deleteToolSuccess({ toolID: action.toolID })),
          catchError((error) =>
            of(
              ToolActions.deleteToolFailure({
                error: {
                  message: error.error.error,
                  statusCode: error.status,
                  rawError: error,
                },
              })
            )
          )
        )
      )
    )
  );
}