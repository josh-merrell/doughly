import { Component, WritableSignal, effect, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableFullComponent } from 'src/app/shared/ui/dl-table-full/dl-table-full.component';
import {
  Filter,
  FilterOperatorEnum,
  FilterTypeEnum,
  Sort,
} from 'src/app/shared/state/shared-state';
import { AddIngredientModalComponent } from './ui/add-ingredient-modal/add-ingredient-modal.component';
import { EditIngredientModalComponent } from './ui/edit-ingredient-modal/edit-ingredient-modal.component';
import { Ingredient } from './state/ingredient-state';
import { MatDialog } from '@angular/material/dialog';
import { AddIngredientStockModalComponent } from '../Inventory/feature/ingredient-inventory/ui/add-ingredient-stock-modal/add-ingredient-stock-modal.component';
import { SortingService } from 'src/app/shared/utils/sortingService';
import { FilterService } from 'src/app/shared/utils/filterService';
import { IngredientDetailsModalComponent } from './ui/ingredient-details-modal/ingredient-details-modal.component';
import { ConfirmationModalComponent } from 'src/app/shared/ui/confirmation-modal/confirmation-modal.component';
import { Store } from '@ngrx/store';
import { selectIngredients } from './state/ingredient-selectors';
import { selectIngredientStocks } from '../Inventory/feature/ingredient-inventory/state/ingredient-stock-selectors';
import { Router } from '@angular/router';
import { removeReviewRecipe } from '../../state/kitchen-actions';
import { selectReviewRecipeID } from '../../state/kitchen-selectors';
@Component({
  selector: 'dl-ingredients',
  standalone: true,
  imports: [
    CommonModule,
    TableFullComponent,
    AddIngredientModalComponent,
    EditIngredientModalComponent,
  ],
  templateUrl: './ingredients.component.html',
})
export class IngredientsComponent {
  public ingredients: WritableSignal<Ingredient[]> = signal([]);
  public enhancedIngredients: WritableSignal<Ingredient[]> = signal([]);
  public totalInStock: WritableSignal<Number> = signal(0);
  public filters: WritableSignal<Filter[]> = signal([]);
  public filteredIngredientsNoReview: WritableSignal<any[]> = signal([]);
  public filteredIngredientsNeedsReview: WritableSignal<any[]> = signal([]);
  public displayedRowsNoReview: WritableSignal<any[]> = signal([]);
  public displayedRowsNeedsReview: WritableSignal<any[]> = signal([]);
  private reviewedCount: number = 0;
  private reviewRecipeID: WritableSignal<number | null> = signal(null);

  sorts: Sort[] = [];

  ingredientsPerRow: number = 2;
  public searchFilters: Filter[] = [];
  showIngredientUpArrow: boolean = false;
  showIngredientDownArrow: boolean = false;
  modalActiveForIngredientID: number | null = null;

  constructor(
    private dialog: MatDialog,
    private sortingService: SortingService,
    private filterService: FilterService,
    private store: Store,
    private router: Router
  ) {
    effect(
      () => {
        const ingredients = this.ingredients();
        this.addStockTotals(ingredients);
      },
      { allowSignalWrites: true }
    );

    effect(
      () => {
        const enhancedIngredients = this.enhancedIngredients();
        this.totalInStock.set(
          enhancedIngredients.filter(
            (ingredient) => ingredient.totalStock && ingredient.totalStock > 0
          ).length
        );
      },
      { allowSignalWrites: true }
    );

    effect(
      () => {
        const filters = this.filters();
        const enhancedIngredients = this.enhancedIngredients();
        const noReview = enhancedIngredients.filter((ingredient) => {
          return !ingredient.needsReview;
        });
        const needsReview = enhancedIngredients.filter((ingredient) => {
          return ingredient.needsReview;
        });
        this.filteredIngredientsNoReview.set(
          this.filterService.applyFilters(noReview, filters)
        );
        this.filteredIngredientsNeedsReview.set(
          this.filterService.applyFilters(needsReview, filters)
        );
      },
      { allowSignalWrites: true }
    );

    effect(
      () => {
        const filteredIngredientsNoReview = this.filteredIngredientsNoReview();
        if (
          filteredIngredientsNoReview &&
          filteredIngredientsNoReview.length > 0
        ) {
          const sortedIngredientsNoReview = this.sortingService.applySorts(
            filteredIngredientsNoReview,
            [{ prop: 'name', sortOrderIndex: 0, direction: 'asc' }]
          );
          const sortedRowsNoReview = this.arrangeInRows(
            sortedIngredientsNoReview
          );

          this.displayedRowsNoReview.set(sortedRowsNoReview);
        } else {
          this.displayedRowsNoReview.set([]);
        }
      },
      { allowSignalWrites: true }
    );

    effect(
      () => {
        const filteredIngredientsNeedsReview =
          this.filteredIngredientsNeedsReview();
        if (
          filteredIngredientsNeedsReview &&
          filteredIngredientsNeedsReview.length > 0
        ) {
          const sortedIngredientsNeedsReview = this.sortingService.applySorts(
            filteredIngredientsNeedsReview,
            [{ prop: 'name', sortOrderIndex: 0, direction: 'asc' }]
          );
          const sortedRowsNeedsReview = this.arrangeInRows(
            sortedIngredientsNeedsReview
          );

          this.displayedRowsNeedsReview.set(sortedRowsNeedsReview);
        } else {
          this.displayedRowsNeedsReview.set([]);
        }
      },
      { allowSignalWrites: true }
    );
  }

  ngOnInit(): void {
    this.store.select(selectIngredients).subscribe((ingredients) => {
      this.ingredients.set(ingredients);
    });
    this.store.select(selectReviewRecipeID).subscribe((reviewRecipeID) => {
      this.reviewRecipeID.set(reviewRecipeID);
    });
  }

  addStockTotals(ingredients: Ingredient[]): void {
    this.store.select(selectIngredientStocks).subscribe((ingredientStocks) => {
      const updatedIngredients = ingredients.map((ingredient) => {
        const matchingStocks = ingredientStocks.filter(
          (stock: any) => stock.ingredientID === ingredient.ingredientID
        );
        const totalGrams = matchingStocks.reduce(
          (sum: number, stock: any) => sum + stock.grams,
          0
        );
        const totalStock =
          Math.round((totalGrams / ingredient.gramRatio) * 100) / 100;

        return {
          ...ingredient,
          totalStock: totalStock,
        };
      });
      this.enhancedIngredients.set(updatedIngredients);
    });
  }

  arrangeInRows(sortedIngredients: Ingredient[]) {
    const rows: Ingredient[][] = [];
    if (sortedIngredients.length > 0) {
      sortedIngredients.forEach((ingredient, index) => {
        const rowIndex = Math.floor(index / this.ingredientsPerRow);
        if (!rows[rowIndex]) {
          rows[rowIndex] = [];
        }
        rows[rowIndex].push(ingredient);
      });
    }

    return rows;
  }

  onAddIngredient(): void {
    const dialogRef = this.dialog.open(AddIngredientModalComponent, {
      data: {},
    });

    dialogRef.afterClosed().subscribe((result) => {
      // if result is a number, it is the ingredientID of the newly added ingredient
      if (typeof result === 'number') {
        this.dialog.open(ConfirmationModalComponent, {
          data: {
            confirmationMessage: `Added Ingredient`,
          },
        });
      }
    });
  }

  onAddStock(): void {
    const dialogRef = this.dialog.open(AddIngredientStockModalComponent, {
      data: {},
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result === 'success') {
        this.dialog.open(ConfirmationModalComponent, {
          data: {
            confirmationMessage: `Added Ingredient Stock`,
          },
        });
      }
    });
  }

  updateSearchFilter(value: string) {
    const newFilter: Filter = {
      subject: 'name',
      operator: FilterOperatorEnum.contains,
      filterType: FilterTypeEnum.search,
      operand1: value,
    };
    if (value === '') {
      this.searchFilters = [];
    } else this.searchFilters = [newFilter];
    const noReview = this.enhancedIngredients().filter((ingredient) => {
      return !ingredient.needsReview;
    });
    const needsReview = this.enhancedIngredients().filter((ingredient) => {
      return ingredient.needsReview;
    });
    const filteredIngredientsNoReview = this.filterService.applyFilters(
      noReview,
      this.searchFilters
    );
    this.filteredIngredientsNoReview.set(filteredIngredientsNoReview);
    const filteredIngredientsNeedsReview = this.filterService.applyFilters(
      needsReview,
      this.searchFilters
    );
    this.filteredIngredientsNeedsReview.set(filteredIngredientsNeedsReview);
  }

  checkIngredientScroll(target: EventTarget | null) {
    if (target) {
      let element = target as HTMLElement;
      this.showIngredientUpArrow = element.scrollTop > 0;
      this.showIngredientDownArrow =
        element.scrollHeight - element.scrollTop - element.clientHeight > 1;
    }
  }

  ingredientCardClick(ingredient: any) {
    const openEdit = ingredient.needsReview ? true : false;
    const dialogRef = this.dialog.open(IngredientDetailsModalComponent, {
      data: {
        ingredient: ingredient,
        openEdit,
      },
      width: '75%',
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (openEdit && result === 'success') {
        this.reviewedCount++;
      }
      // close any other open modals
      this.modalActiveForIngredientID = null;

      if (
        this.displayedRowsNeedsReview().length < 2 &&
        this.displayedRowsNoReview().length
      ) {
        // get current value of 'reviewRecipeID' from store
        const reviewRecipeID = this.reviewRecipeID();
        if (reviewRecipeID) {
          // if defined, set 'reviewRecipeID' to null in store and navigate to recipe
          if (this.reviewedCount > 0) {
            this.store.dispatch(removeReviewRecipe());
            this.router.navigate(['recipe', reviewRecipeID]);
          }
        }
      }
    });
  }

  ingredientCardTouchStart(ingredientID: number) {
    this.modalActiveForIngredientID = ingredientID;
  }
  ingredientCardTouchEnd() {
    this.modalActiveForIngredientID = null;
  }
}
