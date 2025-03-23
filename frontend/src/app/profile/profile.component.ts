import { ChangeDetectorRef, Component, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../shared/utils/authenticationService';
import { EditProfileModalComponent } from './ui/edit-profile-modal/edit-profile-modal.component';
import { ImageCropperModule } from 'ngx-image-cropper';
import { EditPhotoModalComponent } from './ui/edit-photo-modal/edit-photo-modal.component';
import { ConfirmationModalComponent } from '../shared/ui/confirmation-modal/confirmation-modal.component';
import { Router } from '@angular/router';
import { DeleteProfileModalComponent } from './ui/delete-profile-modal/delete-profile-modal.component';
import { Browser } from '@capacitor/browser';
import { ModalService } from '../shared/utils/modalService';
import { StylesService } from '../shared/utils/stylesService';
import { ImageFromCDN } from 'src/app/shared/utils/imageFromCDN.pipe';
import { ExtraStuffService } from '../shared/utils/extraStuffService';

@Component({
  selector: 'dl-profile',
  standalone: true,
  imports: [CommonModule, ImageCropperModule, ImageFromCDN],
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
    private authService: AuthService,
    private router: Router,
    private modalService: ModalService,
    private stylesService: StylesService,
    public extraStuffService: ExtraStuffService
  ) {
    effect(() => {
      const profile = this.authService.profile();
      if (profile) {
        console.log('PROFILE', profile);
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
    const ref = this.modalService.open(
      EditProfileModalComponent,
      {
        data: {
          property,
          value: this.profile[property],
        },
      },
      1,
      false,
      'EditProfileModalComponent'
    );

    if (ref) {
      ref.afterClosed().subscribe((result) => {
        if (result === 'cancel' || !result) return;
        if (result === 'success') {
          this.modalService.open(
            ConfirmationModalComponent,
            {
              data: {
                confirmationMessage: 'Profile updated successfully!',
              },
            },
            1,
            true,
            'ConfirmationModalComponent'
          );
        }
      });
    } else {
    }
  }

  updatePhoto() {
    const ref = this.modalService.open(
      EditPhotoModalComponent,
      {
        data: {
          currentPhotoURL: this.profile.photo_url,
        },
        width: '70%',
      },
      1,
      false,
      'EditPhotoModalComponent'
    );

    if (ref) {
      ref.afterClosed().subscribe((result) => {
        if (result === 'cancel' || !result) {
          return;
        }
        if (result === 'success') {
          this.modalService.open(
            ConfirmationModalComponent,
            {
              data: {
                confirmationMessage: 'Profile photo updated successfully!',
              },
            },
            1,
            true,
            'ConfirmationModalComponent'
          );
          // wait 10 seconds, then refresh profile
          setTimeout(() => {
            this.authService.refreshProfile();
          }, 10000);
        }
      });
    } else {
    }
  }

  onPrivacyClick() {
    this.router.navigate(['/privacy']);
  }

  onHelpClick() {
    // external naviegation to "help.doughly.co"
    Browser.open({ url: 'https://help.doughly.co' });
  }

  onDeleteAccountClick() {
    const ref = this.modalService.open(
      DeleteProfileModalComponent,
      {
        data: {
          isFinal: false,
          userID: this.profile.user_id,
        },
      },
      1,
      false,
      'DeleteProfileModalComponent'
    );

    if (ref) {
      ref.afterClosed().subscribe((result) => {
        if (result === 'confirm') {
          this.modalService.open(
            DeleteProfileModalComponent,
            {
              data: {
                isFinal: true,
                userID: this.profile.user_id,
              },
            },
            2,
            false,
            'DeleteProfileModalComponent'
          );
        }
      });
    } else {
    }
  }

  getFillColor(index: number): string {
    const darkMode = this.authService.profile()?.darkMode;
    // also get current system pref using a service using DarkMode
    const systemDarkMode = this.extraStuffService.systemDarkMode();

    const useDarkMode =
      darkMode === 'Enabled' ||
      (darkMode === 'System Default' && systemDarkMode);
    switch (index) {
      case 1:
        return useDarkMode
          ? this.stylesService.getHex('tan-9')
          : this.stylesService.getHex('tan-3');
      default:
        return useDarkMode
          ? this.stylesService.getHex('tan-4')
          : this.stylesService.getHex('tan-6');
    }
  }
}
