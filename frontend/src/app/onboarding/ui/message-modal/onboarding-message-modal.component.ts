import { CommonModule } from '@angular/common';
import { Component, Inject, WritableSignal, signal } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogRef,
} from '@angular/material/dialog';
import { Store } from '@ngrx/store';
import { environment } from 'src/environments/environment';

import {
  catchError,
  debounceTime,
  filter,
  map,
  of,
  startWith,
  switchMap,
  take,
} from 'rxjs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ProfileActions } from 'src/app/profile/state/profile-actions';
import {
  selectError,
  selectUpdating,
} from 'src/app/profile/state/profile-selectors';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { isState } from 'src/app/shared/utils/formValidator';
import { AuthService } from 'src/app/shared/utils/authenticationService';
import { States } from 'src/app/shared/utils/types';
import { HttpClient } from '@angular/common/http';
import { ErrorModalComponent } from 'src/app/shared/ui/error-modal/error-modal.component';
import { Router } from '@angular/router';
import { ModalService } from 'src/app/shared/utils/modalService';

@Component({
  selector: 'dl-message-modal',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule, ReactiveFormsModule],
  templateUrl: './onboarding-message-modal.component.html',
})
export class OnboardingMessageModalComponent {
  private API_URL = `${environment.BACKEND}/profiles`;
  public initialAccountStateReady: WritableSignal<boolean> = signal(false);
  public states = Object.values(States);
  isEditing: WritableSignal<boolean> = signal(false);
  usernameErrorMessage: WritableSignal<string> = signal('');
  nameFirstErrorMessage: WritableSignal<string> = signal('');
  nameLastErrorMessage: WritableSignal<string> = signal('');
  cityErrorMessage: WritableSignal<string> = signal('');
  stateErrorMessage: WritableSignal<string> = signal('');
  submitFailureMessage: WritableSignal<string> = signal('');

  form!: FormGroup;
  public currentStep: WritableSignal<number> = signal(1);
  public totalSteps = 15;
  public showNextButton = false;
  constructor(
    @Inject(MAT_DIALOG_DATA)
    public data: {
      message: string;
      showNextButton: boolean;
      currentStep: number;
      username?: string;
      nameFirst?: string;
      nameLast?: string;
      city?: string;
      state?: string;
    },
    public dialogRef: MatDialogRef<OnboardingMessageModalComponent>,
    private store: Store,
    private fb: FormBuilder,
    private authService: AuthService,
    private http: HttpClient,
    public dialog: MatDialog,
    private router: Router,
    private modalService: ModalService
  ) {}

  ngOnInit(): void {
    this.showNextButton = this.data.showNextButton || false;
    this.currentStep.set(this.data.currentStep || 1);
    if (this.data.currentStep === 0.5) {
      this.setForm();
      // call backend '/profiles/:userID' to populate the account with initial data
      this.http
        .post(`${this.API_URL}/${this.authService.profile()!.user_id}`, {})
        .subscribe((res: any) => {
          console.log('Initial profile data populated');
          if (res === 'success') {
            this.initialAccountStateReady.set(true);
          } else {
            this.submitFailureMessage.set(
              `Unable to load Initial Account Data, try Again later. Error: ${res.error}`
            );
            const ref = this.modalService.open(
              ErrorModalComponent,
              {
                data: {
                  errorMessage: `Unable to load Initial Account Data, try Again later. Error: ${res.error}`,
                  statusCode: '500',
                },
              },
              2,
              true
            );
            if (ref) {
              ref.afterClosed().subscribe(() => {
                this.authService.logout();
                this.router.navigate(['/login']);
              });
            } else {
            }
          }
        });
    }
    if (this.data.currentStep === 0.5) {
      const usernameControl = this.form.get('username');
      if (usernameControl) {
        usernameControl.valueChanges
          .pipe(
            startWith(usernameControl.value), // Emit the current value immediately
            debounceTime(300),
            switchMap((value) => {
              const uniqueCheck = this.authService
                .isUsernameUnique(value ?? '')
                .pipe(catchError(() => of(false)));

              const isValid = this.authService.isUsernameValid(value ?? '');

              return uniqueCheck.pipe(
                map((isUnique) => {
                  return { isUnique, isValid };
                })
              );
            })
          )
          .subscribe(({ isUnique, isValid }) => {
            if (usernameControl.pristine || usernameControl.value === '') {
              this.usernameErrorMessage.set('');
              return;
            }
            if (isUnique && isValid) {
              this.usernameErrorMessage.set('');
            } else {
              if (!isUnique) {
                this.usernameErrorMessage.set('Username is already taken');
              } else if (!isValid) {
                this.usernameErrorMessage.set(
                  'Username must be at least 5 characters long and contain only letters, numbers, and underscores.'
                );
              }
            }
          });
      }

      const nameFirstControl = this.form.get('nameFirst');
      if (nameFirstControl) {
        nameFirstControl.valueChanges
          .pipe(
            startWith(nameFirstControl.value), // Emit the current value immediately
            debounceTime(300)
          )
          .subscribe((value) => {
            console.log(`VALUE: ${value}`);
            if (nameFirstControl.pristine) {
              this.nameFirstErrorMessage.set('');
              return;
            }
            if (value.length > 0) {
              this.nameFirstErrorMessage.set('');
            } else {
              this.nameFirstErrorMessage.set('First name is required');
            }
          });
      }

      const nameLastControl = this.form.get('nameLast');
      if (nameLastControl) {
        nameLastControl.valueChanges
          .pipe(
            startWith(nameLastControl.value), // Emit the current value immediately
            debounceTime(300)
          )
          .subscribe((value) => {
            if (nameLastControl.pristine) {
              this.nameLastErrorMessage.set('');
              return;
            }
            if (value.length > 0) {
              this.nameLastErrorMessage.set('');
            } else {
              this.nameLastErrorMessage.set('Last name is required');
            }
          });
      }

      const stateControl = this.form.get('state');
      if (stateControl) {
        stateControl.valueChanges
          .pipe(
            startWith(stateControl.value), // Emit the current value immediately
            debounceTime(300)
          )
          .subscribe((value) => {
            // use isState() validator
            if (stateControl.pristine || stateControl.value === '') {
              this.stateErrorMessage.set('');
              return;
            }
            if (Object.values(States).includes(value)) {
              this.stateErrorMessage.set('');
            } else {
              this.stateErrorMessage.set('Please select a valid state');
            }
          });
      }
    } else {
      this.initialAccountStateReady.set(true);
    }
  }

  onNextClick(): void {
    this.isEditing.set(true);
    this.store.dispatch(
      ProfileActions.updateProfileProperty({
        property: 'onboardingState',
        value: this.currentStep() + 1,
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

  onSubmit() {
    console.log('submitting form');
    // get form values then use ProfileActions.updateProfile
    this.submitFailureMessage.set('');
    if (this.form.valid && this.currentStep() === 0.5) {
      const { username, nameFirst, nameLast, city, state } = this.form.value;
      this.store.dispatch(
        ProfileActions.updateProfile({
          profile: {
            username,
            name_first: nameFirst,
            name_last: nameLast,
            city,
            state,
            onboardingState: 1,
          },
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
                  `Error updating profile: ${error.message}, CODE: ${
                    error.statusCode
                  }, RAW: ${JSON.stringify(error)}`
                );
                this.submitFailureMessage.set('Error updating profile');
              } else {
                console.log('CLOSING DIALOG');
                this.dialogRef.close('success');
              }
            });
        });
    }
  }

  arrayFromCurrentStep(): Array<any> {
    const result = new Array(this.currentStep());
    return result;
  }
  arrayFromTotalStepsMinusCurrent(): Array<any> {
    const result = new Array(this.totalSteps - this.currentStep());
    return result;
  }

  setForm() {
    this.form = this.fb.group({
      username: [
        {
          value: this.data.username || '',
          disabled: this.data.username !== '' && this.data.username !== null,
        },
        Validators.required,
      ],
      nameFirst: [this.data.nameFirst || '', [Validators.required]],
      nameLast: [this.data.nameLast || '', [Validators.required]],
      city: [this.data.city || ''],
      state: [this.data.state || '', [isState()]],
    });
  }

  getFillColor(index: number): string {
    const darkMode = this.authService.profile()?.darkMode;
    switch (index) {
      case 1:
        return darkMode ? '#B3ECFF' : '#0B69A3';
      case 2:
        return darkMode ? '#40C3F7' : '#2BB0ED';
      default:
        return darkMode ? '#B3ECFF' : '#0B69A3';
    }
  }
}
