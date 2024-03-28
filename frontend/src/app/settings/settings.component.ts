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
  selectProfile,
  selectUpdating as selectUpdatingProfile,
} from 'src/app/profile/state/profile-selectors';
import { filter, take } from 'rxjs';
import { ErrorModalComponent } from '../shared/ui/error-modal/error-modal.component';
import { ConfirmationModalComponent } from '../shared/ui/confirmation-modal/confirmation-modal.component';
import { notificationMethods } from '../shared/utils/types';

@Component({
  selector: 'dl-settings',
  standalone: true,
  imports: [
    CommonModule,
    MatProgressSpinnerModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSlideToggleModule,
    MatSelectModule,
  ],
  templateUrl: './settings.component.html',
})
export class SettingsComponent {
  isEditing: boolean = false;
  form!: FormGroup;
  private profile: WritableSignal<any> = signal({});
  notificationMethods: string[] = Object.values(notificationMethods);
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
        autoDeleteExpiredStock: newProfile.autoDeleteExpiredStock,
        notifyOnLowStock: newProfile.notifyOnLowStock,
        notifyOnNoStock: newProfile.notifyOnNoStock,
        notifyUpcomingStockExpiry: newProfile.notifyUpcomingStockExpiry,
        notifyExpiredStock: newProfile.notifyExpiredStock,
        notifyFriendCreateRecipe: newProfile.notifyFriendCreateRecipe,
        notifyFolloweeCreateRecipe: newProfile.notifyFolloweeCreateRecipe,
      });
    });
  }

  ngOnInit() {
    this.store.select(selectProfile).subscribe((profile) => {
      this.profile.set(profile);
    });
    this.setForm();
  }

  setForm() {
    this.form = this.fb.group({
      checkIngredientStock: [false],
      autoDeleteExpiredStock: [false],
      notifyOnLowStock: ['', [Validators.required]],
      notifyOnNoStock: ['', [Validators.required]],
      notifyUpcomingStockExpiry: ['', [Validators.required]],
      notifyExpiredStock: ['', [Validators.required]],
      notifyFriendCreateRecipe: ['', [Validators.required]],
      notifyFolloweeCreateRecipe: ['', [Validators.required]],
    });
  }

  onSubmit() {
    this.isEditing = true;
    const updateBody = {
      checkIngredientStock: this.form.value.checkIngredientStock,
      autoDeleteExpiredStock: this.form.value.autoDeleteExpiredStock,
      notifyOnLowStock: this.form.value.notifyOnLowStock,
      notifyOnNoStock: this.form.value.notifyOnNoStock,
      notifyUpcomingStockExpiry: this.form.value.notifyUpcomingStockExpiry,
      notifyExpiredStock: this.form.value.notifyExpiredStock,
      notifyFriendCreateRecipe: this.form.value.notifyFriendCreateRecipe,
      notifyFolloweeCreateRecipe: this.form.value.notifyFolloweeCreateRecipe,
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
