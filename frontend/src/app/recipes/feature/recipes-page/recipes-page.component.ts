import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  HostListener,
  Renderer2,
  ViewChild,
} from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { RecipesInfoComponent } from './ui/recipes-info/recipes-info.component';
import { RecipeCategoryService } from '../../data/recipe-category.service';
import { RecipeService } from '../../data/recipe.service';
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
} from '../../state/recipe-category/recipe-category-state';
import { RecipeCategoryActions } from '../../state/recipe-category/recipe-category-actions';
import { Store } from '@ngrx/store';
import { MatDialog } from '@angular/material/dialog';
import { AddRecipeCategoryModalComponent } from './ui/recipe-category/add-recipe-category-modal/add-recipe-category-modal.component';
import { EditRecipeCategoryModalComponent } from './ui/recipe-category/edit-recipe-category-modal/edit-recipe-category-modal.component';
import { DeleteRecipeCategoryModalComponent } from './ui/recipe-category/delete-recipe-category-modal/delete-recipe-category-modal.component';
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
import { Recipe } from '../../state/recipe/recipe-state';
import { RecipeIngredientActions } from '../../state/recipe-ingredient/recipe-ingredient-actions';
import { RecipeToolActions } from '../../state/recipe-tool/recipe-tool-actions';
import { RecipeIngredientsModalComponent } from './ui/recipe-ingredient/recipe-ingredients-modal/recipe-ingredients-modal.component';
import { RecipeIngredientError } from '../../state/recipe-ingredient/recipe-ingredient-state';
import { RecipeToolsModalComponent } from './ui/recipe-tool/recipe-tools-modal/recipe-tools-modal.component';
import { RecipeStepsModalComponent } from './ui/recipe-step/recipe-steps-modal/recipe-steps-modal.component';
import { AddRecipeModalComponent } from './ui/recipe/add-recipe-modal/add-recipe-modal.component';
import { StepActions } from '../../state/step/step-actions';
import { RecipeStepActions } from '../../state/recipe-step/recipe-step-actions';
import { ActivatedRoute, Router, RouterOutlet } from '@angular/router';
import { RecipeComponent } from '../recipe/recipe.component';

function isRecipeCategoryError(obj: any): obj is RecipeCategoryError {
  return obj && obj.errorType !== undefined && obj.message !== undefined;
}
function isRecipeIngredientError(obj: any): obj is RecipeIngredientError {
  return obj && obj.errorType !== undefined && obj.message !== undefined;
}
function isRecipeToolError(obj: any): obj is RecipeIngredientError {
  return obj && obj.errorType !== undefined && obj.message !== undefined;
}
function isRecipeStepError(obj: any): obj is RecipeIngredientError {
  return obj && obj.errorType !== undefined && obj.message !== undefined;
}
@Component({
  selector: 'dl-recipes-page',
  standalone: true,
  imports: [
    CommonModule,
    RecipesInfoComponent,
    RouterOutlet,
    FormsModule,
    RecipeComponent,
  ],
  templateUrl: './recipes-page.component.html',
  styleUrls: ['./recipes-page.component.scss'],
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
export class RecipesPageComponent {
  view: string = '';
  view$: Observable<string> = this.store.select(selectView);
  showCatUpArrow = false;
  showCatDownArrow = false;
  showRecipeUpArrow = false;
  showRecipeDownArrow = false;
  addButtonLabel = 'Add Recipe';
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
  public recipeRows: Recipe[] = [];
  recipeRows$: Observable<any[]> = this.recipeService.rows$;
  public filteredRecipeRows$ = new BehaviorSubject<any[]>([]);
  public displayedRecipeRows$ = new BehaviorSubject<any[]>([]);
  modalActiveForRowID: number | null = null;

  constructor(
    private renderer: Renderer2,
    private recipeCategoryService: RecipeCategoryService,
    private recipeService: RecipeService,
    private store: Store,
    public dialog: MatDialog,
    private sortingService: SortingService,
    private route: ActivatedRoute,
    private router: Router,
    private sanitizer: DomSanitizer,
    private cdRef: ChangeDetectorRef
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
        sort: SortEnum.numerical,
        sortRotateState: SortRotateStateEnum.default,
        sortOrderState: null,
        filterType: FilterTypeEnum.search,
      },
      {
        name: 'Recipe',
        prop: 'title',
        sort: SortEnum.alphabetical,
        sortRotateState: SortRotateStateEnum.default,
        sortOrderState: null,
        filterType: FilterTypeEnum.search,
      },
      {
        name: 'Category',
        prop: 'recipeCategoryName',
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

  @ViewChild('recipeContainer', { static: false })
  recipeContainer!: ElementRef;
  @HostListener('window:scroll', ['$event'])
  recipeOpen(): boolean {
    return this.route.firstChild?.snapshot?.params['recipeID'] !== undefined;
  }
  checkCatScroll(target: EventTarget | null) {
    if (target) {
      let element = target as HTMLElement;
      this.showCatUpArrow = element.scrollTop > 0;
      this.showCatDownArrow =
        element.scrollHeight - element.scrollTop - element.clientHeight > 1;
    }
  }

  checkRecipeScroll(target: EventTarget | null) {
    if (target) {
      let element = target as HTMLElement;
      this.showRecipeUpArrow = element.scrollTop > 0;
      this.showRecipeDownArrow =
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
    if (this.addButtonLabel === 'Add Recipe') {
      this.addButtonLabel = 'Add Category';
    } else {
      this.addButtonLabel = 'Add Recipe';
    }
  }

  updateSearchFilter(search: string) {
    this.searchFilter = search;
    // update filteredRecipeRows$, then reapply sorting
    const filtered = this.applyFilter(this.recipeRows, this.searchFilter);
    this.filteredRecipeRows$.next(filtered);
    this.updateSortedRows();
  }

  recipeCardClick(recipe: Recipe) {
    if (recipe.status === 'noIngredients') {
      //if the recipe status of 'noIngredients', show the 'RecipeIngredients' modal
      const dialogRef = this.dialog.open(RecipeIngredientsModalComponent, {
        data: {
          recipe,
        },
      });

      dialogRef.afterClosed().subscribe((result) => {
        if (result === 'success') {
          this.dialog.open(AddRequestConfirmationModalComponent, {
            data: {
              results: result,
              addSuccessMessage: 'Recipe Ingredients added successfully!',
            },
          });
        } else if (isRecipeIngredientError(result)) {
          this.dialog.open(AddRequestErrorModalComponent, {
            data: {
              error: result,
              addFailureMessage: 'Recipe Ingredients could not be added.',
            },
          });
        }
      });
    } else if (recipe.status === 'noTools') {
      //else if the recipe has status of 'noTools', show the 'addRecipeTools' modal
      const dialogRef = this.dialog.open(RecipeToolsModalComponent, {
        data: {
          recipe,
        },
      });

      dialogRef.afterClosed().subscribe((result) => {
        if (result === 'success') {
          this.dialog.open(AddRequestConfirmationModalComponent, {
            data: {
              results: result,
              addSuccessMessage: 'Recipe Tools added successfully!',
            },
          });
        } else if (isRecipeToolError(result)) {
          this.dialog.open(AddRequestErrorModalComponent, {
            data: {
              error: result,
              addFailureMessage: 'Recipe Tools could not be added.',
            },
          });
        }
      });
    } else if (recipe.status === 'noSteps') {
      //else if the recipe has status of 'noSteps', show the 'addRecipeSteps' modal
      const dialogRef = this.dialog.open(RecipeStepsModalComponent, {
        data: {
          recipe,
        },
      });

      dialogRef.afterClosed().subscribe((result) => {
        if (result === 'success') {
          this.dialog.open(AddRequestConfirmationModalComponent, {
            data: {
              results: result,
              addSuccessMessage: 'Recipe Steps added successfully!',
            },
          });
        } else if (isRecipeStepError(result)) {
          this.dialog.open(AddRequestErrorModalComponent, {
            data: {
              error: result,
              addFailureMessage: 'Recipe Steps could not be added.',
            },
          });
        }
      });
    } else {
      //else route to recipe details page
      this.router.navigate(['/recipes', recipe.recipeID]);
    }
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
    this.modalActiveForRowID = index;
  }

  categoryCardTouchEnd() {
    this.modalActiveForRowID = null;
  }

  recipeCardTouchStart(recipeID: number) {
    this.modalActiveForRowID = recipeID;
  }

  recipeCardTouchEnd() {
    this.modalActiveForRowID = null;
  }

  applyFilter(rows: any[], filterString: string) {
    // for each row, filter the row if the provided filterString is not found in the row values for 'recipeID', 'recipeName', or 'recipeCategoryName'
    const filtered = rows.filter((row) => {
      return (
        row.recipeID.toString().includes(filterString) ||
        row.title.toLowerCase().includes(filterString.toLowerCase()) ||
        row.recipeCategoryName
          .toLowerCase()
          .includes(filterString.toLowerCase())
      );
    });
    return filtered;
  }

  ngOnInit() {
    //hydrate data
    this.store.dispatch(RecipeIngredientActions.loadRecipeIngredients());
    this.store.dispatch(RecipeToolActions.loadRecipeTools());
    this.store.dispatch(StepActions.loadSteps());
    this.store.dispatch(RecipeStepActions.loadRecipeSteps());

    this.view$.subscribe((view) => {
      this.view = view;
    });

    this.store.dispatch(RecipeCategoryActions.loadRecipeCategories());

    this.recipeRows$.subscribe((rows) => {
      const rawRows = [...rows];
      rawRows.forEach((rawRow) => {
        if (rawRow.photoURL) {
          fetch(rawRow.photoURL)
            .then((response) => response.blob())
            .then((blob) => {
              const objectURL = URL.createObjectURL(blob);
              rawRow.photo = this.sanitizer.bypassSecurityTrustUrl(objectURL);
              this.cdRef.detectChanges();
            });
        }
      });
      this.recipeRows = rawRows;
      const filteredRows = this.applyFilter(rows, this.searchFilter);
      this.filteredRecipeRows$.next(filteredRows);
    });

    this.filteredRecipeRows$.subscribe((filteredRows) => {
      const sortedRows = this.sortingService.applySorts(
        filteredRows,
        this.sorts
      );
      this.displayedRecipeRows$.next(sortedRows);
    });
  }

  ngAfterViewInit() {
    const checkCatHeight = () => {
      if (this.categoryContainer) {
        const childHeight = Array.from(
          this.categoryContainer.nativeElement.children as HTMLElement[]
        ).reduce(
          (height, child: HTMLElement) => height + child.clientHeight,
          0
        );
        // Show the down arrow if the total height of the children is greater than the height of the container
        this.showCatDownArrow =
          childHeight > this.categoryContainer.nativeElement.clientHeight;
      }
    };

    const checkRecipeHeight = () => {
      if (this.recipeContainer) {
        const childHeight = Array.from(
          this.recipeContainer.nativeElement.children as HTMLElement[]
        ).reduce(
          (height, child: HTMLElement) => height + child.clientHeight,
          0
        );
        // Show the down arrow if the total height of the children is greater than the height of the container
        this.showRecipeDownArrow =
          childHeight > this.recipeContainer.nativeElement.clientHeight;
      }
    };

    // Subscribe to the view$ Observable
    this.viewSubscription = this.view$.subscribe((view) => {
      // Check if the current view is 'categories'
      if (view === 'categories') {
        checkCatHeight();
      } else if (view === 'list') {
        checkRecipeHeight();
      }
    });

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

    // Call the checkHeight method right away after the view has been initialized
    if (this.view === 'categories') checkCatHeight();
    if (this.view === 'list') checkRecipeHeight();
  }

  openAddDialog() {
    let dialogRef: any;
    if (this.view === 'categories') {
      dialogRef = this.dialog.open(AddRecipeCategoryModalComponent, {
        data: {
          recipeCategories: this.recipeCategories,
        },
      });
    } else if (this.view === 'list') {
      dialogRef = this.dialog.open(AddRecipeModalComponent, {
        data: {},
      });
    }

    dialogRef!.afterClosed().subscribe((result: any) => {
      const message = this.view === 'categories' ? 'Category' : 'Recipe';
      if (result === 'success') {
        this.dialog.open(AddRequestConfirmationModalComponent, {
          data: {
            results: result,
            addSuccessMessage: `${message} added successfully!`,
          },
        });
      } else if (isRecipeCategoryError(result)) {
        this.dialog.open(AddRequestErrorModalComponent, {
          data: {
            error: result,
            addFailureMessage: `${message} could not be added.`,
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
      this.filteredRecipeRows$.getValue(),
      this.sorts
    );
    this.displayedRecipeRows$.next(sortedRows);
    this.clearAllSortsEnabled = this.sorts.length > 0;
  }

  updateSortedRows(): void {
    const sortedRows = this.sortingService.applySorts(
      this.filteredRecipeRows$.getValue(),
      this.sorts
    );
    this.displayedRecipeRows$.next(sortedRows);
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
      this.filteredRecipeRows$.getValue(),
      this.sorts
    );
    this.clearAllSortsEnabled = this.sorts.length > 0;
    this.displayedRecipeRows$.next(sortedRows);
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
    this.displayedRecipeRows$.next(this.filteredRecipeRows$.getValue());
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
