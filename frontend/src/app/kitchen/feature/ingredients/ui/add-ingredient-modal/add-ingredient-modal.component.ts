import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatMomentDateModule } from '@angular/material-moment-adapter';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { Observable, Subscription } from 'rxjs';
import { selectAdding } from '../../state/ingredient-selectors';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Store } from '@ngrx/store';

@Component({
  selector: 'dl-add-ingredient-modal',
  standalone: true,
  imports: [
    CommonModule,
    MatProgressSpinnerModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatDatepickerModule,
    MatMomentDateModule,
    MatInputModule,
  ],
  templateUrl: './add-ingredient-modal.component.html',
})
export class AddIngredientModalComponent {
  form: FormGroup;
  isAdding$: Observable<boolean>;
  private subscription!: Subscription;

  constructor(
    public dialogRef: MatDialogRef<AddIngredientModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private store: Store,
    private fb: FormBuilder
  ) {
    this.isAdding$ = this.store.select(selectAdding);
    this.form = this.fb.group({
      name: ['', Validators.required],
      brand: ['', []],
      lifespanDays: ['', Validators.required],
      purchaseUnit: ['', Validators.required],
      gramRatio: ['', Validators.required],
    });
  }

  
}
