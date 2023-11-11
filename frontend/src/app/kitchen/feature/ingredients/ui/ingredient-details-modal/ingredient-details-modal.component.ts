import { Inject, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable, combineLatest, forkJoin, map, switchMap, take, tap } from 'rxjs';
import { IngredientStock } from '../../../Inventory/feature/ingredient-inventory/state/ingredient-stock-state';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Store, select } from '@ngrx/store';
import { selectIngredientStocksByIngredientID } from '../../../Inventory/feature/ingredient-inventory/state/ingredient-stock-selectors';
import { selectRecipeIDsByIngredientID } from 'src/app/recipes/state/recipe-ingredient/recipe-ingredient-selectors';
import { selectRecipeByID } from 'src/app/recipes/state/recipe/recipe-selectors';
import { RecipeService } from 'src/app/recipes/data/recipe.service';
import { Router } from '@angular/router';
import { AddIngredientStockModalComponent } from '../../../Inventory/feature/ingredient-inventory/ui/add-ingredient-stock-modal/add-ingredient-stock-modal.component';
import { AddRequestConfirmationModalComponent } from 'src/app/shared/ui/add-request-confirmation/add-request-confirmation-modal.component';
import { AddRequestErrorModalComponent } from 'src/app/shared/ui/add-request-error/add-request-error-modal.component';


@Component({
  selector: 'dl-ingredient-details-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ingredient-details-modal.component.html',
})
export class IngredientDetailsModalComponent {
  ingredientStocks$!: any;
  recipeIDs$!: Observable<number[]>;
  ingredientRecipes$!: Observable<any>;
  displayRecipes$!: Observable<any>;
  menuOpen: boolean = false;
  ingredient: any;

  constructor(
    public dialogRef: MatDialogRef<IngredientDetailsModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private store: Store,
    private recipeService: RecipeService,
    private router: Router,
    public dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.ingredient = this.data.ingredient;
    this.ingredientStocks$ = this.store.pipe(
      select(selectIngredientStocksByIngredientID(this.ingredient.ingredientID))
    );
    this.recipeIDs$ = this.store.pipe(
      select(selectRecipeIDsByIngredientID(this.ingredient.ingredientID))
    );

    this.ingredientRecipes$ = this.recipeIDs$.pipe(
      switchMap((recipeIDs: number[]) => {
        // Transform each recipeID into an observable of its corresponding recipe
        const recipeObservables = recipeIDs.map((recipeID) =>
          this.store.pipe(select(selectRecipeByID(recipeID)))
        );
        return combineLatest(recipeObservables);
      })
    );

    this.displayRecipes$ = this.ingredientRecipes$.pipe(
      switchMap((recipes: any[]) => {
        // Map each recipe to an observable fetching its shopping list
        const shoppingListObservables = recipes.map((recipe) =>
          this.recipeService.getShoppingList(recipe.recipeID).pipe(
            take(1),
            map((shoppingList) => ({
              ...recipe,
              shoppingList: shoppingList,
            }))
          )
        );
        console.log(`RECIPES: `, recipes);
        // Use forkJoin to execute all observables concurrently and wait for all to complete
        return forkJoin(shoppingListObservables);
      })
    );
  }

  onRecipeClick(recipeID: number): void {
    this.router.navigate(['/recipes', recipeID]);
    this.dialogRef.close();
  }

  toggleMenu(event: any) {
    event.stopPropagation();
    this.menuOpen = !this.menuOpen;
  }

  onAddStock() {
    const dialogRef = this.dialog.open(AddIngredientStockModalComponent, {
      data: {
        ingredientID: this.ingredient.ingredientID,
      },
    });
    dialogRef!.afterClosed().subscribe((result: any) => {
      if (result === 'success') {
        this.dialog.open(AddRequestConfirmationModalComponent, {
          data: {
            results: result,
            addSuccessMessage: `Ingredient Stock added successfully!`,
          },
        });
      } else if (result === 'error') {
        this.dialog.open(AddRequestErrorModalComponent, {
          data: {
            error: result,
            addFailureMessage: `Ingredient Stock could not be added.`,
          },
        });
      }
    });
  }
}
