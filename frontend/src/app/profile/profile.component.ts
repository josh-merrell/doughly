import { ChangeDetectorRef, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService, Profile } from '../shared/utils/authenticationService';
import { AddRequestConfirmationModalComponent } from '../shared/ui/add-request-confirmation/add-request-confirmation-modal.component';
import { MatDialog } from '@angular/material/dialog';
import { AddRequestErrorModalComponent } from '../shared/ui/add-request-error/add-request-error-modal.component';
import { EditProfileModalComponent } from './ui/edit-profile-modal/edit-profile-modal.component';

@Component({
  selector: 'dl-profile',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './profile.component.html',
})
export class ProfileComponent {
  public expanded = false;
  public profileImageLink: string | undefined;
  public initials: string = '';
  public profile: object | any = {};
  public displayDate: string = '';

  constructor(
    private cd: ChangeDetectorRef,
    private authService: AuthService,
    private dialog: MatDialog
  ) {}

  ngOnInit() {
    this.authService.$profile.subscribe((profile) => {
      if (!profile) return;
      this.profile = profile;
      this.profileImageLink = profile?.photo_url;
      this.initials =
        (profile?.name_first?.charAt(0) || '') +
        (profile?.name_last?.charAt(0) || '');
      this.cd.markForCheck();
    });
  }

  toggleExpand() {
    if (this.profileImageLink) this.expanded = !this.expanded;
    else this.selectImage();
  }

  selectImage() {
    console.log('select image');
  }

  update(property: string) {
    const dialogRef = this.dialog.open(EditProfileModalComponent, {
      data: {
        property,
        value: this.profile[property],
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.dialog.open(AddRequestConfirmationModalComponent, {
          data: {
            results: result,
            addSuccessMessage: 'Profile updated successfully!',
          },
        });
      } else if (result === false) {
        this.dialog.open(AddRequestErrorModalComponent, {
          data: {
            results: result,
            addFailureMessage: 'Error updating Profile.',
          },
        });
      }
    });
  }
}
