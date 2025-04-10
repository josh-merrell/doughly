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
import { selectProfile } from 'src/app/profile/state/profile-selectors';
import { OnboardingMessageModalComponent } from 'src/app/onboarding/ui/message-modal/onboarding-message-modal.component';
import { StringsService } from 'src/app/shared/utils/strings';
import { ExtraStuffService } from 'src/app/shared/utils/extraStuffService';
import { NgAutoAnimateDirective } from 'ng-auto-animate';
import { UnitService } from 'src/app/shared/utils/unitService';

@Component({
  selector: 'dl-ingredients',
  standalone: true,
  imports: [
    CommonModule,
    AddIngredientModalComponent,
    EditIngredientModalComponent,
    NgAutoAnimateDirective
  ],
  templateUrl: './ingredients.component.html',
})
export class IngredientsComponent {
  Math = Math;
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

  private profile: WritableSignal<any> = signal(null);

  // Onboarding
  public showOnboardingBadge: WritableSignal<boolean> = signal(false);
  public onboardingModalOpen: WritableSignal<boolean> = signal(false);
  private reopenOnboardingModal: WritableSignal<boolean> = signal(true);

  constructor(
    private dialog: MatDialog,
    private sortingService: SortingService,
    private filterService: FilterService,
    private store: Store,
    private router: Router,
    private modalService: ModalService,
    private stringsService: StringsService,
    public extraStuffService: ExtraStuffService,
    public unitService: UnitService
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

    effect(
      () => {
        const profile = this.profile();
        if (!profile || profile.onboardingState === 0) return;
        if (!this.onboardingModalOpen() && this.reopenOnboardingModal()) {
          this.onboardingHandler(profile.onboardingState);
        }
      },
      { allowSignalWrites: true }
    );
  }

  ngOnInit(): void {
    this.store.select(selectProfile).subscribe((profile) => {
      this.profile.set(profile);
    });
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
      1,
      false,
      'AddIngredientModalComponent'
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
            true,
            'ConfirmationModalComponent'
          );
        }
      });
    } else {
    }
  }

  onAddStock(): void {
    const ref = this.modalService.open(
      AddIngredientStockModalComponent,
      {
        data: {},
      },
      1,
      false,
      'AddIngredientStockModalComponent'
    );
    if (ref) {
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
            true,
            'ConfirmationModalComponent'
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
      1,
      false,
      'IngredientsDetailsModalComponent'
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
    }
  }

  ingredientCardTouchStart(ingredientID: number) {
    this.modalActiveForIngredientID = ingredientID;
  }
  ingredientCardTouchEnd() {
    this.modalActiveForIngredientID = null;
  }

  onboardingHandler(onboardingState: number): void {
    if (onboardingState === 1) {
      this.showOnboardingBadge.set(false);
      this.onboardingModalOpen.set(true);
      this.reopenOnboardingModal.set(false);
      const ref = this.modalService.open(
        OnboardingMessageModalComponent,
        {
          data: {
            message: this.stringsService.onboardingStrings.kitchenPageOverview,
            currentStep: 1,
            showNextButton: true,
          },
          position: {
            top: '30%',
          },
        },
        1,
        false,
        'OnboardingMessageModalComponent'
      );
      if (ref) {
        ref.afterClosed().subscribe(() => {
          this.onboardingModalOpen.set(false);
          this.showOnboardingBadge.set(true);
        });
      }
    } else {
      this.router.navigate(['/tempRoute']);
    }
  }

  onboardingBadgeClick() {
    this.showOnboardingBadge.set(false);
    this.onboardingHandler(this.profile().onboardingState);
  }
}
