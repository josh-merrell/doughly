import {
  Component,
  ElementRef,
  Inject,
  Renderer2,
  ViewChild,
} from '@angular/core';
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
  concat,
  concatAll,
  concatMap,
  filter,
  from,
  map,
  of,
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
import { selectSteps } from 'src/app/recipes/state/step/step-selectors';
import { AddRecipeStepModalComponent } from '../add-recipe-step-modal/add-recipe-step-modal.component';
import { StepActions } from 'src/app/recipes/state/step/step-actions';
import { RecipeStepActions } from 'src/app/recipes/state/recipe-step/recipe-step-actions';
import { Actions, ofType } from '@ngrx/effects';
import { RecipeStep } from 'src/app/recipes/state/recipe-step/recipe-step-state';
import { DeleteRecipeStepModalComponent } from '../delete-recipe-step-modal/delete-recipe-step-modal.component';
import { EditRecipeStepModalComponent } from '../edit-recipe-step-modal/edit-recipe-step-modal.component';
import { ErrorModalComponent } from 'src/app/shared/ui/error-modal/error-modal.component';
import { ModalService } from 'src/app/shared/utils/modalService';

interface RecipeStepToUpdate {
  recipeStepID: any; // Replace 'any' with a more specific type if possible
  recipeID: any; // Replace 'any' with a more specific type if possible
  sequence: any; // Replace 'any' with a more specific type if possible
  stepID: number;
  photoURL?: string; // The '?' makes this property optional
}
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
  stepsToUpdate!: boolean;
  recipeSteps$!: Observable<any[]>;
  steps$!: Observable<Step[]>;
  displayRecipeSteps: any[] = [];
  private displayRecipeStepsSubject = new BehaviorSubject<any[]>([]);
  displayRecipeSteps$ = this.displayRecipeStepsSubject.asObservable();
  modalActiveForRowID: number | null = null;

  itemMenuOpen = { index: -1, open: false };
  @ViewChild('itemMenu') rowItemMenu!: ElementRef;
  globalClickListener: () => void = () => {};
  toggleItemMenu(event: any, index: number) {
    event.stopPropagation();
    if (this.itemMenuOpen.index === index) {
      this.itemMenuOpen.open = !this.itemMenuOpen.open;
    } else {
      this.itemMenuOpen.index = index;
      this.itemMenuOpen.open = true;
    }
  }
  closeitemMenu() {
    this.itemMenuOpen = { index: -1, open: false };
  }

  activateModalForRow(index: number) {
    this.modalActiveForRowID = index;
  }

  deactivateModalForRow() {
    this.modalActiveForRowID = null;
  }

  categoryCardTouchStart(index: number) {
    this.modalActiveForRowID = index;
  }

  categoryCardTouchEnd() {
    this.modalActiveForRowID = null;
  }

  recipeCardTouchStart(recipeID: number) {
    this.modalActiveForRowID = recipeID;
  }

  recipeCardTouchEnd() {
    this.modalActiveForRowID = null;
  }

  ngAfterViewInit() {
    this.globalClickListener = this.renderer.listen(
      'document',
      'click',
      (event) => {
        const clickedInside = this.rowItemMenu?.nativeElement.contains(
          event.target
        );
        if (!clickedInside && this.rowItemMenu) {
          this.closeitemMenu();
        }
      }
    );
  }

  constructor(
    private renderer: Renderer2,
    public dialogRef: MatDialogRef<RecipeStepsModalComponent>,
    public dialog: MatDialog,
    private store: Store,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private actions$: Actions,
    private modalService: ModalService
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
    this.stepsToUpdate = false;
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
            toUpdate: false,
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
    this.checkStepsToUpdate().subscribe((stepsToUpdate) => {
      this.stepsToUpdate = stepsToUpdate;
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

  checkStepsToUpdate(): Observable<boolean> {
    return this.displayRecipeStepsSubject.pipe(
      map((displayRecipeSteps) =>
        displayRecipeSteps.some((recipeStep) => recipeStep.toUpdate)
      )
    );
  }

  onAddClick() {
    const dialogRef = this.modalService.open(
      AddRecipeStepModalComponent,
      {
        width: '75%',
        data: { recipeID: this.recipe.recipeID },
      },
      2
    );
    if (dialogRef) {
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
    } else {
    }
  }

  onUpdateClick(displayRecipeStep: any, index: number) {
    this.activateModalForRow(index);
    const dialogRef = this.modalService.open(
      EditRecipeStepModalComponent,
      {
        data: displayRecipeStep,
        width: '75%',
      },
      2
    );
    if (dialogRef) {
      dialogRef.afterClosed().subscribe((result) => {
        this.deactivateModalForRow();
        if (result?.title || result?.description) {
          // Get the current value of displayRecipeSteps from the BehaviorSubject
          this.displayRecipeStepsSubject
            .pipe(take(1))
            .subscribe((displayRecipeSteps) => {
              const updatedRecipeStep: any = {
                title: result.title,
                description: result.description,
                sequence: displayRecipeStep.sequence,
                photoURL: result.photoURL,
                toUpdate: true,
                stepID: displayRecipeStep.stepID,
                recipeStepID: displayRecipeStep.recipeStepID,
                recipeID: displayRecipeStep.recipeID,
              };

              // Replace the displayRecipeSteps entry matching the recipeStepID with the updatedRecipeStep
              const index = displayRecipeSteps.findIndex(
                (step) => step.recipeStepID === displayRecipeStep.recipeStepID
              );
              displayRecipeSteps[index] = updatedRecipeStep;

              // Push the updated steps back into the BehaviorSubject
              this.displayRecipeStepsSubject.next(displayRecipeSteps);
            });
        }
      });
    } else {
    }
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

  onDeleteClick(displayRecipeStep: any, index: number) {
    this.activateModalForRow(index);
    if (displayRecipeStep.recipeStepID) {
      const dialogRef = this.modalService.open(
        DeleteRecipeStepModalComponent,
        {
          data: {
            recipeStep: displayRecipeStep,
          },
        },
        2
      );
      if (dialogRef) {
        dialogRef.afterClosed().subscribe((result) => {
          this.deactivateModalForRow();
          if (result === 'success') {
            this.modalService.open(
              DeleteRequestConfirmationModalComponent,
              {
                data: {
                  deleteSuccessMessage:
                    'Step successfully removed from recipe!',
                },
              },
              2,
              true
            );

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
                    updatedDisplayRecipeSteps =
                      updatedDisplayRecipeSteps.filter(
                        (step) =>
                          step.recipeStepID !== displayRecipeStep.recipeStepID
                      );

                    // Decrement the sequence for 'toAdd' === true or 'sequenceChanged' === true
                    updatedDisplayRecipeSteps.forEach((step) => {
                      if (
                        step.toAdd === true ||
                        (step.sequenceChanged === true &&
                          step.sequence > displayRecipeStep.sequence)
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
            this.modalService.open(
              DeleteRequestErrorModalComponent,
              {
                data: {
                  error: result,
                  deleteFailureMessage:
                    'Step could not be removed from recipe.',
                },
              },
              2,
              true
            );
          }
        });
      } else {
      }
    } else {
      // Update the steps in the BehaviorSubject for local removal
      this.displayRecipeSteps$.pipe(take(1)).subscribe((steps) => {
        const updatedSteps = steps.filter(
          (step) => step.title !== displayRecipeStep.title
        );
        this.displayRecipeStepsSubject.next(updatedSteps);
      });
    }
  }

  onSubmit() {
    this.displayRecipeStepsSubject
      .pipe(
        take(1),
        concatMap((displayRecipeSteps) => {
          // Perform each part sequentially
          return concat(
            this.updateSteps(displayRecipeSteps), // First part: Update any edited steps (and related recipeSteps)
            this.addSteps(displayRecipeSteps), //Second part: Add any new steps (and related recipeSteps)
            this.resequenceSteps(displayRecipeSteps) // Third part: Update sequence for any existing recipe steps that have been reordered
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
  }

  updateSteps(displayRecipeSteps: any[]): Observable<any> {
    const stepsToUpdate = displayRecipeSteps.filter(
      (recipeStep) => recipeStep.toUpdate
    );

    const updateObservables = stepsToUpdate.map((recipeStep, index) => {
      return this.updateStepAndRecipeStep(recipeStep, index);
    });

    return from(updateObservables).pipe(
      concatAll(),
      catchError((error) => {
        console.error('An error occurred while updating the steps:', error);
        return EMPTY;
      })
    );
  }

  updateStepAndRecipeStep(recipeStep: any, index: number): Observable<any> {
    // find the corresponding displayRecipeStep. If the title or description has changed, update the step
    const stepToUpdate = {
      stepID: recipeStep.stepID,
    };
    stepToUpdate['title'] = recipeStep.title;
    stepToUpdate['description'] = recipeStep.description;
    this.store.dispatch(StepActions.updateStep({ step: stepToUpdate }));

    return this.actions$.pipe(
      ofType(StepActions.updateStepSuccess),
      take(1),
      concatMap((action) => {
        const updatedStep = action.step;
        const recipeStepToUpdate: RecipeStepToUpdate = {
          recipeStepID: recipeStep.recipeStepID,
          recipeID: this.recipe.recipeID,
          sequence: recipeStep.sequence,
          stepID: updatedStep.stepID!,
        };
        if (recipeStep.photoURL) {
          recipeStepToUpdate.photoURL = recipeStep.photoURL;
        }
        this.store.dispatch(
          RecipeStepActions.updateRecipeStep({ recipeStep: recipeStepToUpdate })
        );
        return this.store.select(selectUpdatingRecipeStep).pipe(
          filter((updating) => !updating),
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
  }

  addSteps(displayRecipeSteps: any[]): Observable<any> {
    const stepsToAdd = displayRecipeSteps.filter(
      (recipeStep) => recipeStep.toAdd
    );

    return from(stepsToAdd).pipe(
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
              RecipeStepActions.addRecipeStep({ recipeStep: recipeStepToAdd })
            );

            return this.store.select(selectAddingRecipeStep).pipe(
              filter((adding) => !adding),
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
    );
  }

  resequenceSteps(displayRecipeSteps: any[]): Observable<any> {
    const stepsToResequence = displayRecipeSteps.filter(
      (recipeStep) => recipeStep.sequenceChanged
    );

    return this.updateSequences(stepsToResequence).pipe(
      catchError((error) => {
        console.error('An error occurred while resequencing the steps:', error);
        return EMPTY;
      })
    );
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
                    true
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
