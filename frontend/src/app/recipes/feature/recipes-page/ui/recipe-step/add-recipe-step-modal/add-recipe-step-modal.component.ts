import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { Observable, Subscription } from 'rxjs';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogRef,
} from '@angular/material/dialog';
import { Store } from '@ngrx/store';
import { AddRequestConfirmationModalComponent } from 'src/app/shared/ui/add-request-confirmation/add-request-confirmation-modal.component';
import { AddRequestErrorModalComponent } from 'src/app/shared/ui/add-request-error/add-request-error-modal.component';
import { selectAdding, selectLoading } from 'src/app/recipes/state/step/step-selectors';
import { selectAddingRecipeStep, selectLoadingRecipeStep } from 'src/app/recipes/state/recipe-step/recipe-step-selectors';

@Component({
  selector: 'dl-add-recipe-step-modal',
  standalone: true,
  imports: [
    CommonModule,
    MatProgressSpinnerModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
  ],
  templateUrl: './add-recipe-step-modal.component.html',
})
export class AddRecipeStepModalComponent {
  form!: FormGroup;
  isAddingStep$: Observable<boolean>;
  isAddingRecipeStep$: Observable<boolean>;
  isLoadingStep$: Observable<boolean>;
  isLoadingRecipeStep$: Observable<boolean>;
  private addingSubscription!: Subscription;

  constructor(
    public dialogRef: MatDialogRef<AddRecipeStepModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private fb: FormBuilder,
    private dialog: MatDialog,
    private store: Store,
  ) {
    this.isAddingStep$ = this.store.select(selectAdding);
    this.isAddingRecipeStep$ = this.store.select(selectAddingRecipeStep);
    this.isLoadingStep$ = this.store.select(selectLoading);
    this.isLoadingRecipeStep$ = this.store.select(selectLoadingRecipeStep);
    this.setForm();
  }

  setForm() {
    this.form = this.fb.group({
      title: ['', Validators.required],
      description: ['', Validators.required],
    })
  }

  onSubmit() {
    this.dialogRef.close(this.form.value);
  }

  onCancel() {
    this.dialogRef.close('cancel');
  }

  ngOnDestroy() {
    if (this.addingSubscription) {
      this.addingSubscription.unsubscribe();
    }
  }
}
