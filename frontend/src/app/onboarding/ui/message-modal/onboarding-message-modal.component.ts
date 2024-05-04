import { CommonModule } from '@angular/common';
import { Component, Inject, WritableSignal, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Store } from '@ngrx/store';
import { filter, take } from 'rxjs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ProfileActions } from 'src/app/profile/state/profile-actions';
import {
  selectError,
  selectUpdating,
} from 'src/app/profile/state/profile-selectors';

@Component({
  selector: 'dl-message-modal',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule],
  templateUrl: './onboarding-message-modal.component.html',
})
export class OnboardingMessageModalComponent {
  isEditing: WritableSignal<boolean> = signal(false);
  public currentStep = 1;
  public totalSteps = 15;
  public showNextButton = false;
  constructor(
    @Inject(MAT_DIALOG_DATA)
    public data: {
      message: string;
      showNextButton: boolean;
      currentStep: number;
    },
    public dialogRef: MatDialogRef<OnboardingMessageModalComponent>,
    private store: Store
  ) {}

  ngOnInit(): void {
    console.log(
      `ONBOARDING MODAL STEP: ${JSON.stringify(this.data.currentStep)}`
    );
    this.showNextButton = this.data.showNextButton || false;
    this.currentStep = this.data.currentStep || 1;
  }

  onNextClick(): void {
    this.isEditing.set(true);
    this.store.dispatch(
      ProfileActions.updateProfileProperty({
        property: 'onboardingState',
        value: this.currentStep + 1,
      })
    );
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
                `Error updating onboarding state: ${error.message}, CODE: ${error.statusCode}`
              );
            } else {
              // this.isEditing.set(false);
              this.dialogRef.close('nextClicked');
            }
          });
      });
  }

  arrayFromCurrentStep(): Array<any> {
    return new Array(this.currentStep);
  }
  arrayFromTotalStepsMinusCurrent(): Array<any> {
    return new Array(this.totalSteps - this.currentStep);
  }
}
