import {
  Inject,
  Component,
  Renderer2,
  ViewChild,
  ElementRef,
  WritableSignal,
  signal,
  effect,
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
import { selectProfile } from 'src/app/profile/state/profile-selectors';
import { ModalService } from 'src/app/shared/utils/modalService';

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
  ingredient: any;
  menuOpenForIndex: number = -1;
  profile: WritableSignal<any> = signal(null);

  constructor(
    private renderer: Renderer2,
    public dialogRef: MatDialogRef<IngredientDetailsModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private store: Store,
    private recipeService: RecipeService,
    private router: Router,
    public dialog: MatDialog,
    private modalService: ModalService
  ) {
    effect(
      () => {
        const profile = this.profile();
        if (profile) {
          this.displayRecipes$ = this.ingredientRecipes$.pipe(
            switchMap((recipes: any[]) => {
              // Map each recipe to an observable fetching its shopping list
              const shoppingListObservables = recipes.map((recipe) =>
                this.recipeService
                  .getShoppingList(
                    recipe.recipeID,
                    profile.checkIngredientStock
                  )
                  .pipe(
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
      },
      { allowSignalWrites: true }
    );
  }

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
      }
    );
  }

  ngOnDestroy() {
    if (this.globalClickListener) {
      this.globalClickListener();
    }
  }

  ngOnInit(): void {
    this.store.select(selectProfile).subscribe((profile) => {
      this.profile.set(profile);
    });
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

    if (this.data.openEdit) {
      this.openEditIngredientDialog();
    }
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

  toggleStockMenu(event: any, index: number) {
    event.stopPropagation();
    this.menuOpenForIndex = this.menuOpenForIndex === index ? -1 : index;
  }

  onAddStock() {
    const dialogRef = this.modalService.open(
      AddIngredientStockModalComponent,
      {
        data: {
          ingredientID: this.ingredient.ingredientID,
        },
      },
      2
    );
    if (dialogRef) {
      dialogRef.afterClosed().subscribe((result: any) => {
        if (result === 'success') {
          this.modalService.open(
            AddRequestConfirmationModalComponent,
            {
              data: {
                results: result,
                addSuccessMessage: `Ingredient Stock added successfully!`,
              },
            },
            2,
            true
          );
        } else if (result === 'error') {
          this.modalService.open(
            AddRequestErrorModalComponent,
            {
              data: {
                error: result,
                addFailureMessage: `Ingredient Stock could not be added.`,
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

  openEditStockDialog(ingredientStockID: number) {
    const dialogRef = this.modalService.open(
      EditIngredientStockModalComponent,
      {
        data: {
          itemID: ingredientStockID,
        },
      },
      2
    );
    if (dialogRef) {
      dialogRef.afterClosed().subscribe((result: any) => {
        if (result === 'success') {
          this.modalService.open(
            ConfirmationModalComponent,
            {
              data: {
                confirmationMessage: `Ingredient Stock updated`,
              },
            },
            2,
            true
          );
          this.dialogRef.close();
        }
      });
    } else {
    }
  }

  openEditIngredientDialog() {
    const dialogRef = this.modalService.open(
      EditIngredientModalComponent,
      {
        width: '440px',
        data: {
          itemID: this.ingredient.ingredientID,
        },
      },
      2
    );
    if (dialogRef) {
      dialogRef.afterClosed().subscribe((result: any) => {
        if (result === 'success') {
          this.modalService.open(
            ConfirmationModalComponent,
            {
              data: {
                confirmationMessage: `Ingredient updated`,
              },
            },
            2,
            true
          );
          this.dialogRef.close('success');
        }
      });
    } else {
    }
  }

  openDeleteStockDialog(ingredientStockID: number) {
    const dialogRef = this.modalService.open(
      DeleteIngredientStockModalComponent,
      {
        data: {
          itemID: ingredientStockID,
          ingredientName: this.ingredient.name,
        },
      },
      2
    );
    if (dialogRef) {
      dialogRef.afterClosed().subscribe((result: any) => {
        if (result === 'success') {
          this.modalService.open(
            ConfirmationModalComponent,
            {
              data: {
                confirmationMessage: `Ingredient Stock deleted`,
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

  openDeleteIngredientDialog() {
    const dialogRef = this.modalService.open(
      DeleteIngredientModalComponent,
      {
        data: {
          itemID: this.ingredient.ingredientID,
          itemName: this.ingredient.name,
        },
      },
      2
    );
    if (dialogRef) {
      dialogRef.afterClosed().subscribe((result: any) => {
        if (result === 'success') {
          this.modalService.open(
            ConfirmationModalComponent,
            {
              data: {
                confirmationMessage: `Ingredient deleted`,
              },
            },
            2,
            true
          );
          this.dialogRef.close();
        }
      });
    } else {
    }
  }
}
