import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatMomentDateModule } from '@angular/material-moment-adapter';
import { MatInputModule } from '@angular/material/input';
import { Observable, Subscription } from 'rxjs';
import { Tool } from '../../state/tool-state';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Store } from '@ngrx/store';
import { selectError, selectLoading, selectToolByID, selectTools, selectUpdating } from '../../state/tool-selectors';
import { ToolActions } from '../../state/tool-actions';

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
  isUpdating$: Observable<boolean>;
  isLoading$: Observable<boolean>;
  private updatingSubscription!: Subscription;
  private toolsSubscription: Subscription = new Subscription();

  constructor(
    public dialogRef: MatDialogRef<EditToolModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private store: Store<any>,
    private fb: FormBuilder
  ) {
    this.tools$ = this.store.select(selectTools);
    this.isUpdating$ = this.store.select(selectUpdating);
    this.isLoading$ = this.store.select(selectLoading);
  }

  ngOnInit(): void {
    this.setForm();
    this.tool$ = this.store.select(
      selectToolByID(this.data.itemID)
    );

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
      if (key in this.originalTool && formValues[key] !== this.originalTool[key]) {
        updatedTool[key] = formValues[key];
      }
    }

    this.store.dispatch(ToolActions.updateTool({ tool: updatedTool }));

    this.updatingSubscription = this.store
      .select(selectUpdating)
      .subscribe((updating) => {
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

  onCancel() {
    this.dialogRef.close();
  }

  onDestroy() {
    if(this.updatingSubscription) {
      this.updatingSubscription.unsubscribe();
    }
    if(this.toolsSubscription) {
      this.toolsSubscription.unsubscribe();
    }
  }

}
