import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ValidationErrors,
  ValidatorFn,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatMomentDateModule } from '@angular/material-moment-adapter';
import { MatInputModule } from '@angular/material/input';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Store, select } from '@ngrx/store';
import { Observable, Subscription, map } from 'rxjs';
import { positiveFloatValidator, positiveIntegerValidator } from 'src/app/shared/utils/formValidator';
import { Tool } from 'src/app/kitchen/feature/tools/state/tool-state';
import { selectAdding, selectError } from '../../state/tool-stock-selectors';
import { selectToolByID, selectTools } from 'src/app/kitchen/feature/tools/state/tool-selectors';
import { ToolStockActions } from '../../state/tool-stock-actions';

@Component({
  selector: 'dl-add-tool-stock-modal',
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
  templateUrl: './add-tool-stock-modal.component.html',
})
export class AddToolStockModalComponent {
  form!: FormGroup;

  tools$!: Observable<Tool[]>;
  tool$!: Observable<Tool>;
  employees$!: Observable<any>;

  isAdding$: Observable<boolean>;

  private toolIDSubscription!: Subscription;
  private addingSubscription!: Subscription;
  private purchasedDateSubscription!: Subscription;

  constructor(
    public dialogRef: MatDialogRef<AddToolStockModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private store: Store,
    private fb: FormBuilder
  ) {
    this.isAdding$ = this.store.select(selectAdding);
  }

  setForm() {
    this.form = this.fb.group({
      toolID: ['', Validators.required],
      quantity: ['', [Validators.required, positiveIntegerValidator()]],
    });
  }

  ngOnInit(): void {
    this.tools$ = this.store.select(selectTools);
    this.setForm();
    if (this.data.toolID) {
      this.form.get('toolID')!.setValue(this.data.toolID);
      this.form.get('quantity')!.enable();
      this.tool$ = this.store.pipe(select(selectToolByID(this.data.toolID)));
    }

    //handle changes made to 'toolID' field
    this.toolIDSubscription = this.form
      .get('toolID')!
      .valueChanges.subscribe((toolID) => {
        if (toolID) {
          this.form.get('quantity')!.enable();
          this.tool$ = this.store.pipe(
            select(selectToolByID(toolID))
          );
        } else {
          this.form.get('quantity')!.disable();
        }
      });
  }

  ngOnDestroy(): void {
    if (this.toolIDSubscription) {
      this.toolIDSubscription.unsubscribe();
    }
    if (this.purchasedDateSubscription) {
      this.purchasedDateSubscription.unsubscribe();
    }
    if (this.addingSubscription) {
      this.addingSubscription.unsubscribe();
    }
  }

  onSubmit(): void {
    const payload = {
      ...this.form.value,
      toolID: parseInt(this.form.value.toolID, 10),
      quantity: parseInt(this.form.value.quantity)
    };

    this.store.dispatch(
      ToolStockActions.addToolStock({ toolStock: payload })
    );

    this.addingSubscription = this.store
      .select(selectAdding)
      .subscribe((adding: boolean) => {
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

  onCancel(): void {
    this.dialogRef.close();
  }
}
