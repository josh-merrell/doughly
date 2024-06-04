import {
  Component,
  Inject,
  WritableSignal,
  effect,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  Subscription,
  filter,
  take,
} from 'rxjs';
import { TextInputComponent } from 'src/app/shared/ui/text-input/text-input.component';

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
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Store } from '@ngrx/store';
import {
  selectError,
  selectToolStockByID,
  selectUpdating,
} from '../../state/tool-stock-selectors';
import { positiveIntegerValidator } from 'src/app/shared/utils/formValidator';
import { selectToolByID } from 'src/app/kitchen/feature/tools/state/tool-selectors';
import { ToolStockActions } from '../../state/tool-stock-actions';
import { ErrorModalComponent } from 'src/app/shared/ui/error-modal/error-modal.component';
import { ModalService } from 'src/app/shared/utils/modalService';

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
    TextInputComponent
  ],
  templateUrl: './edit-tool-stock-modal.component.html',
})
export class EditToolStockModalComponent {
  form!: FormGroup;
  submittingChanges: boolean = false;
  public tool: WritableSignal<Tool | null> = signal(null);
  public toolStock: WritableSignal<ToolStock | null> = signal(null);
  originalToolStock!: any;

  isUpdating: boolean = false;

  private updatingSubscription!: Subscription;

  constructor(
    public dialogRef: MatDialogRef<EditToolStockModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private store: Store,
    private fb: FormBuilder,
    public dialog: MatDialog,
    private modalService: ModalService
  ) {
    effect(
      () => {
        const toolStock = this.toolStock();
        this.store
          .select(selectToolByID(toolStock!.toolID))
          .subscribe((tool) => {
            this.tool.set(tool);
          });
      },
      { allowSignalWrites: true }
    );

    effect(() => {
      const toolStock = this.toolStock();
      this.originalToolStock = toolStock;
      this.form.patchValue({
        quantity: toolStock?.quantity,
      });
    })
  }

  setForm() {
    this.form = this.fb.group({
      quantity: ['', [Validators.required, positiveIntegerValidator()]],
    });
  }

  ngOnInit(): void {
    console.log(`DATA: `, this.data);
    this.store
      .select(selectToolStockByID(this.data.itemID))
      .subscribe((toolStock) => {
        this.toolStock.set(toolStock);
        console.log('tool: ', toolStock);
      });
    this.setForm();
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

    this.isUpdating = true;
    this.store.dispatch(
      ToolStockActions.updateToolStock({
        toolStock: updatedToolStock,
      })
    );
    this.store
      .select(selectUpdating)
      .pipe(
        filter((updating) => !updating),
        take(1)
      )
      .subscribe(() => {
        this.store
          .select(selectError)
          .pipe(take(1))
          .subscribe((error) => {
            if (error) {
              console.error(
                `Tool stock update failed: ${error.message}, CODE: ${error.statusCode}`
              );
              this.modalService.open(
                ErrorModalComponent,
                {
                  maxWidth: '380px',
                  data: {
                    errorMessage: error.message,
                    statusCode: error.statusCode,
                  },
                },
                2,
                true
              );
            } else {
              this.dialogRef.close('success');
            }
            this.isUpdating = false;
          });
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
