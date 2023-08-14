import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import {
  selectAdding,
  selectLoading,
  selectError,
  selectRecipeIngredientsByRecipeID,
} from 'src/app/recipes/state/recipe-ingredient/recipe-ingredient-selectors';
import {
  BehaviorSubject,
  Observable,
  Subscription,
  combineLatest,
  concatMap,
  filter,
  from,
  map,
  take,
} from 'rxjs';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogRef,
} from '@angular/material/dialog';
import { Store } from '@ngrx/store';
import { RecipeIngredientActions } from 'src/app/recipes/state/recipe-ingredient/recipe-ingredient-actions';
import { AddRecipeIngredientModalComponent } from '../add-recipe-ingredient-modal/add-recipe-ingredient-modal.component';
import { selectIngredients } from 'src/app/kitchen/feature/ingredients/state/ingredient-selectors';
import { DeleteRequestConfirmationModalComponent } from 'src/app/shared/ui/delete-request-confirmation/delete-request-confirmation-modal.component';
import { DeleteRequestErrorModalComponent } from 'src/app/shared/ui/delete-request-error/delete-request-error-modal.component';
import { DeleteRecipeIngredientModalComponent } from '../delete-recipe-ingredient-modal/delete-recipe-ingredient-modal.component';

@Component({
  selector: 'dl-recipe-ingredients-modal',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule],
  templateUrl: './recipe-ingredients-modal.component.html',
})
export class RecipeIngredientsModalComponent {
  recipe;
  recipeIngredients$!: Observable<any[]>;
  ingredients$!: Observable<any[]>;
  ingredientsToAdd: any[] = [];
  private ingredientsToAddSubject = new BehaviorSubject<any[]>([]);
  displayedIngredients$!: Observable<any[]>;
  isAdding$: Observable<boolean>;
  isLoading$: Observable<boolean>;
  private addingSubscription!: Subscription;
  private recipeIngredientsSubscription: Subscription = new Subscription();

  constructor(
    public dialog: MatDialog,
    public dialogRef: MatDialogRef<RecipeIngredientsModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private store: Store
  ) {
    this.recipe = this.data.recipe;
    this.isAdding$ = this.store.select(selectAdding);
    this.isLoading$ = this.store.select(selectLoading);
    this.recipeIngredients$ = this.store.select(
      selectRecipeIngredientsByRecipeID(this.data.recipe.recipeID)
    );

    this.displayedIngredients$ = combineLatest([
      this.store.select(
        selectRecipeIngredientsByRecipeID(this.data.recipe.recipeID)
      ),
      this.store.select(selectIngredients),
      this.ingredientsToAddSubject.asObservable(),
    ]).pipe(
      map(([recipeIngredients, allIngredients, ingredientsToAdd]) => {
        const enrichedRecipeIngredients = recipeIngredients.map((ri) => ({
          ...ri,
          name: allIngredients.find(
            (ing: any) => ing.ingredientID === ri.ingredientID
          )?.name,
        }));
        return [...enrichedRecipeIngredients, ...ingredientsToAdd];
      })
    );
  }

  ngOnInit() {
    this.ingredients$ = this.store.select(selectIngredients);
  }

  onSubmit() {
    // Submit all added ingredients. Wait for each to process before calling next.
    from(this.ingredientsToAdd)
      .pipe(
        concatMap((ingredient) => {
          this.store.dispatch(
            RecipeIngredientActions.addRecipeIngredient({
              recipeIngredient: ingredient,
            })
          );

          return this.store.select(selectAdding).pipe(
            filter((isAdding) => !isAdding),
            take(1),
            concatMap(() => this.store.select(selectError).pipe(take(1)))
          );
        })
      )
      .subscribe((error) => {
        if (!error) {
          this.dialogRef.close('success');
        } else {
          this.dialogRef.close();
        }
      });
  }

  onDeleteClick(recipeIngredientID: number, ingredientID: number) {
    const dialogRef = this.dialog.open(DeleteRecipeIngredientModalComponent, {
      data: {
        recipeIngredientID,
        ingredientID,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result === 'success') {
        this.dialog.open(DeleteRequestConfirmationModalComponent, {
          data: {
            deleteSuccessMessage: `Ingredient successfully removed from recipe!`,
          },
        });
      } else if (result) {
        this.dialog.open(DeleteRequestErrorModalComponent, {
          data: {
            error: result,
            deleteFailureMessage: `Ingredient could not be removed from recipe.`,
          },
        });
      }
    });
  }

  onAddClick() {
    // Create a local variable for ingredients to exclude
    const ingredientsToExclude: any[] = [];

    // Retrieve the recipe ingredients using the selector
    this.store
      .select(selectRecipeIngredientsByRecipeID(this.data.recipe.recipeID))
      .pipe(take(1))
      .subscribe((recipeIngredients) => {
        // Add the ingredient IDs from the selector to the ingredientsToExclude list
        recipeIngredients.map((recipeIngredient) => {
          ingredientsToExclude.push(recipeIngredient.ingredientID);
        });

        // Add the 'ingredientsToAdd' IDs to 'ingredientsToExclude'
        this.ingredientsToAdd.forEach((ingredient) => {
          ingredientsToExclude.push(ingredient.ingredientID);
        });

        const dialogRef = this.dialog.open(AddRecipeIngredientModalComponent, {
          data: {
            ingredientsToExclude,
          },
        });

        dialogRef.afterClosed().subscribe((result) => {
          if (result?.ingredientID) {
            this.ingredients$
              .pipe(
                map(
                  (ingredients) =>
                    ingredients.find(
                      (ing) => ing.ingredientID === result.ingredientID
                    )?.name
                ),
                take(1)
              )
              .subscribe((ingredientName) => {
                const addedRecipeIngredient: any = {
                  recipeID: this.recipe.recipeID,
                  ingredientID: result.ingredientID,
                  measurement: result.measurement,
                  measurementUnit: result.measurementUnit,
                  name: ingredientName,
                  toAdd: true,
                };

                this.ingredientsToAdd.push(addedRecipeIngredient);

                this.ingredientsToAddSubject.next(this.ingredientsToAdd);
              });
          }
        });
      });
  }

  onCancel() {
    this.dialogRef.close();
  }

  ngOnDestroy() {
    if (this.addingSubscription) {
      this.addingSubscription.unsubscribe();
    }
    if (this.recipeIngredientsSubscription) {
      this.recipeIngredientsSubscription.unsubscribe();
    }
    if (this.ingredientsToAddSubject) {
      this.ingredientsToAddSubject.unsubscribe();
    }
  }
}
