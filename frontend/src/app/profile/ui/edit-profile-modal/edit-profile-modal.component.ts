import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from 'src/app/shared/utils/authenticationService';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatInputModule } from '@angular/material/input';
import { States } from 'src/app/shared/utils/types';
import { isState } from 'src/app/shared/utils/formValidator';

@Component({
  selector: 'dl-edit-profile-modal',
  standalone: true,
  imports: [
    CommonModule,
    MatProgressSpinnerModule,
    MatInputModule,
    ReactiveFormsModule,
  ],
  templateUrl: './edit-profile-modal.component.html',
})
export class EditProfileModalComponent {
  isEditing: boolean;
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
    public authService: AuthService
  ) {
    this.isEditing = false;
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
    this.authService
      .updateField(this.data.property, formValues[this.data.property])
      .subscribe({
        next: (result) => {
          this.dialogRef.close('success');
          this.isEditing = false;
        },
        error: (error) => {
          this.dialogRef.close({ error: error });
          this.isEditing = false;
        },
      });
  }

  onCancel() {
    this.dialogRef.close('cancel');
  }
}
