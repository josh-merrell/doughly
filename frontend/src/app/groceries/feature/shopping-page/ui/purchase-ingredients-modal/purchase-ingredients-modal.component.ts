import {
  Component,
  Inject,
  WritableSignal,
  computed,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'dl-purchase-ingredients-modal',
  standalone: true,
  imports: [
    CommonModule,
    MatInputModule,
    ReactiveFormsModule,
    MatFormFieldModule,
  ],
  templateUrl: './purchase-ingredients-modal.component.html',
})
export class PurchaseIngredientsModalComponent {
  form!: FormGroup;

  constructor(
    public dialogRef: MatDialogRef<PurchaseIngredientsModalComponent>,
    private fb: FormBuilder,
  ) {}

  setForm() {
    this.form = this.fb.group({
      store: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    this.setForm();
  }

  onCancel(): void {
    this.dialogRef.close({ status: 'cancel'});
  }

  onConfirm(): void {
    const formValues = this.form.value;
    this.dialogRef.close({ status: 'confirm', store: formValues.store });
  }
}
