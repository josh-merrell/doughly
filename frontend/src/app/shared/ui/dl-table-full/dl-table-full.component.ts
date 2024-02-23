import { Component, ElementRef, Input, Renderer2, SimpleChanges, Type, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { UpdateRequestErrorModalComponent } from '../update-request-error/update-request-error-modal.component';
import { UpdateRequestConfirmationModalComponent } from '../update-request-confirmation/update-request-confirmation-modal.component';
import { DeleteRequestErrorModalComponent } from '../delete-request-error/delete-request-error-modal.component';
import { DeleteRequestConfirmationModalComponent } from '../delete-request-confirmation/delete-request-confirmation-modal.component';
import { AddRequestErrorModalComponent } from '../add-request-error/add-request-error-modal.component';
import { AddRequestConfirmationModalComponent } from '../add-request-confirmation/add-request-confirmation-modal.component';
import { TableFullFiltersComponent } from '../dl-table-full-filters/dl-table-full-filters.component';
import { HttpErrorResponse } from '@angular/common/http';
import { Filter, Sort, SortEnum, SortRotateStateEnum, TableFullColumn } from '../../state/shared-state';
import { SortingService } from '../../utils/sortingService';
import { FilterService } from '../../utils/filterService';
import {
  trigger,
  state,
  style,
  animate,
  transition,
} from '@angular/animations';
import { BehaviorSubject } from 'rxjs';

@Component({
  selector: 'dl-table-full',
  standalone: true,
  imports: [
    CommonModule,
    UpdateRequestErrorModalComponent,
    UpdateRequestConfirmationModalComponent,
    TableFullFiltersComponent,
  ],
  templateUrl: './dl-table-full.component.html',
  animations: [
    trigger('rotateState', [
      state(
        'default',
        style({
          transform: 'rotate(0)',
        })
      ),
      state(
        'down',
        style({
          transform: 'rotate(90deg)',
        })
      ),
      state(
        'up',
        style({
          transform: 'rotate(270deg)',
        })
      ),
      transition('* => *', animate('0.3s ease')),
    ]),
  ],
})
export class TableFullComponent {
  @Input() title!: string;
  @Input() heading_phrase!: string;
  @Input() IDKey!: string;
  @Input() searchPlaceholder!: string;
  @Input() searchSubject!: string;
  @Input() addButtonTitle!: string;
  @Input() addModalComponent!: Type<any>;
  @Input() addSuccessMessage!: string;
  @Input() addFailureMessage!: string;
  @Input() editModalComponent!: Type<any>;
  @Input() editSuccessMessage!: string;
  @Input() editFailureMessage!: string;
  @Input() deleteModalComponent!: Type<any>;
  @Input() deleteSuccessMessage!: string;
  @Input() deleteFailureMessage!: string;
  @Input() columns!: any[];
  @Input()
  set rows(value: any[]) {
    this.rows$.next(value);
  }
  get rows(): any[] {
    return this.rows$.getValue();
  }

  constructor(
    private renderer: Renderer2,
    public dialog: MatDialog,
    private sortingService: SortingService,
    private filterService: FilterService
  ) {}

  public rows$ = new BehaviorSubject<any[]>([]);
  public filters: Filter[] = [];
  public filteredRows$ = new BehaviorSubject<any[]>([]);
  public displayedRows$ = new BehaviorSubject<any[]>([]);
  modalActiveForRowID: number | null = null;
  sorts: Sort[] = [];
  SortEnum = SortEnum;
  SortRotateStateEnum = SortRotateStateEnum;
  public clearAllSortsEnabled = false;
  rowItemMenuOpen = { index: -1, open: false };
  @ViewChild('rowItemMenu') rowItemMenu!: ElementRef;
  globalClickListener: () => void = () => {};

  toggleRowItemMenu(event: any, index: number) {
    event.stopPropagation();
    if (this.rowItemMenuOpen.index === index) {
      this.rowItemMenuOpen.open = !this.rowItemMenuOpen.open;
    } else {
      this.rowItemMenuOpen.index = index;
      this.rowItemMenuOpen.open = true;
    }
  }
  closeRowItemMenu() {
    this.rowItemMenuOpen = { index: -1, open: false };
  }

  onSortIconClick(rowIndex: number): void {
    //first update direction of sort
    this.updateSort(rowIndex);
    //then call appropriate method to add, update, or clear sorting
    switch (this.columns[rowIndex].sortRotateState) {
      case SortRotateStateEnum.up:
        this.addSort(rowIndex);
        break;
      case SortRotateStateEnum.down:
        this.updateSortedRows();
        break;
      case SortRotateStateEnum.default:
        this.clearSort(this.columns[rowIndex].sortOrderState);
        break;
    }
  }

  updateSort(colIndex: number) {
    switch (this.columns[colIndex].sortRotateState) {
      case SortRotateStateEnum.default:
        this.columns[colIndex].sortRotateState = SortRotateStateEnum.up;
        //find the corresponding sort and update its direction
        for (let i = 0; i < this.sorts.length; i++) {
          if (this.sorts[i].prop === this.columns[colIndex].prop) {
            this.sorts[i].direction = 'asc';
          }
        }
        break;
      case SortRotateStateEnum.down:
        this.columns[colIndex].sortRotateState = SortRotateStateEnum.default;
        break;
      case SortRotateStateEnum.up:
        this.columns[colIndex].sortRotateState = SortRotateStateEnum.down;
        for (let i = 0; i < this.sorts.length; i++) {
          if (this.sorts[i].prop === this.columns[colIndex].prop) {
            this.sorts[i].direction = 'desc';
          }
        }
        break;
    }
  }

  isDate(value: any): boolean {
    return value instanceof Date;
  }

  addSort(rowIndex: number): void {
    const newSort: Sort = {
      prop: this.columns[rowIndex].prop,
      sortOrderIndex: this.sorts.length,
      direction: 'asc',
    };
    this.sorts.push(newSort);
    this.columns[rowIndex].sortOrderState = newSort.sortOrderIndex;
    //Apply the sorts to rows, then emit the sorted rows
    const sortedRows = this.sortingService.applySorts(
      this.filteredRows$.getValue(),
      this.sorts
    );
    this.displayedRows$.next(sortedRows);
    this.clearAllSortsEnabled = this.sorts.length > 0;
  }

  updateSortedRows(): void {
    const sortedRows = this.sortingService.applySorts(
      this.filteredRows$.getValue(),
      this.sorts
    );
    this.displayedRows$.next(sortedRows);
  }

  clearSort(index: number): void {
    for (let i = index + 1; i < this.sorts.length; i++) {
      this.sorts[i].sortOrderIndex--;
    }
    this.sorts.splice(index, 1);
    this.columns.forEach((column) => {
      if (column.sortOrderState > index) {
        column.sortOrderState--;
      }
    });
    //Apply the sorts to rows, then emit the sorted rows
    const sortedRows = this.sortingService.applySorts(
      this.filteredRows$.getValue(),
      this.sorts
    );
    this.clearAllSortsEnabled = this.sorts.length > 0;
    this.displayedRows$.next(sortedRows);
  }

  clearAllSorts(): void {
    this.sorts = [];
    this.columns.forEach((column) => {
      if (column.sort) {
        column.sortOrderState = null;
        column.sortRotateState = SortRotateStateEnum.default;
      }
    });
    //Return sortedRows to default, matching rows
    this.displayedRows$.next(this.filteredRows$.getValue());
    this.clearAllSortsEnabled = false;
  }

  activateModalForRow(index: number) {
    this.modalActiveForRowID = index;
  }

  deactivateModalForRow() {
    this.modalActiveForRowID = null;
  }

  openEditDialog(itemID: number, rowIndex: number): void {
    this.activateModalForRow(rowIndex);
    const dialogRef = this.dialog.open(this.editModalComponent, {
      data: {
        itemID: itemID,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      this.deactivateModalForRow();
      if (result instanceof HttpErrorResponse) {
        this.dialog.open(UpdateRequestErrorModalComponent, {
          data: {
            error: result,
            updateFailureMessage: `${this.editFailureMessage}`,
          },
        });
      } else if (result === 'success') {
        this.dialog.open(UpdateRequestConfirmationModalComponent, {
          data: {
            result: result,
            updateSuccessMessage: `${this.editSuccessMessage}: ${itemID}`,
          },
        });
      }
    });
  }

  openDeleteDialog(itemID: number, rowIndex: number): void {
    this.activateModalForRow(rowIndex);
    const dialogRef = this.dialog.open(this.deleteModalComponent, {
      data: {
        itemID: itemID,
        itemName: this.displayedRows$.getValue()[rowIndex].name,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      this.deactivateModalForRow();
      if (result instanceof HttpErrorResponse) {
        this.dialog.open(DeleteRequestErrorModalComponent, {
          data: {
            error: result,
            deleteFailureMessage: `${this.deleteFailureMessage}`,
          },
        });
      } else if (result === 'success') {
        this.dialog.open(DeleteRequestConfirmationModalComponent, {
          data: {
            deleteSuccessMessage: `${this.deleteSuccessMessage}: ${itemID}`,
          },
        });
      }
    });
  }

  openAddDialog(): void {
    const dialogRef = this.dialog.open(this.addModalComponent, {
      data: {},
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result === 'success') {
        this.dialog.open(AddRequestConfirmationModalComponent, {
          data: {
            result: result,
            addSuccessMessage: `${this.addSuccessMessage}`,
          },
        });
      } else if (result instanceof HttpErrorResponse) {
        this.dialog.open(AddRequestErrorModalComponent, {
          data: {
            error: result,
            addFailureMessage: `${this.addFailureMessage}`,
          },
        });
      }
    });
  }

  onFiltersChange(filters: Filter[]): void {
    this.filters = filters;

    this.filteredRows$.next(
      this.filterService.applyFilters(this.rows$.getValue(), filters)
    );
  }

  ngOnInit(): void {
    this.rows$.subscribe((rows) => {
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

  ngAfterViewInit() {
    this.globalClickListener = this.renderer.listen(
      'document',
      'click',
      (event) => {
        const clickedInside = this.rowItemMenu?.nativeElement.contains(
          event.target
        );
        if (!clickedInside && this.rowItemMenu) {
          this.closeRowItemMenu();
        }
      }
    );
  }
}
