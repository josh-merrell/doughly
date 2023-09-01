import { Component, Inject } from '@angular/core';
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
  catchError,
  concatMap,
  filter,
  from,
  map,
  take,
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
  selectSteps
} from 'src/app/recipes/state/step/step-selectors';
import { AddRecipeStepModalComponent } from '../add-recipe-step-modal/add-recipe-step-modal.component';
import { StepActions } from 'src/app/recipes/state/step/step-actions';
import { RecipeStepActions } from 'src/app/recipes/state/recipe-step/recipe-step-actions';
import { Actions, ofType } from '@ngrx/effects';
import { RecipeStep } from 'src/app/recipes/state/recipe-step/recipe-step-state';
import { DeleteRecipeStepModalComponent } from '../delete-recipe-step-modal/delete-recipe-step-modal.component';

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
  stepsToAdd!: boolean;
  stepsToReorder!: boolean;
  recipeSteps$!: Observable<any[]>;
  steps$!: Observable<Step[]>;
  displayRecipeSteps: any[] = [];
  private displayRecipeStepsSubject = new BehaviorSubject<any[]>([]);
  displayRecipeSteps$ = this.displayRecipeStepsSubject.asObservable();

  constructor(
    public dialogRef: MatDialogRef<RecipeStepsModalComponent>,
    public dialog: MatDialog,
    private store: Store,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private actions$: Actions
  ) {
    this.recipe = this.data.recipe;
    this.isAdding$ = this.store.select(selectAddingRecipeStep);
    this.isLoading$ = this.store.select(selectLoadingRecipeStep);
    this.recipeSteps$ = this.store.select(
      selectRecipeStepsByID(this.recipe.recipeID)
    );
    this.steps$ = this.store.select(selectSteps);
    this.stepsToAdd = false;
    this.stepsToReorder = false;
  }

  ngOnInit() {
    // enhance recipeSteps with step.title into displayRecipeSteps
    this.recipeSteps$.pipe(take(1)).subscribe((recipeSteps) => {
      this.steps$.pipe(take(1)).subscribe((steps) => {
        const displayRecipeSteps: any = [];
        recipeSteps.forEach((recipeStep) => {
          const step = steps.find((step) => step.stepID === recipeStep.stepID);
          displayRecipeSteps.push({
            ...recipeStep,
            title: step!.title,
            description: step!.description,
            toAdd: false,
            sequenceChanged: false,
          });
        });
        this.displayRecipeStepsSubject.next(displayRecipeSteps);
      });
    });
    // sort displayRecipeSteps by sequence
    this.displayRecipeSteps$.pipe(take(1)).subscribe((steps) => {
      steps.sort((a, b) => a.sequence - b.sequence);
    });
    this.checkStepsToAdd().subscribe((stepsToAdd) => {
      this.stepsToAdd = stepsToAdd;
    });
    this.checkStepsToReorder().subscribe((stepsToReorder) => {
      this.stepsToReorder = stepsToReorder;
    });
  }

  checkStepsToAdd(): Observable<boolean> {
    return this.displayRecipeStepsSubject.pipe(
      map((displayRecipeSteps) =>
        displayRecipeSteps.some((recipeStep) => recipeStep.toAdd)
      )
    );
  }

  checkStepsToReorder(): Observable<boolean> {
    return this.displayRecipeStepsSubject.pipe(
      map((displayRecipeSteps) =>
        displayRecipeSteps.some((recipeStep) => recipeStep.sequenceChanged)
      )
    );
  }

  onAddClick() {
    const dialogRef = this.dialog.open(AddRecipeStepModalComponent, {
      data: {},
      width: '75%',
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result?.title) {
        // Get the current value of displayRecipeSteps from the BehaviorSubject
        this.displayRecipeStepsSubject
          .pipe(take(1))
          .subscribe((displayRecipeSteps) => {
            const addedRecipeStep: any = {
              title: result.title,
              description: result.description,
              sequence: displayRecipeSteps.length + 1,
              photoURL: result.photoURL,
              toAdd: true,
              sequenceChanged: false,
            };

            // Add the new step to the local copy of the array
            displayRecipeSteps.push(addedRecipeStep);

            // Push the updated steps back into the BehaviorSubject
            this.displayRecipeStepsSubject.next(displayRecipeSteps);
          });
      }
    });
  }

  checkSequence() {
    // Get the current value of displayRecipeSteps from the BehaviorSubject
    this.displayRecipeStepsSubject
      .pipe(take(1))
      .subscribe((displayRecipeSteps) => {
        this.recipeSteps$.pipe(take(1)).subscribe((originalRecipeSteps) => {
          displayRecipeSteps.forEach((recipeStep) => {
            const recipeStepID = recipeStep.recipeStepID;
            const originalRecipeStep = originalRecipeSteps.find(
              (originalRecipeStep) =>
                originalRecipeStep.recipeStepID === recipeStepID
            );

            if (originalRecipeStep) {
              if (originalRecipeStep.sequence !== recipeStep.sequence) {
                recipeStep.sequenceChanged = true;
              } else {
                recipeStep.sequenceChanged = false;
              }
            }
          });
          // Push the updated displayRecipeSteps back into the BehaviorSubject
          this.displayRecipeStepsSubject.next(displayRecipeSteps);
        });
      });
  }

  onDrop(event: CdkDragDrop<string[]>) {
    const prevIndex = event.previousIndex;
    const currIndex = event.currentIndex;

    // Get the current value of displayRecipeSteps from the BehaviorSubject
    this.displayRecipeStepsSubject
      .pipe(take(1))
      .subscribe((displayRecipeSteps) => {
        // Move the item in the array for display purposes
        moveItemInArray(displayRecipeSteps, prevIndex, currIndex);

        // Update the sequence for all steps
        for (let i = 0; i < displayRecipeSteps.length; i++) {
          displayRecipeSteps[i].sequence = i + 1;
        }

        // Push the updated steps back into the BehaviorSubject
        this.displayRecipeStepsSubject.next(displayRecipeSteps);
      });

    this.checkSequence();
  }

  onDeleteClick(recipeStep: any) {
    if (recipeStep.recipeStepID) {
      const dialogRef = this.dialog.open(DeleteRecipeStepModalComponent, {
        data: {
          recipeStep: recipeStep,
        },
      });

      dialogRef.afterClosed().subscribe((result) => {
        if (result === 'success') {
          this.dialog.open(DeleteRequestConfirmationModalComponent, {
            data: {
              deleteSuccessMessage: 'Step successfully removed from recipe!',
            },
          });

          // Compose a new 'updatedDisplayRecipeSteps' list
          this.displayRecipeSteps$
            .pipe(take(1))
            .subscribe((displayRecipeSteps) => {
              let updatedDisplayRecipeSteps = [...displayRecipeSteps];

              // Retrieve the latest recipe steps from the store
              this.store
                .select(selectRecipeStepsByID(this.recipe.recipeID))
                .pipe(take(1))
                .subscribe((recipeSteps) => {
                  recipeSteps.forEach((freshStep) => {
                    const correspondingStep = updatedDisplayRecipeSteps.find(
                      (step) => step.recipeStepID === freshStep.recipeStepID
                    );
                    if (correspondingStep) {
                      correspondingStep.sequence = freshStep.sequence;
                    }
                  });

                  // Remove the deleted recipe step
                  updatedDisplayRecipeSteps = updatedDisplayRecipeSteps.filter(
                    (step) => step.recipeStepID !== recipeStep.recipeStepID
                  );

                  // Decrement the sequence for 'toAdd' === true or 'sequenceChanged' === true
                  updatedDisplayRecipeSteps.forEach((step) => {
                    if (
                      step.toAdd === true || step.sequenceChanged === true &&
                      step.sequence > recipeStep.sequence
                    ) {
                      step.sequence--;
                    }
                  });

                  // Update the displayRecipeStepsSubject
                  this.displayRecipeStepsSubject.next(
                    updatedDisplayRecipeSteps
                  );
                });
            });
        } else if (result) {
          this.dialog.open(DeleteRequestErrorModalComponent, {
            data: {
              error: result,
              deleteFailureMessage: 'Step could not be removed from recipe.',
            },
          });
        }
      });
    } else {
      // Update the steps in the BehaviorSubject for local removal
      this.displayRecipeSteps$.pipe(take(1)).subscribe((steps) => {
        const updatedSteps = steps.filter(
          (step) => step.title !== recipeStep.title
        );
        this.displayRecipeStepsSubject.next(updatedSteps);
      });
    }
  }

  onSubmit() {
    this.displayRecipeStepsSubject
      .pipe(take(1))
      .subscribe((displayRecipeSteps) => {
        const stepsToAdd = displayRecipeSteps.filter(
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
                    photoURL: recipeStep.photoURL,
                  };
                  this.store.dispatch(
                    RecipeStepActions.addRecipeStep({
                      recipeStep: recipeStepToAdd,
                    })
                  );

                  return this.store.select(selectAddingRecipeStep).pipe(
                    filter((addingRecipeStep) => !addingRecipeStep),
                    take(1)
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

        // Second part: Update sequence for any existing recipe steps that have been reordered
        const stepsToResequence = displayRecipeSteps.filter(
          (recipeStep) => recipeStep.sequenceChanged
        );

        this.updateSequences(stepsToResequence).subscribe(() => {
          this.dialogRef.close('success');
        });
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
