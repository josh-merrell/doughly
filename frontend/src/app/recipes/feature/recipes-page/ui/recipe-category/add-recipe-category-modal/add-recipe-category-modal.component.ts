import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { Observable, Subscription } from 'rxjs';
import { RecipeCategory } from 'src/app/recipes/state/recipe-category/recipe-category-state';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  selectAdding,
  selectError,
  selectLoading,
  selectRecipeCategories,
} from 'src/app/recipes/state/recipe-category/recipe-category-selectors';
import { Store } from '@ngrx/store';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { nonDuplicateString } from 'src/app/shared/utils/formValidator';
import { RecipeCategoryActions } from 'src/app/recipes/state/recipe-category/recipe-category-actions';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'dl-add-recipe-category-modal',
  standalone: true,
  imports: [
    CommonModule,
    MatProgressSpinnerModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
  ],
  templateUrl: './add-recipe-category-modal.component.html',
})
export class AddRecipeCategoryModalComponent {
  recipeCategories: RecipeCategory[] = [];
  form!: FormGroup;
  isAdding$: Observable<boolean>;
  isLoading$: Observable<boolean>;
  private addingSubscription!: Subscription;
  private recipeCategoriesSubscription: Subscription = new Subscription();

  constructor(
    public dialogRef: MatDialogRef<AddRecipeCategoryModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private store: Store,
    private fb: FormBuilder
  ) {
    this.isAdding$ = this.store.select(selectAdding);
    this.isLoading$ = this.store.select(selectLoading);
    this.recipeCategories = this.data.recipeCategories;
    this.setForm();
  }

  setForm() {
    this.form = this.fb.group({
      name: [
        '',
        [
          Validators.required,
          nonDuplicateString(
            this.recipeCategories.map((recipeCategory) => recipeCategory.name)
          ),
        ],
      ],
    });
  }

  onSubmit() {
    const payload = this.form.value;

    this.store.dispatch(
      RecipeCategoryActions.addRecipeCategory({ recipeCategory: payload })
    );

    this.addingSubscription = this.store
      .select(selectAdding)
      .subscribe((adding) => {
        if (!adding) {
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

  ngOnDestroy(): void {
    if (this.addingSubscription) {
      this.addingSubscription.unsubscribe();
    }
  }
}
