import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, mergeMap, tap } from 'rxjs/operators';
import { of } from 'rxjs';
import { RecipeService } from '../../data/recipe.service';
import { RecipeActions } from './recipe-actions';
import { RecipeIngredientActions } from '../recipe-ingredient/recipe-ingredient-actions';
import { RecipeToolActions } from '../recipe-tool/recipe-tool-actions';
import { StepActions } from '../step/step-actions';
import { RecipeStepActions } from '../recipe-step/recipe-step-actions';
import { IngredientActions } from 'src/app/kitchen/feature/ingredients/state/ingredient-actions';
import { ToolActions } from 'src/app/kitchen/feature/tools/state/tool-actions';
import { IngredientStockActions } from 'src/app/kitchen/feature/Inventory/feature/ingredient-inventory/state/ingredient-stock-actions';

@Injectable()
export class RecipeEffects {
  constructor(
    private actions$: Actions,
    private recipeService: RecipeService
  ) {}

  addRecipe$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(RecipeActions.addRecipe),
      mergeMap((action) =>
        this.recipeService.add(action.recipe).pipe(
          map((recipe) =>
            RecipeActions.addRecipeSuccess({
              recipe,
            })
          ),
          catchError((error) =>
            of(
              RecipeActions.addRecipeFailure({
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

  visionAddRecipe$ = createEffect(() =>
    this.actions$.pipe(
      ofType(RecipeActions.visionAddRecipe),
      mergeMap((action) =>
        this.recipeService
          .visionAdd(action.recipeSourceImageURL, action.recipePhotoURL)
          .pipe(
            map((recipeID) =>
              RecipeActions.visionAddRecipeSuccess({
                recipeID,
              })
            ),
            catchError((error) =>
              of(
                RecipeActions.visionAddRecipeFailure({
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

  //load recipe items after vision add
  loadRecipesAfterVisionAdd$ = createEffect(() =>
    this.actions$.pipe(
      ofType(RecipeActions.visionAddRecipeSuccess),
      mergeMap(() => [
        RecipeActions.loadRecipes(),
        RecipeIngredientActions.loadRecipeIngredients(),
        RecipeToolActions.loadRecipeTools(),
        StepActions.loadSteps(),
        RecipeStepActions.loadRecipeSteps(),
        IngredientActions.loadIngredients(),
        ToolActions.loadTools(),
      ])
    )
  );

  UrlAddRecipe$ = createEffect(() =>
    this.actions$.pipe(
      ofType(RecipeActions.UrlAddRecipe),
      mergeMap((action) =>
        this.recipeService
          .fromURLAdd(action.recipeURL, action.recipePhotoURL)
          .pipe(
            map((recipeID) =>
              RecipeActions.UrlAddRecipeSuccess({
                recipeID,
              })
            ),
            catchError((error) =>
              of(
                RecipeActions.UrlAddRecipeFailure({
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

  //load recipe items after URL add
  loadRecipesAfterURLAdd$ = createEffect(() =>
    this.actions$.pipe(
      ofType(RecipeActions.UrlAddRecipeSuccess),
      mergeMap(() => [
        RecipeActions.loadRecipes(),
        RecipeIngredientActions.loadRecipeIngredients(),
        RecipeToolActions.loadRecipeTools(),
        StepActions.loadSteps(),
        RecipeStepActions.loadRecipeSteps(),
        IngredientActions.loadIngredients(),
        ToolActions.loadTools(),
      ])
    )
  );

  constructRecipe$ = createEffect(() =>
    this.actions$.pipe(
      ofType(RecipeActions.constructRecipe),
      mergeMap((action) =>
        this.recipeService.constructRecipe(action.constructBody).pipe(
          map((result) =>
            RecipeActions.constructRecipeSuccess({ recipeID: result.recipeID })
          ),
          catchError((error) =>
            of(
              RecipeActions.constructRecipeFailure({
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

  loadDataAfterConstruct$ = createEffect(() =>
    this.actions$.pipe(
      ofType(RecipeActions.constructRecipeSuccess),
      mergeMap(() => [
        RecipeActions.loadRecipes(),
        RecipeActions.loadRecipeSubscriptions(),
        RecipeIngredientActions.loadRecipeIngredients(),
        RecipeToolActions.loadRecipeTools(),
        StepActions.loadSteps(),
        RecipeStepActions.loadRecipeSteps(),
        IngredientActions.loadIngredients(),
        ToolActions.loadTools(),
      ])
    )
  );

  loadRecipes$ = createEffect(() =>
    this.actions$.pipe(
      ofType(RecipeActions.loadRecipes),
      mergeMap(() =>
        this.recipeService.getAll().pipe(
          map((recipes) =>
            RecipeActions.loadRecipesSuccess({
              recipes,
            })
          ),
          catchError((error) =>
            of(
              RecipeActions.loadRecipesFailure({
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

  loadDiscoverRecipes$ = createEffect(() =>
    this.actions$.pipe(
      ofType(RecipeActions.loadDiscoverRecipes),
      mergeMap(() =>
        this.recipeService.getDiscover().pipe(
          map((discoverRecipes) =>
            RecipeActions.loadDiscoverRecipesSuccess({
              discoverRecipes,
            })
          ),
          catchError((error) =>
            of(
              RecipeActions.loadDiscoverRecipesFailure({
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

  loadRecipe$ = createEffect(() =>
    this.actions$.pipe(
      ofType(RecipeActions.loadRecipe),
      mergeMap((action) =>
        this.recipeService.getByID(action.recipeID).pipe(
          map((recipe) =>
            RecipeActions.loadRecipeSuccess({
              recipe,
            })
          ),
          catchError((error) =>
            of(
              RecipeActions.loadRecipeFailure({
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

  loadRecipeSubsriptions$ = createEffect(() =>
    this.actions$.pipe(
      ofType(RecipeActions.loadRecipeSubscriptions),
      mergeMap((action) =>
        this.recipeService.getSubscriptions().pipe(
          map((recipeSubscriptions) =>
            RecipeActions.loadRecipeSubscriptionsSuccess({
              recipeSubscriptions,
            })
          ),
          catchError((error) =>
            of(
              RecipeActions.loadRecipeSubscriptionsFailure({
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

  deleteRecipeSubscription$ = createEffect(() =>
    this.actions$.pipe(
      ofType(RecipeActions.deleteRecipeSubscription),
      mergeMap((action) =>
        this.recipeService.deleteSubscription(action.subscriptionID).pipe(
          map(
            () =>
              RecipeActions.deleteRecipeSubscriptionSuccess({
                subscriptionID: action.subscriptionID,
              }),
            RecipeActions.loadRecipeSubscriptions()
          ),
          catchError((error) =>
            of(
              RecipeActions.deleteRecipeSubscriptionFailure({
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

  loadRecipesAfterUnsubscribe$ = createEffect(() =>
    this.actions$.pipe(
      ofType(RecipeActions.deleteRecipeSubscriptionSuccess),
      mergeMap(() => [
        RecipeActions.loadRecipes(),
        RecipeActions.loadRecipeSubscriptions(),
      ])
    )
  );

  deleteRecipe$ = createEffect(() =>
    this.actions$.pipe(
      ofType(RecipeActions.deleteRecipe),
      mergeMap((action) =>
        this.recipeService.delete(action.recipeID).pipe(
          map(
            () =>
              RecipeActions.deleteRecipeSuccess({
                recipeID: action.recipeID,
              }),
            RecipeActions.loadRecipes()
          ),
          catchError((error) =>
            of(
              RecipeActions.deleteRecipeFailure({
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

  updateRecipe$ = createEffect(() =>
    this.actions$.pipe(
      ofType(RecipeActions.updateRecipe),
      mergeMap((action) =>
        this.recipeService.update(action.recipe).pipe(
          map(
            (recipe) =>
              RecipeActions.updateRecipeSuccess({
                recipe,
              }),
            RecipeActions.loadRecipes()
          ),
          catchError((error) =>
            of(
              RecipeActions.updateRecipeFailure({
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
  //load recipe details after update
  loadRecipeAfterUpdate$ = createEffect(() =>
    this.actions$.pipe(
      ofType(RecipeActions.updateRecipeSuccess),
      mergeMap((action) => [
        RecipeActions.loadRecipe({ recipeID: action.recipe.recipeID }),
      ])
    )
  );



  useRecipe$ = createEffect(() =>
    this.actions$.pipe(
      ofType(RecipeActions.useRecipe),
      mergeMap((action) =>
        this.recipeService
          .useRecipe(
            action.recipeID,
            action.satisfaction,
            action.difficulty,
            action.note,
            action.checkIngredientStock
          )
          .pipe(
            map(
              () => RecipeActions.useRecipeSuccess(),
              RecipeActions.loadRecipe({ recipeID: action.recipeID }),
              // load ingredient stocks after using recipe
            ),
            catchError((error) =>
              of(
                RecipeActions.useRecipeFailure({
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

  loadIngredientStockAfterUse$ = createEffect(() =>
    this.actions$.pipe(
      ofType(RecipeActions.useRecipeSuccess),
      map(() => IngredientStockActions.loadIngredientStocks())
    )
  );
}
