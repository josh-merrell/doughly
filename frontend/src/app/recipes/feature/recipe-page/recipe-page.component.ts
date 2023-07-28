import { Component, ElementRef, HostListener, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RecipesInfoComponent } from './ui/recipes-info/recipes-info.component';
import { RecipeCategoryService } from '../../data/recipe-category.service';
import { Observable, Subscription } from 'rxjs';
import {
  RecipeCategory,
  RecipeCategoryError,
} from '../../state/recipe-category-state';
import { RecipeCategoryActions } from '../../state/recipe-category-actions';
import { Store } from '@ngrx/store';
import { MatDialog } from '@angular/material/dialog';
import { AddRecipeCategoryModalComponent } from './ui/add-recipe-category-modal/add-recipe-category-modal.component';
import { AddRequestErrorModalComponent } from 'src/app/shared/ui/add-request-error/add-request-error-modal.component';
import { AddRequestConfirmationModalComponent } from 'src/app/shared/ui/add-request-confirmation/add-request-confirmation-modal.component';

function isRecipeCategoryError(obj: any): obj is RecipeCategoryError {
  return obj && obj.errorType !== undefined && obj.message !== undefined;
}
@Component({
  selector: 'dl-recipe-page',
  standalone: true,
  imports: [CommonModule, RecipesInfoComponent],
  templateUrl: './recipe-page.component.html',
  styleUrls: ['./recipe-page.component.scss'],
})
export class RecipePageComponent {
  showUpArrow = false;
  showDownArrow = false;
  addButtonLabel = 'Add Category';
  currentView = 'categories';
  recipeCategories$: Observable<RecipeCategory[]> =
    this.recipeCategoryService.rows$;
  recipeCategories: RecipeCategory[] = [];
  private recipeCategoriesSubscription?: Subscription;

  constructor(
    private recipeCategoryService: RecipeCategoryService,
    private store: Store,
    public dialog: MatDialog
  ) {
    this.recipeCategoriesSubscription = this.recipeCategories$.subscribe((categories) => {
      this.recipeCategories = categories;
    });
  }

  totalRecipes = 5; //TODO: get this from the store
  readyToMake = 3; //TODO: get this from the store

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

  updateView(view: string) {
    this.currentView = view;
  }

  ngOnInit() {
    this.store.dispatch(RecipeCategoryActions.loadRecipeCategories());
  }

  ngAfterViewInit() {
    // Get the total height of the child elements
    const childHeight = Array.from(
      this.categoryContainer.nativeElement.children as HTMLElement[]
    ).reduce((height, child: HTMLElement) => height + child.clientHeight, 0);

    // Show the down arrow if the total height of the children is greater than the height of the container
    this.showDownArrow =
      childHeight > this.categoryContainer.nativeElement.clientHeight;
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

  ngOnDestroy() {
    if (this.recipeCategoriesSubscription) {
      this.recipeCategoriesSubscription.unsubscribe();
    }
  }
}
