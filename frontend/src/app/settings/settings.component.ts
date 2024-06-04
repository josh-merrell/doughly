import { Component, WritableSignal, effect, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { Store } from '@ngrx/store';
import { ProfileActions } from '../profile/state/profile-actions';
import {
  selectError as selectErrorProfile,
  selectProfile,
  selectUpdating as selectUpdatingProfile,
} from 'src/app/profile/state/profile-selectors';
import { filter, take } from 'rxjs';
import { ErrorModalComponent } from '../shared/ui/error-modal/error-modal.component';
import { ConfirmationModalComponent } from '../shared/ui/confirmation-modal/confirmation-modal.component';
import { notificationMethods, darkModeOptions } from '../shared/utils/types';
import { ModalService } from '../shared/utils/modalService';
import { SelectInputComponent } from 'src/app/shared/ui/select-input/select-input.component';

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
    SelectInputComponent
  ],
  templateUrl: './settings.component.html',
})
export class SettingsComponent {
  isEditing: boolean = false;
  form!: FormGroup;
  private profile: WritableSignal<any> = signal({});
  notificationMethods: string[] = Object.values(notificationMethods);
  darkModeOptions: string[] = Object.values(darkModeOptions);
  constructor(
    private fb: FormBuilder,
    private store: Store,
    private modalService: ModalService
  ) {
    effect(() => {
      const newProfile = this.profile();
      // update form value of 'checkIngredientStock' when profile changes
      this.form.patchValue({
        checkIngredientStock: newProfile.checkIngredientStock,
        autoDeleteExpiredStock: newProfile.autoDeleteExpiredStock,
        darkMode: newProfile.darkMode,
        notifyOnLowStock: newProfile.notifyOnLowStock,
        notifyOnNoStock: newProfile.notifyOnNoStock,
        notifyUpcomingStockExpiry: newProfile.notifyUpcomingStockExpiry,
        notifyExpiredStock: newProfile.notifyExpiredStock,
        notifyFriendCreateRecipe: newProfile.notifyFriendCreateRecipe,
        notifyFolloweeCreateRecipe: newProfile.notifyFolloweeCreateRecipe,
        notifyFriendRequest: newProfile.notifyFriendRequest,
        notifyNewFollower: newProfile.notifyNewFollower,
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
      darkMode: ['', [Validators.required]],
      notifyOnLowStock: ['', [Validators.required]],
      notifyOnNoStock: ['', [Validators.required]],
      notifyUpcomingStockExpiry: ['', [Validators.required]],
      notifyExpiredStock: ['', [Validators.required]],
      notifyFriendCreateRecipe: ['', [Validators.required]],
      notifyFolloweeCreateRecipe: ['', [Validators.required]],
      notifyFriendRequest: ['', [Validators.required]],
      notifyNewFollower: ['', [Validators.required]],
    });
  }

  onSubmit() {
    this.isEditing = true;
    const updateBody = {
      checkIngredientStock: this.form.value.checkIngredientStock
        ? 'true'
        : 'false',
      autoDeleteExpiredStock: this.form.value.autoDeleteExpiredStock
        ? 'true'
        : 'false',
      darkMode: this.form.value.darkMode,
      notifyOnLowStock: this.form.value.notifyOnLowStock,
      notifyOnNoStock: this.form.value.notifyOnNoStock,
      notifyUpcomingStockExpiry: this.form.value.notifyUpcomingStockExpiry,
      notifyExpiredStock: this.form.value.notifyExpiredStock,
      notifyFriendCreateRecipe: this.form.value.notifyFriendCreateRecipe,
      notifyFolloweeCreateRecipe: this.form.value.notifyFolloweeCreateRecipe,
      notifyFriendRequest: this.form.value.notifyFriendRequest,
      notifyNewFollower: this.form.value.notifyNewFollower,
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
            this.modalService.open(
              ErrorModalComponent,
              {
                data: {
                  errorMessage: error.message,
                  statusCode: error.statusCode,
                },
              },
              1,
              true
            );
          } else {
            this.modalService.open(
              ConfirmationModalComponent,
              {
                maxWidth: '380px',
                data: {
                  confirmationMessage: 'Updated settings successfully!',
                },
              },
              1,
              true
            );
          }
          this.isEditing = false;
        });
      });
  }
}
