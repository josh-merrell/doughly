import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatMomentDateModule } from '@angular/material-moment-adapter';
import { MatInputModule } from '@angular/material/input';
import { Observable, Subscription, filter, take } from 'rxjs';
import { Tool } from '../../state/tool-state';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogRef,
} from '@angular/material/dialog';
import { Store } from '@ngrx/store';
import {
  selectError,
  selectLoading,
  selectToolByID,
  selectTools,
  selectUpdating,
} from '../../state/tool-selectors';
import { ToolActions } from '../../state/tool-actions';
import { ErrorModalComponent } from 'src/app/shared/ui/error-modal/error-modal.component';
import { ModalService } from 'src/app/shared/utils/modalService';

@Component({
  selector: 'dl-edit-tool-modal',
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
  templateUrl: './edit-tool-modal.component.html',
})
export class EditToolModalComponent {
  tools$!: Observable<Tool[]>;
  tools: Tool[] = [];
  tool$!: Observable<Tool>;
  originalTool!: any;
  form!: FormGroup;
  isUpdating: boolean = false;
  isLoading$: Observable<boolean>;
  private updatingSubscription!: Subscription;
  private toolsSubscription: Subscription = new Subscription();

  constructor(
    public dialogRef: MatDialogRef<EditToolModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private store: Store<any>,
    private fb: FormBuilder,
    public dialog: MatDialog,
    private modalService: ModalService
  ) {
    this.tools$ = this.store.select(selectTools);
    this.isLoading$ = this.store.select(selectLoading);
  }

  ngOnInit(): void {
    this.setForm();
    this.tool$ = this.store.select(selectToolByID(this.data.itemID));

    this.tool$.subscribe((tool) => {
      this.originalTool = tool;
      this.form.patchValue({
        brand: tool.brand,
      });
    });

    this.toolsSubscription = this.tools$.subscribe((tools) => {
      this.tools = tools;
    });
  }

  setForm(): void {
    this.form = this.fb.group({
      brand: [''],
    });
  }

  onSubmit() {
    const updatedTool: any = {
      toolID: this.data.itemID,
      name: this.data.name,
    };
    const formValues = this.form.value;
    for (let key in formValues) {
      if (
        key in this.originalTool &&
        formValues[key] !== this.originalTool[key]
      ) {
        updatedTool[key] = formValues[key];
      }
    }

    this.isUpdating = true;
    this.store.dispatch(ToolActions.updateTool({ tool: updatedTool }));
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
                `Tool update failed: ${error.message}, CODE: ${error.statusCode}`
              );
              this.modalService.open(ErrorModalComponent, {
                maxWidth: '380px',
                data: {
                  errorMessage: error.message,
                  statusCode: error.statusCode,
                },
              }, 2, true);
            } else {
              this.dialogRef.close('success');
            }
            this.isUpdating = false;
          });
      });
  }

  onCancel() {
    this.dialogRef.close();
  }

  onDestroy() {
    if (this.updatingSubscription) {
      this.updatingSubscription.unsubscribe();
    }
    if (this.toolsSubscription) {
      this.toolsSubscription.unsubscribe();
    }
  }
}
