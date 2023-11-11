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

  //ingredient behaviorSubject
  public rows: any[] = [];
  public rows$!: Observable<any[]>;
  public filters: Filter[] = [];
  public filteredRows$ = new BehaviorSubject<any[]>([]);
  sorts: Sort[] = [];
  public displayedRows$ = new BehaviorSubject<any[]>([]);

  ingredientsPerRow: number = 2;
  public ingredients$: Observable<Ingredient[]> = this.ingredientService.rows$;
  public totalInStock$!: Observable<Number>;
  public searchFilters: Filter[] = [];
  showIngredientUpArrow: boolean = false;
  showIngredientDownArrow: boolean = false;
  modalActiveForIngredientID: number | null = null;

  ngOnInit(): void {
    this.totalInStock$ = this.ingredientService.getTotalInStock();

    //use ingredientsPerRow to build rows$ observable
    this.rows$ = this.ingredients$.pipe(
      map((ingredients: Ingredient[]) => {
        return ingredients.reduce((rows: Ingredient[][], ingredient, index) => {
          const rowIndex = Math.floor(index / this.ingredientsPerRow);
          if (!rows[rowIndex]) {
            rows[rowIndex] = [];
          }
          rows[rowIndex].push(ingredient);
          return rows;
        }, []);
      })
    );

    this.rows$.subscribe((rows) => {
      this.rows = rows;
      const filteredRows = this.filterService.applyFilters(rows, this.filters);
      this.filteredRows$.next(filteredRows);
    });

    this.filteredRows$.subscribe((filteredRows) => {
      const sortedRows = this.sortingService.applySorts(
        filteredRows,
        this.sorts
      );
      this.displayedRows$.next(sortedRows);
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
