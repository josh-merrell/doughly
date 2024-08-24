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
    SelectInputComponent,
  ],
  templateUrl: './settings.component.html',
})
export class SettingsComponent {
  isEditing: boolean = false;
  form!: FormGroup;
  imagePlaceholder: string = '/assets/icons/logo-primary-light.svg';
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
        notifyOnLowStock:
          newProfile.notifyOnLowStock === 'Enabled' ? true : false,
        notifyOnNoStock:
          newProfile.notifyOnNoStock === 'Enabled' ? true : false,
        notifyUpcomingStockExpiry:
          newProfile.notifyUpcomingStockExpiry === 'Enabled' ? true : false,
        notifyExpiredStock:
          newProfile.notifyExpiredStock === 'Enabled' ? true : false,
        notifyFriendCreateRecipe:
          newProfile.notifyFriendCreateRecipe === 'Enabled' ? true : false,
        notifyFolloweeCreateRecipe:
          newProfile.notifyFolloweeCreateRecipe === 'Enabled' ? true : false,
        notifyFriendRequest:
          newProfile.notifyFriendRequest === 'Enabled' ? true : false,
        notifyNewFollower:
          newProfile.notifyNewFollower === 'Enabled' ? true : false,
      });
    });
  }

  ngOnInit() {
    this.store.select(selectProfile).subscribe((profile) => {
      this.profile.set(profile);
    });
    this.setForm();
  }

  ngAfterViewInit() {
    this.checkIconStyle();
  }

  checkIconStyle(): void {
    // check document for 'dark' class to determine if dark mode is enabled
    if (document.body.classList.contains('dark')) {
      this.imagePlaceholder = '/assets/icons/logo-primary-dark.svg';
    } else {
      this.imagePlaceholder = '/assets/icons/logo-primary-light.svg';
    }
  }

  setForm() {
    this.form = this.fb.group({
      checkIngredientStock: [false],
      autoDeleteExpiredStock: [false],
      darkMode: ['', [Validators.required]],
      notifyOnLowStock: [true],
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
      notifyOnLowStock: this.form.value.notifyOnLowStock ? 'Enabled' : 'None',
      notifyOnNoStock: this.form.value.notifyOnNoStock ? 'Enabled' : 'None',
      notifyUpcomingStockExpiry: this.form.value.notifyUpcomingStockExpiry
        ? 'Enabled'
        : 'None',
      notifyExpiredStock: this.form.value.notifyExpiredStock
        ? 'Enabled'
        : 'None',
      notifyFriendCreateRecipe: this.form.value.notifyFriendCreateRecipe
        ? 'Enabled'
        : 'None',
      notifyFolloweeCreateRecipe: this.form.value.notifyFolloweeCreateRecipe
        ? 'Enabled'
        : 'None',
      notifyFriendRequest: this.form.value.notifyFriendRequest
        ? 'Enabled'
        : 'None',
      notifyNewFollower: this.form.value.notifyNewFollower ? 'Enabled' : 'None',
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
            this.checkIconStyle();
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
