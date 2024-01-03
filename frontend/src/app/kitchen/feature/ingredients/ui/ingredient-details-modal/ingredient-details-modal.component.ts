import {
  Inject,
  Component,
  Renderer2,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  Observable,
  combineLatest,
  forkJoin,
  map,
  switchMap,
  take,
} from 'rxjs';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogRef,
} from '@angular/material/dialog';
import { Store, select } from '@ngrx/store';
import { selectIngredientStocksByIngredientID } from '../../../Inventory/feature/ingredient-inventory/state/ingredient-stock-selectors';
import { selectRecipeIDsByIngredientID } from 'src/app/recipes/state/recipe-ingredient/recipe-ingredient-selectors';
import { selectRecipeByID } from 'src/app/recipes/state/recipe/recipe-selectors';
import { RecipeService } from 'src/app/recipes/data/recipe.service';
import { Router } from '@angular/router';
import { AddIngredientStockModalComponent } from '../../../Inventory/feature/ingredient-inventory/ui/add-ingredient-stock-modal/add-ingredient-stock-modal.component';
import { AddRequestConfirmationModalComponent } from 'src/app/shared/ui/add-request-confirmation/add-request-confirmation-modal.component';
import { AddRequestErrorModalComponent } from 'src/app/shared/ui/add-request-error/add-request-error-modal.component';
import { EditIngredientModalComponent } from '../edit-ingredient-modal/edit-ingredient-modal.component';
import { DeleteIngredientModalComponent } from '../delete-ingredient-modal/delete-ingredient-modal.component';
import { EditIngredientStockModalComponent } from '../../../Inventory/feature/ingredient-inventory/ui/edit-ingredient-stock-modal/edit-ingredient-stock-modal.component';
import { DeleteIngredientStockModalComponent } from '../../../Inventory/feature/ingredient-inventory/ui/delete-ingredient-stock-modal/delete-ingredient-stock-modal.component';
import { ConfirmationModalComponent } from 'src/app/shared/ui/confirmation-modal/confirmation-modal.component';

@Component({
  selector: 'dl-ingredient-details-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ingredient-details-modal.component.html',
})
export class IngredientDetailsModalComponent {
  globalClickListener: () => void = () => {};
  @ViewChild('stockDropdownMenu') stockDropdownMenu!: ElementRef;
  @ViewChild('dropdownMenu') dropdownMenu!: ElementRef;
  ingredientStocks$!: any;
  recipeIDs$!: Observable<number[]>;
  ingredientRecipes$!: Observable<any>;
  displayRecipes$!: Observable<any>;
  menuOpen: boolean = false;
  ingredient: any;
  menuOpenForIndex: number = -1;

  constructor(
    private renderer: Renderer2,
    public dialogRef: MatDialogRef<IngredientDetailsModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private store: Store,
    private recipeService: RecipeService,
    private router: Router,
    public dialog: MatDialog
  ) {}

  ngAfterViewInit() {
    this.globalClickListener = this.renderer.listen(
      'document',
      'click',
      (event) => {
        const clickedInsideStock =
          this.stockDropdownMenu?.nativeElement.contains(event.target);
        if (!clickedInsideStock && this.menuOpenForIndex !== -1) {
          this.menuOpenForIndex = -1;
        }

        const clickedInsideIngredient =
          this.dropdownMenu?.nativeElement.contains(event.target);
        if (!clickedInsideIngredient && this.menuOpen) {
          this.menuOpen = false;
        }
      }
    );
  }

  ngOnDestroy() {
    if (this.globalClickListener) {
      this.globalClickListener();
    }
  }

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
        // Use forkJoin to execute all observables concurrently and wait for all to complete
        return forkJoin(shoppingListObservables);
      })
    );
  }

  getExpirationDate(purchasedDate: string, lifespanDays: number): Date {
    const date = new Date(purchasedDate);
    date.setDate(date.getDate() + lifespanDays);
    return date; // return the Date object
  }

  updateMenuOpenForIndex(index: number) {
    if (this.menuOpenForIndex === index) {
      this.menuOpenForIndex = -1;
    } else {
      this.menuOpenForIndex = index;
    }
  }

  onRecipeClick(recipeID: number): void {
    this.router.navigate(['/recipe', recipeID]);
    this.dialogRef.close();
  }

  toggleMenu(event: any) {
    event.stopPropagation();
    this.menuOpen = !this.menuOpen;
  }

  toggleStockMenu(event: any, index: number) {
    event.stopPropagation();
    this.menuOpenForIndex = this.menuOpenForIndex === index ? -1 : index;
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

  openEditStockDialog(ingredientStockID: number) {
    const dialogRef = this.dialog.open(EditIngredientStockModalComponent, {
      data: {
        itemID: ingredientStockID,
      },
    });

    dialogRef!.afterClosed().subscribe((result: any) => {
      if (result === 'success') {
        this.dialog.open(ConfirmationModalComponent, {
          data: {
            confirmationMessage: `Ingredient Stock updated`,
          },
        });
      }
    });
  }

  openEditIngredientDialog() {
    const dialogRef = this.dialog.open(EditIngredientModalComponent, {
      data: {
        itemID: this.ingredient.ingredientID,
      },
    });
    dialogRef!.afterClosed().subscribe((result: any) => {
      if (result === 'success') {
        this.dialog.open(ConfirmationModalComponent, {
          data: {
            confirmationMessage: `Ingredient updated`,
          },
        });
      }
    });
  }

  openDeleteStockDialog(ingredientStockID: number) {
    const dialogRef = this.dialog.open(DeleteIngredientStockModalComponent, {
      data: {
        itemID: ingredientStockID,
        ingredientName: this.ingredient.name,
      },
    });
    dialogRef!.afterClosed().subscribe((result: any) => {
      if (result === 'success') {
        this.dialog.open(ConfirmationModalComponent, {
          data: {
            confirmationMessage: `Ingredient Stock deleted`,
          },
        });
      }
    });
  }

  openDeleteIngredientDialog() {
    const dialogRef = this.dialog.open(DeleteIngredientModalComponent, {
      data: {
        itemID: this.ingredient.ingredientID,
        itemName: this.ingredient.name,
      },
    });

    dialogRef!.afterClosed().subscribe((result: any) => {
      if (result === 'success') {
        this.dialog.open(ConfirmationModalComponent, {
          data: {
            confirmationMessage: `Ingredient deleted`,
          },
        });
      }
    });
  }
}
