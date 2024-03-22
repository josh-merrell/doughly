import {
  Component,
  Inject,
  WritableSignal,
  effect,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { AuthService } from '../shared/utils/authenticationService';
import { Store } from '@ngrx/store';
import { MatDialog } from '@angular/material/dialog';
import { ProfileActions } from '../profile/state/profile-actions';
import {
  selectError as selectErrorProfile,
  selectUpdating as selectUpdatingProfile,
} from 'src/app/profile/state/profile-selectors';
import { filter, take } from 'rxjs';
import { ErrorModalComponent } from '../shared/ui/error-modal/error-modal.component';
import { ConfirmationModalComponent } from '../shared/ui/confirmation-modal/confirmation-modal.component';

@Component({
  selector: 'dl-settings',
  standalone: true,
  imports: [
    CommonModule,
    MatProgressSpinnerModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSlideToggleModule,
  ],
  templateUrl: './settings.component.html',
})
export class SettingsComponent {
  isEditing: boolean = false;
  form!: FormGroup;
  private profile: WritableSignal<any> = signal({});
  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private store: Store,
    private dialog: MatDialog
  ) {
    effect(() => {
      const newProfile = this.profile();
      // update form value of 'checkIngredientStock' when profile changes
      this.form.patchValue({
        checkIngredientStock: newProfile.checkIngredientStock,
      });
    });
  }

  ngOnInit() {
    this.authService.$profile.subscribe((profile) => {
      this.profile.set(profile);
    });
    this.setForm();
  }

  setForm() {
    this.form = this.fb.group({
      checkIngredientStock: [false],
    });
  }

  onSubmit() {
    this.isEditing = true;
    const updateBody = {
      checkIngredientStock: this.form.value.checkIngredientStock,
    };
    this.store.dispatch(ProfileActions.updateProfile({ profile: updateBody }));
    this.store
      .select(selectUpdatingProfile)
      .pipe(
        filter((updating) => !updating),
        take(1)
      )
      .subscribe(() => {
        this.store.select(selectErrorProfile).subscribe((error) => {
          if (error) {
            this.dialog.open(ErrorModalComponent, {
              data: {
                errorMessage: error.message,
                statusCode: error.statusCode,
              },
            });
          } else {
            this.dialog.open(ConfirmationModalComponent, {
              maxWidth: '380px',
              data: {
                confirmationMessage: 'Updated settings successfully!',
              },
            });
          }
          this.isEditing = false;
        });
      });
  }
}
