import {
  ChangeDetectorRef,
  Component,
  WritableSignal,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../shared/utils/authenticationService';
import { MatDialog } from '@angular/material/dialog';
import { EditProfileModalComponent } from './ui/edit-profile-modal/edit-profile-modal.component';
import { PhotoService } from '../shared/utils/photoService';
import { ImageCropperModule } from 'ngx-image-cropper';
import { Store } from '@ngrx/store';
import { EditPhotoModalComponent } from './ui/edit-photo-modal/edit-photo-modal.component';
import { ConfirmationModalComponent } from '../shared/ui/confirmation-modal/confirmation-modal.component';
import { Router } from '@angular/router';
import { DeleteProfileModalComponent } from './ui/delete-profile-modal/delete-profile-modal.component';
import { Browser } from '@capacitor/browser';

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
    private photoService: PhotoService,
    private router: Router
  ) {
    effect(() => {
      const profile = this.authService.profile();
      if (profile) {
        console.log('profile', profile);
        this.profile = profile;
        this.profileImageLink = profile?.photo_url;
        this.initials =
          (profile?.name_first?.charAt(0) || '') +
          (profile?.name_last?.charAt(0) || '');
        this.cd.markForCheck();
      }
    });
  }

  ngOnInit(): void {
    // Check the initial URL
    this.checkUrlAndAct(this.router.url);
  }

  private checkUrlAndAct(fullUrl: string) {
    if (fullUrl.includes('/delete')) {
      this.onDeleteAccountClick();
    }
    // Any other URL checks can be added here
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
      if (result === 'success') {
        this.dialog.open(ConfirmationModalComponent, {
          data: {
            confirmationMessage: 'Profile updated successfully!',
          },
        });
      }
    });
  }

  updatePhoto() {
    const dialogRef = this.dialog.open(EditPhotoModalComponent, {
      data: {
        currentPhotoURL: this.profile.photo_url,
      },
      width: '70%',
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result === 'cancel' || !result)
        if (result === 'success') {
          this.dialog.open(ConfirmationModalComponent, {
            data: {
              confirmationMessage: 'Profile photo updated successfully!',
            },
          });
        }
    });
  }

  onPrivacyClick() {
    this.router.navigate(['/privacy']);
  }

  onHelpClick() {
    // external naviegation to "help.doughly.co"
    Browser.open({ url: 'https://help.doughly.co' });
  }

  onDeleteAccountClick() {
    const dialogRef = this.dialog.open(DeleteProfileModalComponent, {
      data: {
        isFinal: false,
        userID: this.profile.user_id,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result === 'confirm') {
        this.dialog.open(DeleteProfileModalComponent, {
          data: {
            isFinal: true,
            userID: this.profile.user_id,
          },
        });
      }
    });
  }
}
