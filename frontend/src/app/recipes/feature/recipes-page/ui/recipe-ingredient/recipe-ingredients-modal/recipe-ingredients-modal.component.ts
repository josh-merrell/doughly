import {
  Component,
  effect,
  Inject,
  signal,
  WritableSignal,
} from '@angular/core';
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
  EMPTY,
  Observable,
  Subscription,
  combineLatest,
  concatMap,
  filter,
  from,
  map,
  take,
  tap,
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
import { DeleteRecipeIngredientModalComponent } from '../delete-recipe-ingredient-modal/delete-recipe-ingredient-modal.component';
import { ConfirmationModalComponent } from 'src/app/shared/ui/confirmation-modal/confirmation-modal.component';
import { ErrorModalComponent } from 'src/app/shared/ui/error-modal/error-modal.component';
import { EditRecipeIngredientModalComponent } from '../edit-recipe-ingredient-modal/edit-recipe-ingredient-modal.component';
import { ModalService } from 'src/app/shared/utils/modalService';
import { NgAutoAnimateDirective } from 'ng-auto-animate'; 


@Component({
  selector: 'dl-recipe-ingredients-modal',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule, NgAutoAnimateDirective],
  templateUrl: './recipe-ingredients-modal.component.html',
})
export class RecipeIngredientsModalComponent {
  recipe;
  recipeIngredients: WritableSignal<any> = signal([]);
  ingredients: WritableSignal<any> = signal([]);
  ingredientsToAdd: WritableSignal<any> = signal([]);
  displayedIngredients: WritableSignal<any> = signal([]);
  // isAdding: boolean = false;
  isAdding: WritableSignal<boolean> = signal(false);
  isLoading: WritableSignal<boolean> = signal(false);
  displayNeedsReview: WritableSignal<any> = signal([]);
  displayNoReview: WritableSignal<any> = signal([]);
  private components: WritableSignal<any> = signal([]);

  constructor(
    public dialog: MatDialog,
    public dialogRef: MatDialogRef<RecipeIngredientsModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private store: Store,
    private modalService: ModalService
  ) {
    this.recipe = this.data.recipe;

    effect(() => {
      const components = new Set();
      this.recipeIngredients().forEach((ri) => {
        if (ri.component) {
          components.add(ri.component);
        }
      });
      this.components.set(Array.from(components));
      const enrichedRecipeIngredients = this.recipeIngredients().map((ri) => ({
        ...ri,
        name: this.ingredients().find(
          (ing: any) => ing.ingredientID === ri.ingredientID
        )?.name,
        purchaseUnit: this.ingredients().find(
          (ing: any) => ing.ingredientID === ri.ingredientID
        )?.purchaseUnit,
      }));
      const fullList = [...enrichedRecipeIngredients, ...this.ingredientsToAdd()];
      const sortedOne = fullList.sort((a, b) => {
        // sort by ingredient name
        if (a.name < b.name) {
          return -1;
        } else return 1;
      });
      this.displayedIngredients.set(sortedOne);

    }, { allowSignalWrites: true });

    effect(() => {
      const di = this.displayedIngredients();
      this.displayNeedsReview.set(di.filter((ing) => ing.RIneedsReview === true));
      this.displayNoReview.set(di.filter((ing) => ing.RIneedsReview === false));
    }, { allowSignalWrites: true });
  }

  enrichMeasurementUnit(measurementUnit) {
    if (
      measurementUnit === 'box' ||
      measurementUnit === 'bunch' ||
      measurementUnit === 'pinch' ||
      measurementUnit === 'dash'
    ) {
      measurementUnit += 'es';
    } else {
      measurementUnit += 's';
    }
    return measurementUnit;
  }

  ngOnInit() {
    this.store.select(selectIngredients).subscribe((ingredients) => {
      this.ingredients.set(ingredients);
    });

    this.store
      .select(selectRecipeIngredientsByRecipeID(this.data.recipe.recipeID))
      .subscribe((recipeIngredients) => {
        this.recipeIngredients.set(recipeIngredients);
      });

    this.store.select(selectLoading).subscribe((loading) => {
      this.isLoading.set(loading);
    });
  }

  /**
  - Iterates over each ingredient using concatMap to ensure sequential processing.
  - Dispatches the action for each ingredient unless an error has already occurred.
  - If an error is detected, sets hasErrorOccurred to true, displays the error modal, and stops processing further actions.
  - Once all actions are processed without errors, closes the modal with a success message. 
  **/
  onSubmit() {
    this.isAdding.set(true);
    let hasErrorOccurred = false;

    const ingredientsToAdd = this.ingredientsToAdd();
    // dispatch the action for each ingredient to add, wait for each to complete before moving to the next
    from(ingredientsToAdd).pipe(
      concatMap((ingredient: any) => {
        // Only dispatch if no error has occurred
        if (!hasErrorOccurred) {
          this.store.dispatch(
            RecipeIngredientActions.addRecipeIngredient({
              recipeIngredient: ingredient,
            })
          );

          return this.store.select(selectAdding).pipe(
            filter((isAdding) => !isAdding),
            take(1),
            concatMap(() => this.store.select(selectError).pipe(take(1))),
            tap((error) => {
              if (error) {
                this.isAdding.set(false);
                hasErrorOccurred = true; // Set flag on error
                this.modalService.open(
                  ErrorModalComponent,
                  {
                    maxWidth: '380px',
                    data: {
                      errorMessage: error.message,
                      statusCode: error.statusCode,
                    },
                  },
                  2,
                  true,
                  'ErrorModalComponent'
                );
                this.dialogRef.close(); // Close the current modal
              }
            })
          );
        } else {
          // Immediately complete the observable if an error has occurred
          return EMPTY;
        }
      })
    ).subscribe({
      complete: () => {
        if (!hasErrorOccurred) {
          this.dialogRef.close('success');
        }
      },
    });
  }

  onDeleteClick(recipeIngredientID: number, ingredientID: number) {
    if (recipeIngredientID) {
      const dialogRef = this.modalService.open(
        DeleteRecipeIngredientModalComponent,
        {
          data: {
            recipeIngredientID,
            ingredientID,
          },
        },
        2,
        false,
        'DeleteRecipeIngredientModalComponent'
      );
      if (dialogRef) {
        dialogRef.afterClosed().subscribe((result) => {
          if (result === 'success') {
            this.modalService.open(
              ConfirmationModalComponent,
              {
                data: {
                  confirmationMessage: `Ingredient successfully removed from recipe!`,
                },
              },
              2,
              true,
              'ConfirmationModalComponent'
            );
          }
        });
      } else {
      }
    } else {
      this.ingredientsToAdd.set(
        this.ingredientsToAdd().filter(
          (ingredient) => ingredient.ingredientID !== ingredientID
        )
      );
    }
  }

  onAddClick() {
    // Create a local variable for ingredients to exclude
    const ingredientsToExclude: any[] = [];

    const recipeIngredients = this.recipeIngredients();
    // Add the ingredient IDs from the selector to the ingredientsToExclude list
    recipeIngredients.map((recipeIngredient) => {
      ingredientsToExclude.push(recipeIngredient.ingredientID);
    });

    // Add the 'ingredientsToAdd' IDs to 'ingredientsToExclude'
    this.ingredientsToAdd().forEach((ingredient) => {
      ingredientsToExclude.push(ingredient.ingredientID);
    });

    const dialogRef = this.modalService.open(
      AddRecipeIngredientModalComponent,
      {
        data: {
          components: this.components(),
          ingredientsToExclude: ingredientsToExclude,
        },
        width: '75%',
      },
      2,
      false,
      'AddRecipeIngredientModalComponent'
    );
    if (dialogRef) {
      dialogRef.afterClosed().subscribe((result) => {
        if (result?.ingredientID) {
          this.ingredients().filter((ing) => {
            if (ing.ingredientID === result.ingredientID) {
              const addedRecipeIngredient: any = {
                recipeID: this.recipe.recipeID,
                ingredientID: result.ingredientID,
                measurement: result.measurement,
                measurementUnit: result.measurementUnit,
                purchaseUnitRatio: result.purchaseUnitRatio,
                name: ing.name,
                preparation: result.preparation,
                component: result.component,
                RIneedsReview: false,
                toAdd: true,
                // generate random ID for the ingredient to be added
                draftID: Math.floor(Math.random() * 1000000),
              };

              this.ingredientsToAdd.set([...this.ingredientsToAdd(), addedRecipeIngredient]);
            }
          });
        }
      });
    } else {
    }
  }

  onIngredientClick(recipeIngredient: any) {
    // get associated ingredient
    const ingredient = this.ingredients().find(
      (ing) => ing.ingredientID === recipeIngredient.ingredientID
    );

    const dialogRef = this.modalService.open(
      EditRecipeIngredientModalComponent,
      {
        data: {
          components: this.components(),
          recipeIngredient: {
            ingredient: recipeIngredient.name,
            recipeID: this.recipe.recipeID,
            recipeIngredientID: recipeIngredient.recipeIngredientID,
            ingredientID: recipeIngredient.ingredientID,
            measurement: recipeIngredient.measurement,
            measurementUnit: recipeIngredient.measurementUnit,
            purchaseUnit: ingredient.purchaseUnit,
            purchaseUnitRatio: recipeIngredient.purchaseUnitRatio,
            preparation: recipeIngredient.preparation,
            component: recipeIngredient.component,
            RIneedsReview: recipeIngredient.RIneedsReview,
          },
        },
        width: '75%',
      },
      2,
      false,
      'EditRecipeIngredientModalComponent'
    );
    if (dialogRef) {
      dialogRef!.afterClosed().subscribe((result: any) => {
        if (result.status && result.status === 'updatedDraft') {
          const updatedRecipeIngredient: any = {
            recipeID: this.recipe.recipeID,
            recipeIngredientID: recipeIngredient.recipeIngredientID,
            ingredientID: recipeIngredient.ingredientID,
            measurement: result.measurement,
            measurementUnit: result.measurementUnit,
            purchaseUnitRatio: result.purchaseUnitRatio,
            preparation: result.preparation,
            component: result.component,
            RIneedsReview: recipeIngredient.RIneedsReview,
            name: recipeIngredient.name,
            purchaseUnit: recipeIngredient.purchaseUnit,
            toAdd: true,
            draftID: recipeIngredient.draftID,
          };

          this.ingredientsToAdd.set(
            this.ingredientsToAdd().map((ingredient) => {
              if (ingredient.draftID === recipeIngredient.draftID) {
                return updatedRecipeIngredient;
              } else {
                return ingredient;
              }
            })
          );
        }
        if (result === 'success') {
          this.modalService.open(
            ConfirmationModalComponent,
            {
              data: {
                confirmationMessage: `Recipe Ingredient updated`,
              },
            },
            2,
            true,
            'ConfirmationModalComponent'
          );
        }
      });
    } else {
    }
  }

  onCancel() {
    this.dialogRef.close();
  }

  ngOnDestroy() {
  }
}
