import { NgModule, Inject, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogRef,
} from '@angular/material/dialog';
import { RecipeService } from 'src/app/recipes/data/recipe.service';
import { Store } from '@ngrx/store';
import { IngredientStockActions } from 'src/app/kitchen/feature/Inventory/feature/ingredient-inventory/state/ingredient-stock-actions';
import { selectError, selectLoading } from 'src/app/kitchen/feature/Inventory/feature/ingredient-inventory/state/ingredient-stock-selectors';
import { RecipeActions } from 'src/app/recipes/state/recipe/recipe-actions';
import { concatMap, filter, switchMap, take, tap } from 'rxjs';



@Component({
  selector: 'dl-use-recipe-modal',
  standalone: true,
  imports: [
    CommonModule,
    MatSelectModule,
    FormsModule,
    MatProgressSpinnerModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSlideToggleModule,
  ],
  templateUrl: './use-recipe-modal.component.html',
})
export class UseRecipeModalComponent {
  form!: FormGroup;
  public confirmed: boolean = false;
  public isSubmitting: boolean = false;

  constructor(
    private fb: FormBuilder,
    private store: Store,
    private recipeService: RecipeService,
    private dialogRef: MatDialogRef<UseRecipeModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    public dialog: MatDialog
  ) {
    this.setForm();
  }

  ngOnInit(): void {}

  setForm() {
    this.form = this.fb.group({
      satisfaction: [null, [Validators.required]],
      difficulty: [null, [Validators.required]],
      note: [null, []],
    });
  }

  onSubmit() {
    this.isSubmitting = true;
    const satisfaction = this.form.get('satisfaction')?.value;
    const difficulty = this.form.get('difficulty')?.value;
    const note = this.form.get('note')?.value;

    this.recipeService
      .useRecipe(this.data.recipeID, satisfaction, difficulty, note)
      .pipe(
        tap(() => {
          // Update uses
          this.recipeService.loadUses(
            this.data.recipeID,
            this.data.logsAfterDate
          );
        }),
        tap(() => {
          // Dispatch action to update ingredient stocks
          this.store.dispatch(IngredientStockActions.loadIngredientStocks());
        }),
        switchMap(() =>
          // Wait for ingredient stocks loading to finish
          this.store.select(selectLoading).pipe(
            filter((loading) => !loading),
            take(1)
          )
        ),
        tap(() => {
          // After stocks are updated, dispatch action to reload recipe state
          this.store.dispatch(RecipeActions.loadRecipe({ recipeID: this.data.recipeID }));
        }),
        take(1)
      )
      .subscribe(
        () => {
          this.isSubmitting = false;
          this.dialogRef.close('success');
        },
        (err) => {
          this.isSubmitting = false;
          this.dialogRef.close(false);
        }
      );
  }

  onCancel() {
    this.dialogRef.close('cancel');
  }
}