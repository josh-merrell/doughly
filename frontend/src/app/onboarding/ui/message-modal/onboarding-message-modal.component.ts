import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'dl-message-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './onboarding-message-modal.component.html',
})
export class OnboardingMessageModalComponent {
  public currentStep = 1;
  public totalSteps = 16;
  public showNextButton = false;
  constructor(
    @Inject(MAT_DIALOG_DATA)
    public data: { message: string, showNextButton: boolean, currentStep: number},
    public dialogRef: MatDialogRef<OnboardingMessageModalComponent>
  ) {}

  ngOnInit(): void {
    this.showNextButton = this.data.showNextButton || true;
    this.currentStep = this.data.currentStep || 1;
  }

  onNextClick(): void {
    console.log('Next clicked');
  }

  arrayFromCurrentStep(): Array<any> {
    return new Array(this.currentStep);
  }
  arrayFromTotalStepsMinusCurrent(): Array<any> {
    return new Array(this.totalSteps - this.currentStep);
  }
}
