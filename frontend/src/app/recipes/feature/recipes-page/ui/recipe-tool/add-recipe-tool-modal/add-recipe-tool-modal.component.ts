import {
  ChangeDetectorRef,
  Component,
  Inject,
  WritableSignal,
  signal,
} from '@angular/core';
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
import {
  selectAdding,
  selectLoading,
} from 'src/app/recipes/state/recipe-tool/recipe-tool-selectors';
import { Observable, Subscription } from 'rxjs';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogRef,
} from '@angular/material/dialog';
import { Store } from '@ngrx/store';
import { selectTools } from 'src/app/kitchen/feature/tools/state/tool-selectors';
import { AddRequestConfirmationModalComponent } from 'src/app/shared/ui/add-request-confirmation/add-request-confirmation-modal.component';
import { AddRequestErrorModalComponent } from 'src/app/shared/ui/add-request-error/add-request-error-modal.component';
import { AddToolModalComponent } from 'src/app/kitchen/feature/tools/ui/add-tool-modal/add-tool-modal.component';
import { positiveIntegerValidator } from 'src/app/shared/utils/formValidator';
import { ModalService } from 'src/app/shared/utils/modalService';
import { TextInputComponent } from 'src/app/shared/ui/text-input/text-input.component';
import { SelectInputComponent } from 'src/app/shared/ui/select-input/select-input.component';

@Component({
  selector: 'dl-add-recipe-tool-modal',
  standalone: true,
  imports: [
    CommonModule,
    MatProgressSpinnerModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    AddToolModalComponent,
    TextInputComponent,
    SelectInputComponent,
  ],
  templateUrl: './add-recipe-tool-modal.component.html',
})
export class AddRecipeToolModalComponent {
  tools: WritableSignal<any[]> = signal([]);
  form!: FormGroup;
  isAdding$: Observable<boolean>;
  isLoading$: Observable<boolean>;
  private addingSubscription!: Subscription;

  constructor(
    public dialogRef: MatDialogRef<AddRecipeToolModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private store: Store,
    private fb: FormBuilder,
    public dialog: MatDialog,
    private modalService: ModalService,
    private cdr: ChangeDetectorRef
  ) {
    this.isAdding$ = this.store.select(selectAdding);
    this.isLoading$ = this.store.select(selectLoading);
    this.setForm();
  }

  ngOnInit(): void {
    this.store.select(selectTools).subscribe((tools) => {
      this.cdr.detectChanges();
      this.tools.set(tools);
    });
  }

  isToolExcluded(toolID: any): boolean {
    return this.data.toolsToExclude.includes(toolID);
  }

  setForm(): void {
    this.form = this.fb.group({
      toolID: ['', Validators.required],
      quantity: ['', [Validators.required, positiveIntegerValidator()]],
    });
  }

  onAddNewTool(): void {
    const dialogRef = this.modalService.open(
      AddToolModalComponent,
      {
        data: {},
      },
      3
    );
    if (dialogRef) {
      dialogRef.afterClosed().subscribe((result) => {
        if (typeof result === 'number') {
          this.modalService.open(
            AddRequestConfirmationModalComponent,
            {
              data: {
                result: result,
                addSuccessMessage: 'Tool added successfully!',
              },
            },
            3,
            true
          );
          this.cdr.detectChanges();
          this.form.get('toolID')?.setValue(result);
        } else if (result) {
          this.modalService.open(
            AddRequestErrorModalComponent,
            {
              data: {
                result: result,
                addErrorMessage: 'Failed to add tool.',
              },
            },
            3,
            true
          );
        }
      });
    } else {
    }
  }

  onSubmit() {
    const formValue = this.form.value;
    const newRecipeTool = {
      ...formValue,
      quantity: parseInt(formValue.quantity, 10),
    };
    this.dialogRef.close(newRecipeTool);
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
