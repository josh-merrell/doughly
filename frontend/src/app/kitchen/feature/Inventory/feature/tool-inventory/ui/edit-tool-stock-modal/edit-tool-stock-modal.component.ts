import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable, Subscription, combineLatest, of, switchMap } from 'rxjs';
import { ToolStock } from '../../../tool-inventory/state/tool-stock-state';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatMomentDateModule } from '@angular/material-moment-adapter';
import { MatInputModule } from '@angular/material/input';
import { Tool } from 'src/app/kitchen/feature/tools/state/tool-state';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Store, select } from '@ngrx/store';
import { selectError, selectToolStockByID, selectUpdating } from '../../state/tool-stock-selectors';
import { positiveIntegerValidator } from 'src/app/shared/utils/formValidator';
import { selectToolByID } from 'src/app/kitchen/feature/tools/state/tool-selectors';
import { ToolStockActions } from '../../state/tool-stock-actions';

@Component({
  selector: 'dl-edit-tool-stock-modal',
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
  templateUrl: './edit-tool-stock-modal.component.html',
})
export class EditToolStockModalComponent {
  toolStock$!: Observable<ToolStock>;
  form!: FormGroup;
  submittingChanges: boolean = false;
  tool$!: Observable<Tool>;
  originalToolStock!: any;

  isUpdating$!: Observable<boolean>;

  private updatingSubscription!: Subscription;

  constructor(
    public dialogRef: MatDialogRef<EditToolStockModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private store: Store,
    private fb: FormBuilder
  ) {
    this.isUpdating$ = this.store.pipe(select(selectUpdating));
  }

  setForm() {
    this.form = this.fb.group({
      purchasedDate: ['', Validators.required],
      measurement: ['', [Validators.required, positiveIntegerValidator()]],
    });
  }

  ngOnInit(): void {
    this.setForm();
    this.toolStock$ = this.store.pipe(
      select(selectToolStockByID(this.data.itemID))
    );

    this.toolStock$.subscribe((toolStock) => {
      this.originalToolStock = toolStock;
      this.form.patchValue({
        quantity: toolStock.quantity,
      });
    });

    this.toolStock$
      .pipe(
        switchMap((toolStock) => {
          this.tool$ = this.store.pipe(
            select(selectToolByID(toolStock.toolID))
          );
          return combineLatest([of(toolStock), this.tool$]);
        })
      )
      .subscribe(([toolStock, tool]) => {
        this.form.patchValue({
          quantity: toolStock.quantity,
        });
      });
  }

  onSubmit(): void {
    const updatedToolStock: any = {
      toolStockID: this.data.itemID,
    };

    const formValues = this.form.value;

    for (let key in formValues) {
      if (key === 'quantity') {
        updatedToolStock['quantity'] = parseInt(formValues[key]);
      } else if (
        key in this.originalToolStock &&
        formValues[key] !== this.originalToolStock[key]
      ) {
        updatedToolStock[key] = formValues[key];
      }
    }

    this.store.dispatch(
      ToolStockActions.updateToolStock({
        toolStock: updatedToolStock,
      })
    );

    this.updatingSubscription = this.store
      .select(selectUpdating)
      .subscribe((updating: boolean) => {
        if (!updating) {
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

  ngOnDestroy(): void {
    if (this.updatingSubscription) {
      this.updatingSubscription.unsubscribe();
    }
  }
}
