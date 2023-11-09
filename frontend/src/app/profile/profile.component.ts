import { ChangeDetectorRef, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService, Profile } from '../shared/utils/authenticationService';
import { AddRequestConfirmationModalComponent } from '../shared/ui/add-request-confirmation/add-request-confirmation-modal.component';
import { MatDialog } from '@angular/material/dialog';
import { AddRequestErrorModalComponent } from '../shared/ui/add-request-error/add-request-error-modal.component';
import { EditProfileModalComponent } from './ui/edit-profile-modal/edit-profile-modal.component';
import { PhotoService } from '../shared/utils/photoService';
import { ImageCropperModule, ImageCroppedEvent } from 'ngx-image-cropper';
import { Observable } from 'rxjs';
import { Store } from '@ngrx/store';
import { EditPhotoModalComponent } from './ui/edit-photo-modal/edit-photo-modal.component';

@Component({
  selector: 'dl-profile',
  standalone: true,
  imports: [CommonModule, ImageCropperModule],
  templateUrl: './profile.component.html',
})
export class ProfileComponent {
  public expanded = false;
  public profileImageLink: string | undefined;
  public initials: string = '';
  public profile: object | any = {};
  public displayDate: string = '';

  //photo upload
  isUploadingPhoto: boolean = false;
  public profileImageChangedEvent: any = '';
  public croppedImage: any = '';
  public selectedFile: File | null = null;
  public isImageLoaded: boolean = false;
  public isCropperReady: boolean = false;
  public imageLoadFailed: boolean = false;
  public imagePresent: boolean = false;
  public photoURL?: string = '';
  public photo: any;
  public isChecked!: boolean;
  newPhotoURL!: string;

  constructor(
    private cd: ChangeDetectorRef,
    private store: Store,
    private authService: AuthService,
    private dialog: MatDialog,
    private photoService: PhotoService
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

  updateProfile(property: string) {
    const dialogRef = this.dialog.open(EditProfileModalComponent, {
      data: {
        property,
        value: this.profile[property],
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result === 'cancel' || !result) return;
      if (result?.error) {
        this.dialog.open(AddRequestErrorModalComponent, {
          data: {
            results: result,
            addFailureMessage: `Error updating Profile: ${result.error}`,
          },
        });
      } else if (result === 'success') {
        this.dialog.open(AddRequestConfirmationModalComponent, {
          data: {
            results: result,
            addSuccessMessage: 'Profile updated successfully!',
          },
        });
      }
    });
  }

  updatePhoto() {
    const dialogRef = this.dialog.open(EditPhotoModalComponent, {
      data: {
        currentPhotoURL: this.profile.photo_url,
      }
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result === 'cancel' || !result)
      if (result?.error) {
        this.dialog.open(AddRequestErrorModalComponent, {
          data: {
            results: result,
            addFailureMessage: `Error updating Profile photo: ${result.error}`,
          },
        });
      } else if (result === 'success') {
        this.dialog.open(AddRequestConfirmationModalComponent, {
          data: {
            results: result,
            addSuccessMessage: 'Profile photo updated successfully!',
          },
        });
      }
    });
  }

}
