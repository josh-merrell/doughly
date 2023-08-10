import {
  Component,
  ElementRef,
  HostListener,
  Renderer2,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RecipesInfoComponent } from './ui/recipes-info/recipes-info.component';
import { RecipeCategoryService } from '../../data/recipe-category.service';
import { BehaviorSubject, Observable, Subscription } from 'rxjs';
import {
  trigger,
  state,
  style,
  animate,
  transition,
} from '@angular/animations';
import {
  RecipeCategory,
  RecipeCategoryError,
} from '../../state/recipe-category-state';
import { RecipeCategoryActions } from '../../state/recipe-category-actions';
import { Store } from '@ngrx/store';
import { MatDialog } from '@angular/material/dialog';
import { AddRecipeCategoryModalComponent } from './ui/add-recipe-category-modal/add-recipe-category-modal.component';
import { EditRecipeCategoryModalComponent } from './ui/edit-recipe-category-modal/edit-recipe-category-modal.component';
import { DeleteRecipeCategoryModalComponent } from './ui/delete-recipe-category-modal/delete-recipe-category-modal.component';
import { AddRequestErrorModalComponent } from 'src/app/shared/ui/add-request-error/add-request-error-modal.component';
import { AddRequestConfirmationModalComponent } from 'src/app/shared/ui/add-request-confirmation/add-request-confirmation-modal.component';
import { HttpErrorResponse } from '@angular/common/http';
import { UpdateRequestErrorModalComponent } from 'src/app/shared/ui/update-request-error/update-request-error-modal.component';
import { UpdateRequestConfirmationModalComponent } from 'src/app/shared/ui/update-request-confirmation/update-request-confirmation-modal.component';
import { DeleteRequestErrorModalComponent } from 'src/app/shared/ui/delete-request-error/delete-request-error-modal.component';
import { DeleteRequestConfirmationModalComponent } from 'src/app/shared/ui/delete-request-confirmation/delete-request-confirmation-modal.component';
import {
  FilterTypeEnum,
  Sort,
  SortEnum,
  SortRotateStateEnum,
  TableFullColumn,
} from 'src/app/shared/state/shared-state';
import { selectView } from '../../state/recipe-page-selectors';
import { RecipePageActions } from '../../state/recipe-page-actions';
import { FormsModule } from '@angular/forms';
import { SortingService } from 'src/app/shared/utils/sortingService';

function isRecipeCategoryError(obj: any): obj is RecipeCategoryError {
  return obj && obj.errorType !== undefined && obj.message !== undefined;
}
@Component({
  selector: 'dl-recipe-page',
  standalone: true,
  imports: [CommonModule, RecipesInfoComponent, FormsModule],
  templateUrl: './recipe-page.component.html',
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
export class RecipePageComponent {
  view$: Observable<string> = this.store.select(selectView);
  showUpArrow = false;
  showDownArrow = false;
  addButtonLabel = 'Add Category';
  recipeCategories$: Observable<RecipeCategory[]> =
    this.recipeCategoryService.rows$;
  recipeCategories: RecipeCategory[] = [];
  private recipeCategoriesSubscription?: Subscription;
  viewSubscription!: Subscription;
  searchBarSubscription!: Subscription;
  columns: TableFullColumn[] = [];
  searchFilter: string = '';
  sorts: Sort[] = [];
  SortEnum = SortEnum;
  SortRotateStateEnum = SortRotateStateEnum;
  public clearAllSortsEnabled = false;
  public rows$ = new BehaviorSubject<any[]>([]);
  public filteredRows$ = new BehaviorSubject<any[]>([]);
  public displayedRows$ = new BehaviorSubject<any[]>([]);
  modalActiveForRowID: number | null = null;

  constructor(
    private renderer: Renderer2,
    private recipeCategoryService: RecipeCategoryService,
    private store: Store,
    public dialog: MatDialog,
    private sortingService: SortingService
  ) {
    this.recipeCategoriesSubscription = this.recipeCategories$.subscribe(
      (categories) => {
        this.recipeCategories = categories;
      }
    );

    this.columns = [
      {
        name: 'ID',
        prop: 'recipeID',
        cssClass: 'w-1/5',
        sort: SortEnum.numerical,
        sortRotateState: SortRotateStateEnum.default,
        sortOrderState: null,
        filterType: FilterTypeEnum.search,
      },
      {
        name: 'Recipe',
        prop: 'recipeName',
        cssClass: 'w-2/5',
        sort: SortEnum.alphabetical,
        sortRotateState: SortRotateStateEnum.default,
        sortOrderState: null,
        filterType: FilterTypeEnum.search,
      },
      {
        name: 'Category',
        prop: 'recipeCategoryName',
        cssClass: 'w-2/5',
        sort: SortEnum.alphabetical,
        sortRotateState: SortRotateStateEnum.default,
        sortOrderState: null,
        filterType: FilterTypeEnum.search,
      },
    ];
  }

  totalRecipes = 5; //TODO: get this from the store
  readyToMake = 3; //TODO: get this from the store
  categoryMenuOpen = { index: -1, open: false };
  @ViewChild('categoryMenu') categoryMenu!: ElementRef;
  globalClickListener: () => void = () => {};
  @ViewChild('categoryContainer', { static: false })
  categoryContainer!: ElementRef;
  @HostListener('window:scroll', ['$event'])
  checkScroll(target: EventTarget | null) {
    if (target) {
      let element = target as HTMLElement;
      // Show or hide the up arrow
      this.showUpArrow = element.scrollTop > 0;

      // Show or hide the down arrow
      this.showDownArrow =
        element.scrollHeight - element.scrollTop - element.clientHeight > 1;
    }
  }

  toggleCategoryMenu(event: any, index: number) {
    event.stopPropagation();
    if (this.categoryMenuOpen.index === index) {
      this.categoryMenuOpen.open = !this.categoryMenuOpen.open;
    } else {
      this.categoryMenuOpen.index = index;
      this.categoryMenuOpen.open = true;
    }
  }
  closeCategoryMenu() {
    this.categoryMenuOpen.index = -1;
    this.categoryMenuOpen.open = false;
  }

  updateView(view: string) {
    this.store.dispatch(RecipePageActions.setView({ view }));
  }

  updateSearchFilter(search: string) {
    this.searchFilter = search;
  }

  categoryCardClick(category: string) {
    this.updateSearchFilter(category);
    this.updateView('list');
  }

  categoriesClick() {
    this.updateSearchFilter('');
    this.updateView('categories');
  }

  categoryCardTouchStart(index: number) {
    // Add the 'bg-dl-grey-9' class on touchstart
    this.modalActiveForRowID = index;
  }

  categoryCardTouchEnd(index: number) {
    // Remove the 'bg-dl-grey-9' class on touchend
    this.modalActiveForRowID = null;
  }

  ngOnInit() {
    this.store.dispatch(RecipeCategoryActions.loadRecipeCategories());
  }

  ngAfterViewInit() {
    // Subscribe to the view$ Observable
    this.viewSubscription = this.view$.subscribe((view) => {
      // Check if the current view is 'categories'
      if (view === 'categories' && this.categoryContainer) {
        const childHeight = Array.from(
          this.categoryContainer.nativeElement.children as HTMLElement[]
        ).reduce(
          (height, child: HTMLElement) => height + child.clientHeight,
          0
        );

        // Show the down arrow if the total height of the children is greater than the height of the container
        this.showDownArrow =
          childHeight > this.categoryContainer.nativeElement.clientHeight;

        this.globalClickListener = this.renderer.listen(
          'document',
          'click',
          (event) => {
            const clickedInside = this.categoryMenu?.nativeElement.contains(
              event.target
            );
            if (!clickedInside && this.categoryMenu) {
              this.closeCategoryMenu();
            }
          }
        );
      }
    });
  }

  openAddDialog() {
    const dialogRef = this.dialog.open(AddRecipeCategoryModalComponent, {
      data: {
        recipeCategories: this.recipeCategories,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result === 'success') {
        this.dialog.open(AddRequestConfirmationModalComponent, {
          data: {
            results: result,
            addSuccessMessage: 'Category added successfully!',
          },
        });
      } else if (isRecipeCategoryError(result)) {
        this.dialog.open(AddRequestErrorModalComponent, {
          data: {
            error: result,
            addFailureMessage: 'Category could not be added.',
          },
        });
      }
    });
  }

  activateModalForRow(index: number) {
    this.modalActiveForRowID = index;
  }

  deactivateModalForRow() {
    this.modalActiveForRowID = null;
  }

  openEditDialog(recipeCategoryID: number, rowIndex: number): void {
    this.activateModalForRow(rowIndex);
    const dialogRef = this.dialog.open(EditRecipeCategoryModalComponent, {
      data: {
        recipeCategoryID: recipeCategoryID,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      this.deactivateModalForRow();
      if (result instanceof HttpErrorResponse) {
        this.dialog.open(UpdateRequestErrorModalComponent, {
          data: {
            error: result,
            updateFailureMessage: `Category could not be updated. Try again later.`,
          },
        });
      } else if (result === 'success') {
        this.dialog.open(UpdateRequestConfirmationModalComponent, {
          data: {
            result: result,
            updateSuccessMessage: `Category with ID: ${recipeCategoryID} updated successfully!`,
          },
        });
      }
    });
  }

  openDeleteDialog(
    event: any,
    recipeCategoryID: number,
    rowIndex: number
  ): void {
    event.stopPropagation();
    this.activateModalForRow(rowIndex);
    const dialogRef = this.dialog.open(DeleteRecipeCategoryModalComponent, {
      data: {
        recipeCategoryID: recipeCategoryID,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      this.deactivateModalForRow();
      if (result instanceof HttpErrorResponse) {
        this.dialog.open(DeleteRequestErrorModalComponent, {
          data: {
            error: result,
            deleteFailureMessage: `Category could not be deleted. Try again later.`,
          },
        });
      } else if (result === 'success') {
        this.dialog.open(DeleteRequestConfirmationModalComponent, {
          data: {
            deleteSuccessMessage: `Category with ID: ${recipeCategoryID} deleted successfully!`,
          },
        });
      }
    });
  }

  getClass(column: any, i: number) {
    return {
      'rounded-tl-dl-3': i === 0,
      [column.cssClass]: column.cssClass,
    };
  }

  getRowClass(column: any, i: number) {
    return {
      'bg-dl-grey-9': this.modalActiveForRowID === i,
      [column.cssClass]: column.cssClass,
    };
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
        this.clearSort(Number(this.columns[rowIndex].sortOrderState));
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
      if (column.sortOrderState! > index) {
        column.sortOrderState!--;
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

  ngOnDestroy() {
    if (this.recipeCategoriesSubscription) {
      this.recipeCategoriesSubscription.unsubscribe();
    }
    if (this.viewSubscription) {
      this.viewSubscription.unsubscribe();
    }
    if (this.searchBarSubscription) {
      this.searchBarSubscription.unsubscribe();
    }
  }
}
