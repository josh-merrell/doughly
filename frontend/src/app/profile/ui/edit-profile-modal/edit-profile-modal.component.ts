import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from 'src/app/shared/utils/authenticationService';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatInputModule } from '@angular/material/input';
import { isState } from 'src/app/shared/utils/formValidator';
import { Store } from '@ngrx/store';
import { ProfileActions } from 'src/app/profile/state/profile-actions';
import { selectError as selectErrorProfile, selectUpdating as selectUpdatingProfile } from 'src/app/profile/state/profile-selectors';
import { filter, take } from 'rxjs';
import { ErrorModalComponent } from 'src/app/shared/ui/error-modal/error-modal.component';
import { ModalService } from 'src/app/shared/utils/modalService';
import { TextInputComponent } from 'src/app/shared/ui/text-input/text-input.component';


@Component({
  selector: 'dl-edit-profile-modal',
  standalone: true,
  imports: [
    CommonModule,
    MatProgressSpinnerModule,
    MatInputModule,
    ReactiveFormsModule,
    TextInputComponent
  ],
  templateUrl: './edit-profile-modal.component.html',
})
export class EditProfileModalComponent {
  isEditing: boolean = false;
  form!: FormGroup;
  field: string = '';
  currVal: string = '';
  profileProperties = {
    name_first: 'First Name',
    name_last: 'Last Name',
    email: 'Email',
    phone: 'Phone',
    address: 'Address',
    city: 'City',
    state: 'State',
  };

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<EditProfileModalComponent>,
    public authService: AuthService,
    private store: Store,
    private dialog: MatDialog,
    private modalService: ModalService
  ) {
  }

  ngOnInit(): void {
    type ProfilePropertyKeys = keyof typeof this.profileProperties;

    if (this.data.property in this.profileProperties) {
      const propertyKey = this.data.property as ProfilePropertyKeys;
      this.field = this.profileProperties[propertyKey];
      this.currVal = this.data.value;
      this.setForm(propertyKey);
    } else {
      console.error(`Invalid property key: ${this.data.property}`);
      this.field = 'Unknown Field';
    }
  }

  setForm(propertyKey: string) {  
    const formControls = {
      [this.data.property]: [this.data.value],
    };
    if (propertyKey === 'state') {
      formControls[this.data.property].push(isState());
    }
    this.form = this.fb.group(formControls);
  }

  onSubmit() {
    this.isEditing = true;
    const formValues = this.form.value;
    this.store.dispatch(
      ProfileActions.updateProfileProperty({
        property: this.data.property,
        value: formValues[this.data.property],
      })
    );
    this.store.select(selectUpdatingProfile).pipe(filter((updating) => !updating), take(1)).subscribe(() => {
      this.store
        .select(selectErrorProfile)
        .pipe(take(1))
        .subscribe((error) => {
          if (error) {
            console.error(
              `Error updating profile: ${error.message}, CODE: ${error.statusCode}`
            );
            this.modalService.open(ErrorModalComponent, {
              maxWidth: '380px',
              data: {
                errorMessage: error.message,
                statusCode: error.statusCode,
              },
            }, 2, true);
          } else {
            this.dialogRef.close('success');
          }
          this.isEditing = false;
        });
    });
  }

  onCancel() {
    this.dialogRef.close('cancel');
  }
}
