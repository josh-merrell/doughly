import {
  Component,
  Inject,
  WritableSignal,
  effect,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogRef,
} from '@angular/material/dialog';
import { RecipeShoppingList } from 'src/app/recipes/state/recipe/recipe-state';
import { ShoppingList } from 'src/app/groceries/state/shopping-list-state';
import { Router } from '@angular/router';
import { ShoppingListRecipeActions } from 'src/app/groceries/state/shopping-list-recipe-actions';
import { selectError as selectErrorShoppingListRecipe } from 'src/app/groceries/state/shopping-list-recipe-selectors';
import { Store } from '@ngrx/store';
import { selectAdding } from 'src/app/groceries/state/shopping-list-recipe-selectors';
import { filter, take } from 'rxjs';
import { ErrorModalComponent } from 'src/app/shared/ui/error-modal/error-modal.component';
import { ConfirmationModalComponent } from 'src/app/shared/ui/confirmation-modal/confirmation-modal.component';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { selectShoppingLists } from 'src/app/groceries/state/shopping-list-selectors';
import { selectShoppingListRecipes } from 'src/app/groceries/state/shopping-list-recipe-selectors';
import { ModalService } from 'src/app/shared/utils/modalService';
import { UnitService } from 'src/app/shared/utils/unitService';

@Component({
  selector: 'dl-recipe-shopping-list-modal',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule],
  templateUrl: './recipe-shopping-list-modal.component.html',
})
export class RecipeShoppingListModalComponent {
  shoppingList: RecipeShoppingList;
  usageDate: string;
  recipeName: string;
  recipeID: number;
  checkIngredientStock: boolean;
  plannedDate: string;
  shoppingLists: WritableSignal<ShoppingList[]> = signal([]);
  listRecipes: WritableSignal<any[]> = signal([]);
  recipeOnList: WritableSignal<boolean> = signal(false);
  draftList: WritableSignal<boolean> = signal(false);
  public isLoading = false;

  constructor(
    public dialog: MatDialog,
    public dialogRef: MatDialogRef<RecipeShoppingListModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private router: Router,
    private store: Store,
    private modalService: ModalService,
    private unitService: UnitService
  ) {
    this.shoppingList = this.data.shoppingList;
    this.usageDate = this.data.usageDate;
    this.recipeName = this.data.recipeName;
    this.recipeID = this.data.recipeID;
    this.checkIngredientStock = this.data.checkIngredientStock;
    this.plannedDate = this.data.plannedDate;
    effect(
      () => {
        const shoppingLists = this.shoppingLists();
        const listRecipes = this.listRecipes();
        if (shoppingLists && shoppingLists[0]) {
          this.recipeOnList.set(
            listRecipes.some(
              (listRecipe) =>
                listRecipe.recipeID === this.recipeID &&
                listRecipe.shoppingListID === shoppingLists[0].shoppingListID
            )
          );
          this.draftList.set(shoppingLists[0].status === 'draft');
        }
      },
      { allowSignalWrites: true }
    );
  }

  ngOnInit() {
    this.store.select(selectShoppingLists).subscribe((shoppingLists) => {
      this.shoppingLists.set(shoppingLists);
    });
    this.store.select(selectShoppingListRecipes).subscribe((listRecipes) => {
      this.listRecipes.set(listRecipes);
    });

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    // if plannedDate is earlier than tomorrow, set plannedDate to tomorrow
    if (
      new Date(this.plannedDate).getTime() <
      new Date(tomorrow.toISOString().slice(0, 10)).getTime()
    ) {
      this.plannedDate = tomorrow.toISOString().slice(0, 10);
    }
  }

  onAddToDraft() {
    this.isLoading = true;
    this.store.dispatch(
      ShoppingListRecipeActions.addShoppingListRecipe({
        shoppingListID: this.shoppingLists()[0].shoppingListID,
        recipeID: this.recipeID,
        plannedDate: this.plannedDate,
      })
    );
    this.store
      .select(selectAdding)
      .pipe(
        filter((adding) => !adding),
        take(1)
      )
      .subscribe(() => {
        this.store
          .select(selectErrorShoppingListRecipe)
          .pipe(take(1))
          .subscribe((error) => {
            if (error) {
              console.error(
                `Shopping list recipe add failed: ${error.message}, CODE: ${error.statusCode}`
              );
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
            } else {
              this.modalService.open(
                ConfirmationModalComponent,
                {
                  maxWidth: '380px',
                  data: {
                    confirmationMessage:
                      'Recipe added to draft list successfully.',
                  },
                },
                2,
                true
              );
            }
            this.isLoading = false;
          });
      });
  }

  onViewDraftList() {
    this.dialogRef.close();
    this.router.navigate([
      '/groceries/draft',
      this.shoppingLists()[0].shoppingListID,
    ]);
  }

  onViewShoppingList() {
    this.dialogRef.close();
    this.router.navigate(['/groceries']);
  }

  onViewSettings() {
    this.dialogRef.close();
    this.router.navigate(['/settings']);
  }

  onCancel() {
    this.dialogRef.close();
  }

  getDisplayItemUnit(measurement: number, unit: string) {
    const adjustedUnit = measurement > 1 ? this.unitService.plural(unit) : unit;
    if (adjustedUnit.includes('weightOunce')) {
      return adjustedUnit.replace('weightOunce', 'oz');
    } else if (adjustedUnit.includes('fluidOunce')) {
      return adjustedUnit.replace('fluidOunce', 'fl oz');
    } else return adjustedUnit;
  }

  displayIngredientName(name: string, measurement, measurementUnit) {
    if (
      Number(measurement) > 1 &&
      (measurementUnit === 'single' || measurementUnit === '') &&
      !['s', 'S'].includes(name[name.length - 1])
    ) {
      return name + 's';
    } else if (measurementUnit === 'dozen') {
      return name + 's';
    }
    return name;
  }
}
