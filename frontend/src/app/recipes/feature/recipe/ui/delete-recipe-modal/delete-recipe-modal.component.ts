import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable, Subscription, filter, take } from 'rxjs';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogRef,
} from '@angular/material/dialog';
import { Store } from '@ngrx/store';
import {
  selectDeleting,
  selectError,
  selectRecipeByID,
} from 'src/app/recipes/state/recipe/recipe-selectors';
import { RecipeActions } from 'src/app/recipes/state/recipe/recipe-actions';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ErrorModalComponent } from 'src/app/shared/ui/error-modal/error-modal.component';
import { ModalService } from 'src/app/shared/utils/modalService';

@Component({
  selector: 'dl-delete-recipe-modal',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule],
  templateUrl: './delete-recipe-modal.component.html',
})
export class DeleteRecipeModalComponent {
  isDeleting$!: Observable<boolean>;
  isDeleting: boolean = false;
  private deletingSubscription!: Subscription;
  public recipe$!: Observable<any>;

  constructor(
    public dialogRef: MatDialogRef<DeleteRecipeModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private store: Store,
    public dialog: MatDialog,
    private modalService: ModalService
  ) {}

  ngOnInit(): void {
    this.store.select(selectDeleting).subscribe((deleting) => {
      this.isDeleting = deleting;
    });
    this.recipe$ = this.store.select(selectRecipeByID(this.data.recipeID));
  }

  onSubmit(): void {
    this.isDeleting = true;
    this.store.dispatch(
      RecipeActions.deleteRecipe({
        recipeID: this.data.recipeID,
      })
    );

    // Initiate the subscription after dispatching the action
    this.deletingSubscription = this.store
      .select(selectDeleting)
      .pipe(filter((deleting) => !deleting))
      .subscribe(() => {
        this.store
          .select(selectError)
          .pipe(take(1))
          .subscribe((error) => {
            if (error) {
              console.error(
                `Recipe deletion failed: ${error.message}, CODE: ${error.statusCode}`
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
