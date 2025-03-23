import { Component, Inject, WritableSignal, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatMomentDateModule } from '@angular/material-moment-adapter';
import { MatInputModule } from '@angular/material/input';
import { TextInputComponent } from 'src/app/shared/ui/text-input/text-input.component';

import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogRef,
} from '@angular/material/dialog';
import { Store, select } from '@ngrx/store';
import { Observable, Subscription, filter, take } from 'rxjs';
import { positiveIntegerValidator } from 'src/app/shared/utils/formValidator';
import { Tool } from 'src/app/kitchen/feature/tools/state/tool-state';
import { selectAdding, selectError } from '../../state/tool-stock-selectors';
import {
  selectToolByID,
  selectTools,
} from 'src/app/kitchen/feature/tools/state/tool-selectors';
import { ToolStockActions } from '../../state/tool-stock-actions';
import { ErrorModalComponent } from 'src/app/shared/ui/error-modal/error-modal.component';
import { ModalService } from 'src/app/shared/utils/modalService';

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
    TextInputComponent,
  ],
  templateUrl: './add-tool-stock-modal.component.html',
})
export class AddToolStockModalComponent {
  form!: FormGroup;
  employees$!: Observable<any>;

  isAdding: boolean = false;

  private toolIDSubscription!: Subscription;
  private addingSubscription!: Subscription;
  private purchasedDateSubscription!: Subscription;
  public tool: WritableSignal<any> = signal(null);

  constructor(
    public dialogRef: MatDialogRef<AddToolStockModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private store: Store,
    private fb: FormBuilder,
    public dialog: MatDialog,
    private modalService: ModalService
  ) {}

  setForm() {
    this.form = this.fb.group({
      quantity: ['', [Validators.required, positiveIntegerValidator()]],
    });
  }

  ngOnInit(): void {
    this.store.select(selectTools).subscribe((tools) => {
      this.tool.set(tools.find((tool) => tool.toolID === this.data.toolID));
      if (this.tool()) {
        this.setForm();
        this.form.get('quantity')!.enable();
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
      toolID: this.tool().toolID,
      quantity: parseInt(this.form.value.quantity),
    };

    this.isAdding = true;
    this.store.dispatch(ToolStockActions.addToolStock({ toolStock: payload }));
    this.store
      .select(selectAdding)
      .pipe(
        filter((adding) => !adding),
        take(1)
      )
      .subscribe(() => {
        this.store
          .select(selectError)
          .pipe(take(1))
          .subscribe((error) => {
            if (error) {
              console.error(
                `Tool stock add failed: ${error.message}, CODE: ${error.statusCode}`
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
                true,
                'ErrorModalComponent'
              );
            } else {
              this.dialogRef.close('success');
            }
            this.isAdding = false;
          });
      });
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
