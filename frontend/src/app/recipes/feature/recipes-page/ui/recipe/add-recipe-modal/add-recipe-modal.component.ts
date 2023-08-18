import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Observable, Subscription } from 'rxjs';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Store } from '@ngrx/store';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { nonDuplicateString, positiveIntegerValidator } from 'src/app/shared/utils/formValidator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';

import { selectAdding, selectError, selectLoading, selectRecipes } from 'src/app/recipes/state/recipe/recipe-selectors';
import { RecipeActions } from 'src/app/recipes/state/recipe/recipe-actions';
import { Recipe } from 'src/app/recipes/state/recipe/recipe-state';
import { selectRecipeCategories } from 'src/app/recipes/state/recipe-category/recipe-category-selectors';
import { AddRecipeCategoryModalComponent } from '../../recipe-category/add-recipe-category-modal/add-recipe-category-modal.component';
import { AddRequestConfirmationModalComponent } from 'src/app/shared/ui/add-request-confirmation/add-request-confirmation-modal.component';
import { AddRequestErrorModalComponent } from 'src/app/shared/ui/add-request-error/add-request-error-modal.component';


@Component({
  selector: 'dl-add-recipe-modal',
  standalone: true,
  imports: [
    CommonModule,
    MatProgressSpinnerModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
  ],
  templateUrl: './add-recipe-modal.component.html',
})
export class AddRecipeModalComponent {
  recipes!: Recipe[];
  categories$!: Observable<any[]>;
  form!: FormGroup;
  isAdding$: Observable<boolean>;
  isLoading$: Observable<boolean>;
  private addingSubscription!: Subscription;
  dialog: any;

  constructor(
    public dialogRef: MatDialogRef<AddRecipeModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private store: Store,
    private fb: FormBuilder
  ) {
    this.isAdding$ = this.store.select(selectAdding);
    this.isLoading$ = this.store.select(selectLoading);
    this.store.select(selectRecipes).subscribe((recipes) => {
      this.recipes = recipes;
      this.setForm();
    });
    this.categories$ = this.store.select(selectRecipeCategories);
  }

  setForm() {
    this.form = this.fb.group({
      title: [
        '',
        [
          Validators.required,
          nonDuplicateString(this.recipes.map((recipe) => recipe.title)),
        ],
      ],
      servings: ['', [Validators.required, positiveIntegerValidator()]],
      recipeCategoryID: ['', [Validators.required]],
      lifespanDays: ['', [Validators.required, positiveIntegerValidator()]],
    });
  }

  onAddNewCategory() {
    const dialogRef = this.dialog.open(AddRecipeCategoryModalComponent, {
      data: {},
    });

    dialogRef.afterClosed().subscribe((result: any) => {
      if (result === 'success') {
        this.dialog.open(AddRequestConfirmationModalComponent, {
          data: {
            result: result,
            addSuccessMessage: 'Category added successfully!',
          },
        });
      } else if (result) {
        this.dialog.open(AddRequestErrorModalComponent, {
          data: {
            result: result,
            addErrorMessage: 'Failed to add category.',
          },
        });
      }
    })
  }

  onSubmit() {
    const formValue = this.form.value;
    const newRecipe = {
      ...formValue,
      servings: parseInt(formValue.servings),
      lifespanDays: parseInt(formValue.lifespanDays),
    }
    this.store.dispatch(RecipeActions.addRecipe({ recipe: newRecipe }));

    this.addingSubscription = this.isAdding$.subscribe((isAdding) => {
      if (!isAdding) {
        this.store.select(selectError).subscribe((error) => {
          if (error) {
            this.dialogRef.close(error);
          } else {
            this.dialogRef.close('success');
          }
        });
      }
    });
  }

  onCancel() {
    this.dialogRef.close();
  }

  ngOnDestroy() {
    if (this.addingSubscription) {
      this.addingSubscription.unsubscribe();
    }
  }
}
