import { Component, Inject, WritableSignal, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable, Subscription, filter, take } from 'rxjs';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Store } from '@ngrx/store';
import {
  selectDeleting,
  selectError,
  selectRecipeByID,
} from 'src/app/recipes/state/recipe/recipe-selectors';
import { RecipeActions } from 'src/app/recipes/state/recipe/recipe-actions';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RecipeIngredientActions } from 'src/app/recipes/state/recipe-ingredient/recipe-ingredient-actions';
import { RecipeToolActions } from 'src/app/recipes/state/recipe-tool/recipe-tool-actions';
import { StepActions } from 'src/app/recipes/state/step/step-actions';
import { RecipeStepActions } from 'src/app/recipes/state/recipe-step/recipe-step-actions';
import { ErrorModalComponent } from 'src/app/shared/ui/error-modal/error-modal.component';
import { ModalService } from 'src/app/shared/utils/modalService';

@Component({
  selector: 'dl-unsubscribe-recipe-modal',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule],
  templateUrl: './unsubscribe-recipe-modal.component.html',
})
export class UnsubscribeRecipeModalComponent {
  public isDeleting: boolean = false;
  private deletingSubscription!: Subscription;
  public recipeTitle: WritableSignal<string> = signal('');
  public authorName: WritableSignal<string> = signal('');

  constructor(
    public dialogRef: MatDialogRef<UnsubscribeRecipeModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private store: Store,
    public dialog: MatDialog,
    private modalService: ModalService
  ) {}

  ngOnInit(): void {
    this.recipeTitle.set(this.data.title);
    this.authorName.set(this.data.authorName);
  }

  onSubmit(): void {
    this.isDeleting = true;
    this.store.dispatch(
      RecipeActions.deleteRecipeSubscription({
        subscriptionID: this.data.subscriptionID,
      })
    );
    this.store
      .select(selectDeleting)
      .pipe(
        filter((deleting) => !deleting),
        take(1)
      )
      .subscribe(() => {
        this.store
          .select(selectError)
          .pipe(take(1))
          .subscribe((error) => {
            if (error) {
              console.error(
                `Error deleting recipe subscription: ${error.message}, CODE: ${error.statusCode}`
              );
              this.modalService.open(ErrorModalComponent, {
                maxWidth: '380px',
                data: {
                  errorMessage: error.message,
                  statusCode: error.statusCode,
                },
              }, 2, true, 'ErrorModalComponent');
            } else {
              this.dialogRef.close('success');
            }
            this.isDeleting = false;
          });
      });
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  ngOnDestroy(): void {
    if (this.deletingSubscription) {
      this.deletingSubscription.unsubscribe();
    }
  }
}
