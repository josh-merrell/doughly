import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Observable, Subscription } from 'rxjs';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatMomentDateModule } from '@angular/material-moment-adapter';
import { MatInputModule } from '@angular/material/input';
import { Tool } from '../../state/tool-state';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Store } from '@ngrx/store';
import { selectAdding, selectLoading, selectTools } from '../../state/tool-selectors';
import { nonDuplicateString } from 'src/app/shared/utils/formValidator';
import { ToolActions } from '../../state/tool-actions';

@Component({
  selector: 'dl-add-tool-modal',
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
  templateUrl: './add-tool-modal.component.html',
})
export class AddToolModalComponent {
  tools$!: Observable<Tool[]>;
  tools: Tool[] = [];
  form!: FormGroup;
  isAdding$: Observable<boolean>;
  isLoading$: Observable<boolean>;
  private addingSubscription!: Subscription;
  private toolsSubscription: Subscription = new Subscription();

  constructor(
    public dialogRef: MatDialogRef<AddToolModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private store: Store,
    private fb: FormBuilder
  ) {
    this.tools$ = this.store.select(selectTools);
    this.isAdding$ = this.store.select(selectAdding);
    this.isLoading$ = this.store.select(selectLoading);
  }

  ngOnInit(): void {
    this.toolsSubscription = this.tools$.subscribe(
      (tools) => {
        this.tools = tools;
        this.setForm();
      }
    );
  }

  setForm() {
    this.form = this.fb.group({
      name: ['', [nonDuplicateString(this.tools.map(tool => tool.name))]],
      brand: ['', []],
    });
  }

  onSubmit() {
    const payload = this.form.value;

    this.store.dispatch(
      ToolActions.addTool({ tool: payload })
    );

    this.addingSubscription = this.store
      .select(selectAdding)
      .subscribe((adding:boolean) => {
        if (!adding) {
          this.store.select(selectLoading).subscribe((error) => {
            if (error) {
              this.dialogRef.close(error);
            } else {
              this.dialogRef.close('success');
            }
          })
        }
      });
  }

  onCancel() {
    this.dialogRef.close();
  }

  ngOnDestroy() {
    if (this.addingSubscription) {
      this.addingSubscription.unsubscribe();
    }
    if (this.toolsSubscription) {
      this.toolsSubscription.unsubscribe();
    }
  }
}
