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

@Component({
  selector: 'dl-recipe-ingredients-modal',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule],
  templateUrl: './recipe-ingredients-modal.component.html',
})
export class RecipeIngredientsModalComponent {
  recipe;
  recipeIngredients$!: Observable<any[]>;
  recipeIngredients: any[] = [];
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
      this.store.select(selectRecipeIngredientsByRecipeID(this.data.recipeID)),
      this.ingredientsToAddSubject.asObservable(),
    ]).pipe(
      map(([recipeIngredients, ingredientsToAdd]) => {
        return [...recipeIngredients, ...ingredientsToAdd];
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

  onAddClick() {
    const ingredientsToExclude: any[] = [];
    if (this.recipeIngredients.length > 0)
      this.recipeIngredients.map(
        (recipeIngredient) => recipeIngredient.ingredientID
      );
    //add the 'ingredientsToAdd' IDs to 'ingredientsToExclude'
    this.ingredientsToAdd.forEach((ingredient) => {
      ingredientsToExclude.push(ingredient.ingredientID);
    });

    const dialogRef = this.dialog.open(AddRecipeIngredientModalComponent, {
      data: {
        ingredientsToExclude,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      const addedRecipeIngredient = {
        recipeID: this.data.recipeID,
        ingredientID: result.ingredientID,
        measurement: result.measurement,
        measurementUnit: result.measurementUnit,
      };
      this.ingredientsToAdd.push(addedRecipeIngredient);

      this.ingredientsToAddSubject.next(this.ingredientsToAdd);
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
