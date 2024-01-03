import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableFullComponent } from 'src/app/shared/ui/dl-table-full/dl-table-full.component';
import {
  Filter,
  FilterOperatorEnum,
  FilterTypeEnum,
  Sort,
} from 'src/app/shared/state/shared-state';
import { BehaviorSubject, Observable, combineLatest, map } from 'rxjs';
import { IngredientService } from './data/ingredient.service';
import { AddIngredientModalComponent } from './ui/add-ingredient-modal/add-ingredient-modal.component';
import { EditIngredientModalComponent } from './ui/edit-ingredient-modal/edit-ingredient-modal.component';
import { Ingredient } from './state/ingredient-state';
import { MatDialog } from '@angular/material/dialog';
import { AddIngredientStockModalComponent } from '../Inventory/feature/ingredient-inventory/ui/add-ingredient-stock-modal/add-ingredient-stock-modal.component';
import { SortingService } from 'src/app/shared/utils/sortingService';
import { FilterService } from 'src/app/shared/utils/filterService';
import { IngredientDetailsModalComponent } from './ui/ingredient-details-modal/ingredient-details-modal.component';
import { ConfirmationModalComponent } from 'src/app/shared/ui/confirmation-modal/confirmation-modal.component';

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
  constructor(
    private dialog: MatDialog,
    private ingredientService: IngredientService,
    private sortingService: SortingService,
    private filterService: FilterService
  ) {}

  public ingredients$: Observable<Ingredient[]> = this.ingredientService.rows$;
  public enhancedIngredients$: Observable<Ingredient[]> =
    this.ingredientService.enhancedRows$;
  public enhancedIngredients: any[] = [];
  public rows$!: Observable<any[]>;
  public filters$ = new BehaviorSubject<Filter[]>([]);
  public filters: Filter[] = [];
  public filteredIngredients$ = new BehaviorSubject<any[]>([]);
  sorts: Sort[] = [];
  public displayedRows$ = new BehaviorSubject<any[]>([]);

  ingredientsPerRow: number = 2;
  public totalInStock$!: Observable<Number>;
  public searchFilters: Filter[] = [];
  showIngredientUpArrow: boolean = false;
  showIngredientDownArrow: boolean = false;
  modalActiveForIngredientID: number | null = null;

  ngOnInit(): void {

    this.ingredients$.subscribe((ingredients) => {
      this.ingredientService.addStockTotals(ingredients);
    });

    this.totalInStock$ = this.enhancedIngredients$.pipe(
      map((enhancedIngredients: Ingredient[]) => {
        return enhancedIngredients.filter(
          (ingredient) => ingredient.totalStock && ingredient.totalStock > 0
        ).length;
      })
    );

    this.enhancedIngredients$.subscribe((enhancedIngredients) => {
      this.enhancedIngredients = enhancedIngredients;
    });

    combineLatest([this.filters$, this.enhancedIngredients$]).subscribe(
      ([filters, enhancedIngredients]) => {
        this.filters = filters;

        const filteredIngredients = this.filterService.applyFilters(
          enhancedIngredients,
          filters
        );

        this.filteredIngredients$.next(filteredIngredients);
      }
    );

    this.filteredIngredients$.subscribe((filteredIngredients) => {
      // Check if filteredRows is defined and not empty
      if (filteredIngredients && filteredIngredients.length > 0) {
        const sortedIngredients = this.sortingService.applySorts(
          filteredIngredients,
          [{ prop: 'name', sortOrderIndex: 0, direction: 'asc' }]
        );
        const sortedRows = this.arrangeInRows(sortedIngredients);

        this.displayedRows$.next(sortedRows);
      } else {
        this.displayedRows$.next([]);
      }
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
      if (result === 'success') {
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
    // const filtered = this.applyFilter(this.rows$, this.searchFilter);
    const filteredIngredients = this.filterService.applyFilters(
      this.enhancedIngredients,
      this.searchFilters
    );
    this.filteredIngredients$.next(filteredIngredients);
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
    this.dialog.open(IngredientDetailsModalComponent, {
      data: {
        ingredient: ingredient,
      },
      width: '75%',
    });
  }

  ingredientCardTouchStart(ingredientID: number) {
    this.modalActiveForIngredientID = ingredientID;
  }
  ingredientCardTouchEnd() {
    this.modalActiveForIngredientID = null;
  }
}
