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
  Observable,
  Subscription,
  combineLatest,
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
  selectLoadingRecipeStep,
  selectRecipeStepsByID,
} from 'src/app/recipes/state/recipe-step/recipe-step-selectors';
import { Step } from 'src/app/recipes/state/step/step-state';
import { selectSteps } from 'src/app/recipes/state/step/step-selectors';
import { AddRecipeStepModalComponent } from '../add-recipe-step-modal/add-recipe-step-modal.component';

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
    private changeDetectorRef: ChangeDetectorRef
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

  onDrop(event: CdkDragDrop<string[]>) {
    // Capture the previous and current index for easier reference
    const prevIndex = event.previousIndex;
    const currIndex = event.currentIndex;

    // Swap the sequence property between the two elements
    const tempSequence = this.displayRecipeSteps[prevIndex].sequence;
    this.displayRecipeSteps[prevIndex].sequence =
      this.displayRecipeSteps[currIndex].sequence;
    this.displayRecipeSteps[currIndex].sequence = tempSequence;

    // Move the item in the array for display purposes
    moveItemInArray(this.displayRecipeSteps, prevIndex, currIndex);

    //sort displayRecipeSteps by sequence
    this.displayRecipeSteps.sort((a, b) => a.sequence - b.sequence);

    // Perform a check for sequence changes
    this.checkSequence();
  }

  onDeleteClick(recipeStepID: number, stepID: number) {
    console.log(`DELETING RECIPE STEP: ${recipeStepID}`);
  }

  onSubmit() {
    console.log('SUBMITTING RECIPE STEPS');
  }

  onCancel() {
    this.dialogRef.close();
  }
}
