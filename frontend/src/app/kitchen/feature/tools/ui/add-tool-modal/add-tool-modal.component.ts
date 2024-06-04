import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Observable, Subscription, filter, take } from 'rxjs';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatMomentDateModule } from '@angular/material-moment-adapter';
import { MatInputModule } from '@angular/material/input';
import { Tool } from '../../state/tool-state';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Store } from '@ngrx/store';
import { selectAdding, selectError, selectLoading, selectTools } from '../../state/tool-selectors';
import { TextInputComponent } from 'src/app/shared/ui/text-input/text-input.component';
import { nonDuplicateString } from 'src/app/shared/utils/formValidator';
import { ToolActions } from '../../state/tool-actions';
import { ErrorModalComponent } from 'src/app/shared/ui/error-modal/error-modal.component';
import { ModalService } from 'src/app/shared/utils/modalService';

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
    TextInputComponent
  ],
  templateUrl: './add-tool-modal.component.html',
})
export class AddToolModalComponent {
  isAdding: boolean = false;
  tools$!: Observable<Tool[]>;
  tools: Tool[] = [];
  form!: FormGroup;
  isLoading$: Observable<boolean>;
  private addingSubscription!: Subscription;
  private toolsSubscription: Subscription = new Subscription();

  constructor(
    public dialogRef: MatDialogRef<AddToolModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private store: Store,
    private fb: FormBuilder,
    public dialog: MatDialog,
    private modalService: ModalService
  ) {
    this.tools$ = this.store.select(selectTools);
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
    this.isAdding = true;
    const payload = this.form.value;

    this.store.dispatch(
      ToolActions.addTool({ tool: payload })
    );
    this.store
      .select(selectAdding)
      .pipe(filter((adding) => !adding), take(1)).subscribe(() => {
        this.store.select(selectError).pipe(take(1)).subscribe((error) => {
          if (error) {
            console.error(
              `Error adding tool: ${error.message}, CODE: ${error.statusCode}`
            );
            this.modalService.open(ErrorModalComponent, {
              maxWidth: '380px',
              data: {
                errorMessage: error.message,
                statusCode: error.statusCode,
              },
            }, 1, true);
          } else {
            this.dialogRef.close('success');
          }
          this.isAdding = false;
        });
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
