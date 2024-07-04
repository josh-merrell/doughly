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
  isAdding: boolean = false;
  isLoading$: Observable<boolean>;
  private addingSubscription!: Subscription;
  private recipeIngredientsSubscription: Subscription = new Subscription();
  displayNeedsReview: WritableSignal<any> = signal([]);
  displayNoReview: WritableSignal<any> = signal([]);
  displayNeedsReview$!: Observable<any[]>;
  displayNoReview$!: Observable<any[]>;
  private components: WritableSignal<any> = signal([]);

  constructor(
    public dialog: MatDialog,
    public dialogRef: MatDialogRef<RecipeIngredientsModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private store: Store,
    private modalService: ModalService
  ) {
    this.recipe = this.data.recipe;
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
        const components = new Set();
        recipeIngredients.forEach((ri) => {
          if (ri.component) {
            components.add(ri.component);
          }
        });
        this.components.set(Array.from(components));
        const enrichedRecipeIngredients = recipeIngredients.map((ri) => ({
          ...ri,
          name: allIngredients.find(
            (ing: any) => ing.ingredientID === ri.ingredientID
          )?.name,
          purchaseUnit: allIngredients.find(
            (ing: any) => ing.ingredientID === ri.ingredientID
          )?.purchaseUnit,
        }));
        enrichedRecipeIngredients.forEach((ri) => {
          if (ri.measurement > 1) {
            // if the ingredient measurementUnit is equal to one of following strings, add "es" to it: 'box', 'bunch', 'pinch', 'dash'
            ri.measurementUnit = this.enrichMeasurementUnit(ri.measurementUnit);
          }
        });
        const fullList = [...enrichedRecipeIngredients, ...ingredientsToAdd];
        const sortedOne = fullList.sort((a, b) => {
          // sort by ingredient name
          if (a.name < b.name) {
            return -1;
          } else return 1;
        });
        this.displayNeedsReview.set(
          sortedOne.filter((ri) => ri.RIneedsReview === true)
        );
        this.displayNoReview.set(
          sortedOne.filter((ri) => ri.RIneedsReview === false)
        );
        return sortedOne;
      })
    );

    // effect(() => {
    //   const displayedIngredients$
    // })
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
    this.ingredients$ = this.store.select(selectIngredients);
    this.displayNeedsReview$ = this.displayedIngredients$.pipe(
      map((ingredients) =>
        ingredients.filter((ingredient) => ingredient.RIneedsReview === true)
      )
    );
    this.displayNoReview$ = this.displayedIngredients$.pipe(
      map((ingredients) =>
        ingredients.filter((ingredient) => ingredient.RIneedsReview === false)
      )
    );
  }

  /**
  - Iterates over each ingredient using concatMap to ensure sequential processing.
  - Dispatches the action for each ingredient unless an error has already occurred.
  - If an error is detected, sets hasErrorOccurred to true, displays the error modal, and stops processing further actions.
  - Once all actions are processed without errors, closes the modal with a success message. 
  **/
  onSubmit() {
    this.isAdding = true;
    let hasErrorOccurred = false;

    from(this.ingredientsToAdd)
      .pipe(
        concatMap((ingredient) => {
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
                  this.isAdding = false;
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
                    true
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
      )
      .subscribe({
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
        2
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
              true
            );
          }
        });
      } else {
      }
    } else {
      this.ingredientsToAdd = this.ingredientsToAdd.filter(
        (ingredient) => ingredient.ingredientID !== ingredientID
      );
      this.ingredientsToAddSubject.next(this.ingredientsToAdd);
    }
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

        const dialogRef = this.modalService.open(
          AddRecipeIngredientModalComponent,
          {
            data: {
              components: this.components(),
              ingredientsToExclude: [],
            },
            width: '75%',
          },
          2
        );
        if (dialogRef) {
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
                    purchaseUnitRatio: result.purchaseUnitRatio,
                    name: ingredientName,
                    preparation: result.preparation,
                    component: result.component,
                    RIneedsReview: false,
                    toAdd: true,
                  };

                  this.ingredientsToAdd.push(addedRecipeIngredient);

                  this.ingredientsToAddSubject.next(this.ingredientsToAdd);
                });
            }
          });
        } else {
        }
      });
  }

  onIngredientClick(recipeIngredient: any) {
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
            purchaseUnit: recipeIngredient.purchaseUnit,
            purchaseUnitRatio: recipeIngredient.purchaseUnitRatio,
            preparation: recipeIngredient.preparation,
            component: recipeIngredient.component,
            RIneedsReview: recipeIngredient.RIneedsReview,
          },
        },
        width: '75%',
      },
      2
    );
    if (dialogRef) {
      dialogRef!.afterClosed().subscribe((result: any) => {
        if (result === 'success') {
          this.modalService.open(
            ConfirmationModalComponent,
            {
              data: {
                confirmationMessage: `Recipe Ingredient updated`,
              },
            },
            2,
            true
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
