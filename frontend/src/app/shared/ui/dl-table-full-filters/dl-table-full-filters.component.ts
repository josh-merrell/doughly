import { Component, Input, Output, EventEmitter, Renderer2, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  Filter,
  FilterTypeEnum,
  FilterOperatorEnum,
  FilterOption,
} from '../../state/shared-state';
import { StringFilterModalComponent } from '../filterModals/string-filter-modal/string-filter-modal.component';
import { NumericFilterModalComponent } from '../filterModals/numeric-filter-modal/numeric-filter-modal.component';
import { CurrencyFilterModalComponent } from '../filterModals/currency-filter-modal/currency-filter-modal.component';
import { DateFilterModalComponent } from '../filterModals/date-filter-modal/date-filter-modal.component';
import { BehaviorSubject, Subscription, fromEvent } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { HttpErrorResponse } from '@angular/common/http';
import { AddRequestErrorModalComponent } from '../add-request-error/add-request-error-modal.component';
import { AddRequestConfirmationModalComponent } from '../add-request-confirmation/add-request-confirmation-modal.component';

@Component({
  selector: 'dl-table-full-filters',
  standalone: true,
  imports: [
    CommonModule,
    StringFilterModalComponent,
    NumericFilterModalComponent,
    CurrencyFilterModalComponent,
    DateFilterModalComponent,
  ],
  templateUrl: './dl-table-full-filters.component.html',
})
export class TableFullFiltersComponent {
  @Input() searchPlaceholder!: string;
  @Input() searchSubject!: string;
  @Input()
  set columns(value: any[]) {
    this.columns$.next(value);
  }
  get columns(): any[] {
    return this.columns$.getValue();
  }
  public columns$ = new BehaviorSubject<any[]>([]);
  public filters$ = new BehaviorSubject<Filter[]>([]);
  private searchBarFilterID: number | null = null;

  @Output() filtersChange = new EventEmitter<Filter[]>();

  filtersExpanded = false;
  filterOptions: FilterOption[] = [];

  addFilterMenuOpen = false;
  @ViewChild('filterMenu') filterMenu!: ElementRef;
  @ViewChild('searchBar') searchBar!: ElementRef;
  globalClickListener: () => void = () => {};

  constructor(private renderer: Renderer2, public dialog: MatDialog) {}

  removeFilterAndClearSearchBar(filter: Filter) {
    if (filter.id === this.searchBarFilterID) {
      this.searchBarFilterID = null;
      this.clearSearchBar();
    }
    this.removeFilter(filter);
  }

  removeFilter(filter: Filter) {
    this.filters$.next(
      this.filters$.getValue().filter((f) => f.id !== filter.id)
    );
  }

  clearSearchBar() {
    this.searchBar.nativeElement.value = '';
  }

  removeAllFilters() {
    this.filters$.next([]);
    this.searchBarFilterID = null;
    this.clearSearchBar();
  }

  isDate(value: any): value is Date {
    return value instanceof Date;
  }

  toggleAddFilterMenu(event: any) {
    event.stopPropagation();
    this.addFilterMenuOpen = !this.addFilterMenuOpen;
  }
  closeFilterMenu() {
    this.addFilterMenuOpen = false;
  }

  openAddFilterModal(filterOption: FilterOption) {
    let filterModal: any;
    switch (filterOption.type) {
      case FilterTypeEnum.search:
        filterModal = StringFilterModalComponent;
        break;
      case FilterTypeEnum.numRange:
        filterModal = NumericFilterModalComponent;
        break;
      case FilterTypeEnum.currencyRange:
        filterModal = CurrencyFilterModalComponent;
        break;
      case FilterTypeEnum.dateRange:
        filterModal = DateFilterModalComponent;
        break;
    }
    this.openAddDialog(filterOption, filterModal);
  }

  openAddDialog(filterOption: FilterOption, component: any): void {
    const dialogRef = this.dialog.open(component, {
      data: {
        filterOption: filterOption,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.addFilterMenuOpen = false;
        this.addFilter(result);
      } else {
        this.addFilterMenuOpen = false;
      }
    });
  }

  addFilter(filter: Filter, isSearchBar: boolean = false) {
    const filtersLength = this.filters$.getValue().length;
    filter.id = filtersLength ? filtersLength : 0;
    if (isSearchBar) {
      this.searchBarFilterID = filter.id;
    }
    this.filters$.next([...this.filters$.getValue(), filter]);
  }

  addSearchBarFilter(event: any) {
    //first remove existing search bar filter
    if (this.searchBarFilterID !== null) {
      const existingSearchBarFilter = this.filters$
        .getValue()
        .find((f) => f.id === this.searchBarFilterID);
      if (existingSearchBarFilter && event.target.value !== '') {
        this.removeFilter(existingSearchBarFilter);
      } else if (existingSearchBarFilter) {
        this.removeFilterAndClearSearchBar(existingSearchBarFilter);
      }
    }
    //add new search bar filter if search term is provided
    if (event.target.value !== '') {
      this.addFilter(
        {
          subject: this.searchSubject,
          filterType: FilterTypeEnum.search,
          operator: FilterOperatorEnum.contains,
          operand1: event.target.value,
        },
        true
      );
    }
  }

  ngOnInit() {
    this.columns$.subscribe((columns) => {
      for (let column of columns) {
        if (column.filterType !== FilterTypeEnum.none) {
          this.filterOptions.push({
            name: column.name,
            prop: column.prop,
            type: column.filterType,
          });
        }
      }
    });
  }

  ngAfterViewInit() {
    this.globalClickListener = this.renderer.listen(
      'document',
      'click',
      (event) => {
        const clickedInside = this.filterMenu?.nativeElement.contains(
          event.target
        );
        if (!clickedInside && this.addFilterMenuOpen) {
          this.closeFilterMenu();
        }
      }
    );
  }

  ngOnChanges() {
    this.filters$.subscribe((filters) => {
      this.filtersChange.emit(filters);
    });
  }

  ngOnDestroy() {}
}
