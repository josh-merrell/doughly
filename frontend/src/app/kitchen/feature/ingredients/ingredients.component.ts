import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableFullComponent } from 'src/app/shared/ui/dl-table-full/dl-table-full.component';
import {
  Filter,
  FilterOperatorEnum,
  FilterTypeEnum,
  Sort,
} from 'src/app/shared/state/shared-state';
import { BehaviorSubject, Observable, map } from 'rxjs';
import { IngredientService } from './data/ingredient.service';
import { AddIngredientModalComponent } from './ui/add-ingredient-modal/add-ingredient-modal.component';
import { EditIngredientModalComponent } from './ui/edit-ingredient-modal/edit-ingredient-modal.component';
import { DeleteIngredientModalComponent } from './ui/delete-ingredient-modal/delete-ingredient-modal.component';
import { Ingredient } from './state/ingredient-state';
import { MatDialog } from '@angular/material/dialog';
import { AddRequestConfirmationModalComponent } from 'src/app/shared/ui/add-request-confirmation/add-request-confirmation-modal.component';
import { HttpErrorResponse } from '@angular/common/http';
import { AddRequestErrorModalComponent } from 'src/app/shared/ui/add-request-error/add-request-error-modal.component';
import { AddIngredientStockModalComponent } from '../Inventory/feature/ingredient-inventory/ui/add-ingredient-stock-modal/add-ingredient-stock-modal.component';
import { SortingService } from 'src/app/shared/utils/sortingService';
import { FilterService } from 'src/app/shared/utils/filterService';
import { Store } from '@ngrx/store';
import { IngredientActions } from './state/ingredient-actions';
import { IngredientStockActions } from '../Inventory/feature/ingredient-inventory/state/ingredient-stock-actions';

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
    private store: Store,
    private dialog: MatDialog,
    private ingredientService: IngredientService,
    private sortingService: SortingService,
    private filterService: FilterService
  ) {}

  public ingredients$: Observable<Ingredient[]> = this.ingredientService.rows$;
  public enhancedIngredients$: Observable<Ingredient[]> =
    this.ingredientService.enhancedRows$;
  public rows: any[] = [];
  public rows$!: Observable<any[]>;
  public filters: Filter[] = [];
  public filteredRows$ = new BehaviorSubject<any[]>([]);
  sorts: Sort[] = [];
  public displayedRows$ = new BehaviorSubject<any[]>([]);

  ingredientsPerRow: number = 2;
  public totalInStock$!: Observable<Number>;
  public searchFilters: Filter[] = [];
  showIngredientUpArrow: boolean = false;
  showIngredientDownArrow: boolean = false;
  modalActiveForIngredientID: number | null = null;

  ngOnInit(): void {
    this.store.dispatch(IngredientActions.loadIngredients());
    this.store.dispatch(IngredientStockActions.loadIngredientStocks());

    this.ingredients$.subscribe((ingredients) => {
      this.ingredientService.addStockTotals(ingredients);
    });

    this.rows$ = this.enhancedIngredients$.pipe(
      map((enhancedIngredients: Ingredient[]) => {
        return enhancedIngredients.reduce(
          (rows: Ingredient[][], ingredient, index) => {
            const rowIndex = Math.floor(index / this.ingredientsPerRow);
            if (!rows[rowIndex]) {
              rows[rowIndex] = [];
            }
            rows[rowIndex].push(ingredient);
            return rows;
          },
          []
        );
      })
    );

    this.totalInStock$ = this.enhancedIngredients$.pipe(
      map((enhancedIngredients: Ingredient[]) => {
        return enhancedIngredients.filter(
          (ingredient) => ingredient.totalStock && ingredient.totalStock > 0
        ).length;
      })
    );

    this.rows$.subscribe((rows) => {
      const filteredRows = this.filterService.applyFilters(rows, this.filters);
      this.filteredRows$.next(filteredRows);
    });

    this.filteredRows$.subscribe((filteredRows) => {
      // Check if filteredRows is defined and not empty
      if (filteredRows && filteredRows.length > 0) {
        const sortedRows = this.sortingService.applySorts(
          filteredRows,
          this.sorts
        );
        if (
          sortedRows &&
          sortedRows.length > 0 &&
          sortedRows[sortedRows.length - 1]
        ) {
          // Check if the last row's length is 1
          if (sortedRows[sortedRows.length - 1].length === 1) {
            sortedRows[sortedRows.length - 1].push({ isEnd: true });
          } else {
            sortedRows.push([{ isEnd: true }]);
          }
        }

        this.displayedRows$.next(sortedRows);
      } else {
        // Handle the case where filteredRows is undefined or empty
        // For example, you might want to clear displayedRows or set it to a default value
        this.displayedRows$.next([]);
      }
    });
  }

  onAddIngredient(): void {
    const dialogRef = this.dialog.open(AddIngredientModalComponent, {
      data: {},
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result === 'success') {
        this.dialog.open(AddRequestConfirmationModalComponent, {
          data: {
            result: result,
            addSuccessMessage: `Added Ingredient: ${result.name}`,
          },
        });
      } else if (result instanceof HttpErrorResponse) {
        this.dialog.open(AddRequestErrorModalComponent, {
          data: {
            result: result,
            addFailureMessage: `Failed to add Ingredient. Error: ${result.message}`,
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
        this.dialog.open(AddRequestConfirmationModalComponent, {
          data: {
            result: result,
            addSuccessMessage: `Added Ingredient Stock: ${result.ingredientStockID}`,
          },
        });
      } else if (result instanceof HttpErrorResponse) {
        this.dialog.open(AddRequestErrorModalComponent, {
          data: {
            result: result,
            addFailureMessage: `Failed to add Ingredient. Error: ${result.message}`,
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
    this.searchFilters = [newFilter];
    // const filtered = this.applyFilter(this.rows$, this.searchFilter);
    const filteredRows = this.filterService.applyFilters(
      this.rows,
      this.searchFilters
    );
    this.filteredRows$.next(filteredRows);
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
    console.log(`CLICKED INGREDIENT: ${ingredient.name}`);
  }

  ingredientCardTouchStart(ingredientID: number) {
    this.modalActiveForIngredientID = ingredientID;
  }
  ingredientCardTouchEnd() {
    this.modalActiveForIngredientID = null;
  }
}
