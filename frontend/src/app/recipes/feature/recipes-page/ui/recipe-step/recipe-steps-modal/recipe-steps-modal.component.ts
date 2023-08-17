import { Component, Inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  CdkDragDrop,
  moveItemInArray,
  DragDropModule,
} from '@angular/cdk/drag-drop';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import {
  BehaviorSubject,
  EMPTY,
  Observable,
  Subscription,
  catchError,
  combineLatest,
  concatMap,
  filter,
  finalize,
  forkJoin,
  from,
  map,
  switchMap,
  take,
  tap,
} from 'rxjs';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogRef,
} from '@angular/material/dialog';
import { Store } from '@ngrx/store';
import { DeleteRequestConfirmationModalComponent } from 'src/app/shared/ui/delete-request-confirmation/delete-request-confirmation-modal.component';
import { DeleteRequestErrorModalComponent } from 'src/app/shared/ui/delete-request-error/delete-request-error-modal.component';
import {
  selectAddingRecipeStep,
  selectErrorRecipeStep,
  selectLoadingRecipeStep,
  selectRecipeStepsByID,
  selectUpdatingRecipeStep,
} from 'src/app/recipes/state/recipe-step/recipe-step-selectors';
import { Step } from 'src/app/recipes/state/step/step-state';
import {
  selectSteps,
  selectAdding,
  selectLoading,
  selectStepByTitle,
  selectLatestAddedStep,
} from 'src/app/recipes/state/step/step-selectors';
import { AddRecipeStepModalComponent } from '../add-recipe-step-modal/add-recipe-step-modal.component';
import { StepActions } from 'src/app/recipes/state/step/step-actions';
import { RecipeStepActions } from 'src/app/recipes/state/recipe-step/recipe-step-actions';
import { Actions, ofType } from '@ngrx/effects';
import { RecipeStep } from 'src/app/recipes/state/recipe-step/recipe-step-state';

@Component({
  selector: 'dl-recipe-steps-modal',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule, DragDropModule],
  templateUrl: './recipe-steps-modal.component.html',
})
export class RecipeStepsModalComponent {
  recipe;
  isAdding$: Observable<boolean>;
  isLoading$: Observable<boolean>;
  recipeSteps$!: Observable<any[]>;
  steps$!: Observable<Step[]>;
  displayRecipeSteps: any[] = [];

  constructor(
    public dialogRef: MatDialogRef<RecipeStepsModalComponent>,
    public dialog: MatDialog,
    private store: Store,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private changeDetectorRef: ChangeDetectorRef,
    private actions$: Actions
  ) {
    this.recipe = this.data.recipe;
    this.isAdding$ = this.store.select(selectAddingRecipeStep);
    this.isLoading$ = this.store.select(selectLoadingRecipeStep);
    this.recipeSteps$ = this.store.select(
      selectRecipeStepsByID(this.recipe.recipeID)
    );
    this.steps$ = this.store.select(selectSteps);
  }

  ngOnInit() {
    //enhance recipeSteps with step.title into displayRecipeSteps
    this.recipeSteps$.pipe(take(1)).subscribe((recipeSteps) => {
      this.steps$.pipe(take(1)).subscribe((steps) => {
        recipeSteps.forEach((recipeStep) => {
          const step = steps.find((step) => step.stepID === recipeStep.stepID);
          this.displayRecipeSteps.push({
            ...recipeStep,
            title: step!.title,
            description: step!.description,
            toAdd: false,
            sequenceChanged: false,
          });
        });
      });
    });
    //sort displayRecipeSteps by sequence
    this.displayRecipeSteps.sort((a, b) => a.sequence - b.sequence);
  }

  enhanceRecipeStep() {}

  stepsToAdd(): boolean {
    return this.displayRecipeSteps.some((recipeStep) => recipeStep.toAdd);
  }

  stepsToReorder(): boolean {
    return this.displayRecipeSteps.some(
      (recipeStep) => recipeStep.sequenceChanged
    );
  }

  onAddClick() {
    const dialogRef = this.dialog.open(AddRecipeStepModalComponent, {
      data: {},
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result?.title) {
        const addedRecipeStep: any = {
          title: result.title,
          description: result.description,
          sequence: this.displayRecipeSteps.length + 1,
          toAdd: true,
          sequenceChanged: false,
        };

        this.displayRecipeSteps.push(addedRecipeStep);
      }
    });
  }

  checkSequence() {
    //iterate through each step in displayRecipeSteps. If recipeStepID is not found in recipeSteps, skip it. If sequence is different compared with recipeSteps, set sequenceChanged to true
    this.displayRecipeSteps.forEach((recipeStep) => {
      const recipeStepID = recipeStep.recipeStepID;
      this.recipeSteps$.pipe(take(1)).subscribe((originalRecipeSteps) => {
        const originalRecipeStep = originalRecipeSteps.find(
          (originalRecipeStep) =>
            originalRecipeStep.recipeStepID === recipeStepID
        );
        if (originalRecipeStep) {
          if (originalRecipeStep.sequence !== recipeStep.sequence) {
            recipeStep.sequenceChanged = true;
          } else recipeStep.sequenceChanged = false;
        }
      });
    });
  }
  onDrop(event: CdkDragDrop<string[]>) {
    const prevIndex = event.previousIndex;
    const currIndex = event.currentIndex;

    // Move the item in the array for display purposes
    moveItemInArray(this.displayRecipeSteps, prevIndex, currIndex);

    for (let i = 0; i < this.displayRecipeSteps.length; i++) {
      this.displayRecipeSteps[i].sequence = i + 1;
    }
    this.checkSequence();
  }

  onDeleteClick(recipeStepID: number, stepID: number) {
    console.log(`DELETING RECIPE STEP: ${recipeStepID}`);
  }

  onSubmit() {
    const stepsToAdd = this.displayRecipeSteps.filter(
      (recipeStep) => recipeStep.toAdd
    );

    from(stepsToAdd)
      .pipe(
        concatMap((recipeStep, index) => {
          const step = {
            title: recipeStep.title,
            description: recipeStep.description,
          };
          this.store.dispatch(StepActions.addStep({ step }));

          return this.actions$.pipe(
            ofType(StepActions.addStepSuccess),
            take(1),
            concatMap((action) => {
              const addedStep = action.step;
              const recipeStepToAdd = {
                recipeID: this.recipe.recipeID,
                sequence: recipeStep.sequence,
                stepID: addedStep.stepID,
              };
              this.store.dispatch(
                RecipeStepActions.addRecipeStep({ recipeStep: recipeStepToAdd })
              );

              return this.store.select(selectAddingRecipeStep).pipe(
                filter((addingRecipeStep) => !addingRecipeStep),
                take(1),
              );
            }),
            catchError((error) => {
              console.error(
                `PROCESSING RECIPE STEP ${index}: An error occurred while processing the step:`,
                error
              );
              return EMPTY;
            })
          );
        })
      )
      .subscribe({
        next: () => this.dialogRef.close('success'),
        error: (error) => {
          this.dialogRef.close();
          console.error('An unexpected error occurred:', error);
        },
      });

    // Second part: Update sequence for any existing recipe steps that have been reordered. Add this later.
    const stepsToResequence = this.displayRecipeSteps.filter(
      (recipeStep) => recipeStep.sequenceChanged
    );

    this.updateSequences(stepsToResequence).subscribe(() => {
      // Close the dialog with a 'success' result
      this.dialogRef.close('success');
    });
  }

  updateSequences(stepsToResequence: RecipeStep[]): Observable<void> {
    return from(stepsToResequence).pipe(
      concatMap((recipeStep) => {
        const updatedRecipeStep = {
          recipeStepID: recipeStep.recipeStepID,
          recipeID: recipeStep.recipeID,
          stepID: recipeStep.stepID,
          sequence: recipeStep.sequence, // Updated sequence value
        };
        // Dispatch the updateRecipeStep action to update the sequence
        this.store.dispatch(
          RecipeStepActions.updateRecipeStep({ recipeStep: updatedRecipeStep })
        );

        // Listen for the update status from the store
        return this.store.select(selectUpdatingRecipeStep).pipe(
          filter((updating) => !updating), // Wait until updating is false
          take(1),
          concatMap(() => {
            // Check for any error
            return this.store.select(selectErrorRecipeStep).pipe(
              take(1),
              map((error) => {
                if (error) {
                  console.error(
                    `Failed to update Recipe Step: ${error.message}`
                  );
                }
              })
            );
          })
        );
      })
    );
  }

  onCancel() {
    this.dialogRef.close();
  }
}
