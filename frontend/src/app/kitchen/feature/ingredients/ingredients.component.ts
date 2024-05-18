import { Component, WritableSignal, effect, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
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
import { ModalService } from 'src/app/shared/utils/modalService';
@Component({
  selector: 'dl-ingredients',
  standalone: true,
  imports: [
    CommonModule,
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
  public displayNoReview: WritableSignal<any[]> = signal([]);
  public displayNeedsReview: WritableSignal<any[]> = signal([]);
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
    private router: Router,
    private modalService: ModalService
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

          this.displayNoReview.set(sortedIngredientsNoReview);
        } else {
          this.displayNoReview.set([]);
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

          this.displayNeedsReview.set(sortedIngredientsNeedsReview);
        } else {
          this.displayNeedsReview.set([]);
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

  onAddIngredient(): void {
    const ref = this.modalService.open(
      AddIngredientModalComponent,
      {
        data: {},
      },
      1
    );
    if (ref) {
      ref.afterClosed().subscribe((result) => {
        // if result is a number, it is the ingredientID of the newly added ingredient
        if (typeof result === 'number') {
          this.modalService.open(
            ConfirmationModalComponent,
            {
              data: {
                confirmationMessage: `Added Ingredient`,
              },
            },
            1,
            true
          );
        }
      });
    } else {
      console.warn(`A modal at level 1 is already open.`);
    }
  }

  onAddStock(): void {
    const ref = this.modalService.open(
      AddIngredientStockModalComponent,
      {
        data: {},
      },
      1
    );
    if (ref) {
      console.warn(`A modal at level 1 is already open.`);
      ref.afterClosed().subscribe((result) => {
        if (result === 'success') {
          this.modalService.open(
            ConfirmationModalComponent,
            {
              data: {
                confirmationMessage: `Added Ingredient Stock`,
              },
            },
            1,
            true
          );
        }
      });
    } else {
    }
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
    const ref = this.modalService.open(
      IngredientDetailsModalComponent,
      {
        data: {
          ingredient: ingredient,
          openEdit,
        },
        width: '75%',
      },
      1
    );
    if (ref) {
      ref.afterClosed().subscribe((result) => {
        if (openEdit && result === 'success') {
          this.reviewedCount++;
        }
        // close any other open modals
        this.modalActiveForIngredientID = null;

        if (
          this.displayNeedsReview().length < 2 &&
          this.displayNoReview().length
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
    } else {
      console.warn(`A modal at level 1 is already open.`);
    }
  }

  ingredientCardTouchStart(ingredientID: number) {
    this.modalActiveForIngredientID = ingredientID;
  }
  ingredientCardTouchEnd() {
    this.modalActiveForIngredientID = null;
  }
}
