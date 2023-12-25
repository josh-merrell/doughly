import { Component, Type } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableFullComponent } from 'src/app/shared/ui/dl-table-full/dl-table-full.component';
import {
  Filter, FilterTypeEnum, FilterOperatorEnum, Sort,
} from 'src/app/shared/state/shared-state';
import { BehaviorSubject, Observable, combineLatest, map } from 'rxjs';
import { Tool } from './state/tool-state';

import { AddToolModalComponent } from './ui/add-tool-modal/add-tool-modal.component';
import { EditToolModalComponent } from './ui/edit-tool-modal/edit-tool-modal.component';
import { DeleteToolModalComponent } from './ui/delete-tool-modal/delete-tool-modal.component';
import { Store } from '@ngrx/store';
import { MatDialog } from '@angular/material/dialog';
import { ToolService } from '../tools/data/tool.service';
import { SortingService } from 'src/app/shared/utils/sortingService';
import { FilterService } from 'src/app/shared/utils/filterService';
import { ToolActions } from './state/tool-actions';
import { ToolStockActions } from '../Inventory/feature/tool-inventory/state/tool-stock-actions';
import { RecipeActions } from 'src/app/recipes/state/recipe/recipe-actions';
import { RecipeToolActions } from 'src/app/recipes/state/recipe-tool/recipe-tool-actions';
import { AddRequestConfirmationModalComponent } from 'src/app/shared/ui/add-request-confirmation/add-request-confirmation-modal.component';
import { AddRequestErrorModalComponent } from 'src/app/shared/ui/add-request-error/add-request-error-modal.component';
import { HttpErrorResponse } from '@angular/common/http';
import { AddToolStockModalComponent } from '../Inventory/feature/tool-inventory/ui/add-tool-stock-modal/add-tool-stock-modal.component';
import { ToolDetailsModalComponent } from './ui/tool-details-modal/tool-details-modal.component';

@Component({
  selector: 'dl-tools',
  standalone: true,
  imports: [CommonModule, TableFullComponent],
  templateUrl: './tools.component.html',
})
export class ToolsComponent {
  constructor(
    private store: Store,
    private dialog: MatDialog,
    private toolService: ToolService,
    private sortingService: SortingService,
    private filterService: FilterService
  ) {}

  public tools$: Observable<Tool[]> = this.toolService.rows$;
  public enhancedTools$: Observable<Tool[]> =
    this.toolService.enhancedRows$;
  public enhancedTools: any[] = [];
  public rows$!: Observable<any[]>;
  public filters$ = new BehaviorSubject<Filter[]>([]);
  public filters: Filter[] = [];
  public filteredTools$ = new BehaviorSubject<any[]>([]);
  sorts: Sort[] = [];
  public displayedRows$ = new BehaviorSubject<any[]>([]);

  toolsPerRow: number = 2;
  public totalInStock$!: Observable<Number>;
  public searchFilters: Filter[] = [];
  showToolUpArrow: boolean = false;
  showToolDownArrow: boolean = false;
  modalActiveForToolID: number | null = null;

  ngOnInit(): void {
    // this.store.dispatch(ToolActions.loadTools());
    // this.store.dispatch(ToolStockActions.loadToolStocks());
    // this.store.dispatch(RecipeActions.loadRecipes());
    // this.store.dispatch(RecipeToolActions.loadRecipeTools());

    this.tools$.subscribe((tools) => {
      this.toolService.addStockTotals(tools);
    });

    this.totalInStock$ = this.enhancedTools$.pipe(
      map((enhancedTools: Tool[]) => {
        return enhancedTools.filter(
          (tool) => tool.totalStock && tool.totalStock > 0
        ).length;
      })
    );

    this.enhancedTools$.subscribe((enhancedTools) => {
      this.enhancedTools = enhancedTools;
    });

    combineLatest([this.filters$, this.enhancedTools$]).subscribe(
      ([filters, enhancedTools]) => {
        this.filters = filters;

        const filteredTools = this.filterService.applyFilters(
          enhancedTools,
          filters
        );

        this.filteredTools$.next(filteredTools);
      }
    );

    this.filteredTools$.subscribe((filteredTools) => {
      // Check if filteredRows is defined and not empty
      if (filteredTools && filteredTools.length > 0) {
        const sortedTools = this.sortingService.applySorts(
          filteredTools,
          [{ prop: 'name', sortOrderIndex: 0, direction: 'asc' }]
        );
        const sortedRows = this.arrangeInRows(sortedTools);

        this.displayedRows$.next(sortedRows);
      } else {
        this.displayedRows$.next([]);
      }
    });
  }

  arrangeInRows(sortedTools: Tool[]) {
    const rows: Tool[][] = [];
    if (sortedTools.length > 0) {
      sortedTools.forEach((tool, index) => {
        const rowIndex = Math.floor(index / this.toolsPerRow);
        if (!rows[rowIndex]) {
          rows[rowIndex] = [];
        }
        rows[rowIndex].push(tool);
      });
    }

    return rows;
  }

  onAddTool(): void {
    const dialogRef = this.dialog.open(AddToolModalComponent, {
      data: {},
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result === 'success') {
        this.dialog.open(AddRequestConfirmationModalComponent, {
          data: {
            result: result,
            addSuccessMessage: `Added Tool: ${result.name}`,
          },
        });
      } else if (result instanceof HttpErrorResponse) {
        this.dialog.open(AddRequestErrorModalComponent, {
          data: {
            result: result,
            addFailureMessage: `Failed to add Tool. Error: ${result.message}`,
          },
        });
      }
    });
  }

  onAddStock(): void {
    const dialogRef = this.dialog.open(AddToolStockModalComponent, {
      data: {},
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result === 'success') {
        this.dialog.open(AddRequestConfirmationModalComponent, {
          data: {
            result: result,
            addSuccessMessage: `Added Tool Stock: ${result.toolStockID}`,
          },
        });
      } else if (result instanceof HttpErrorResponse) {
        this.dialog.open(AddRequestErrorModalComponent, {
          data: {
            result: result,
            addFailureMessage: `Failed to add Tool. Error: ${result.message}`,
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
    const filteredTools = this.filterService.applyFilters(
      this.enhancedTools,
      this.searchFilters
    );
    this.filteredTools$.next(filteredTools);
  }

  checkToolScroll(target: EventTarget | null) {
    if (target) {
      let element = target as HTMLElement;
      this.showToolUpArrow = element.scrollTop > 0;
      this.showToolDownArrow =
        element.scrollHeight - element.scrollTop - element.clientHeight > 1;
    }
  }

  toolCardClick(tool: any) {
    this.dialog.open(ToolDetailsModalComponent, {
      data: {
        tool: tool,
      },
      width: '75%',
    });
  }

  toolCardTouchStart(toolID: number) {
    this.modalActiveForToolID = toolID;
  }
  toolCardTouchEnd() {
    this.modalActiveForToolID = null;
  }
}
