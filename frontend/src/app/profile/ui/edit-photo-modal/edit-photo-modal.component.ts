import { Component, Inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Camera, CameraResultType } from '@capacitor/camera';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { PhotoService } from 'src/app/shared/utils/photoService';
import { ImageCropperModule, ImageCroppedEvent } from 'ngx-image-cropper';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { AuthService } from 'src/app/shared/utils/authenticationService';

@Component({
  selector: 'dl-edit-photo-modal',
  standalone: true,
  imports: [
    CommonModule,
    MatProgressSpinnerModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    ImageCropperModule,
  ],
  templateUrl: './edit-photo-modal.component.html',
})
export class EditPhotoModalComponent {
  form!: FormGroup;

  //photo upload
  isUploadingPhoto: boolean = false;
  public recipeImageBase64: any = '';
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
    private fb: FormBuilder,
    private photoService: PhotoService,
    private authService: AuthService,
    public dialogRef: MatDialogRef<EditPhotoModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.setForm();

    effect(() => {
      const profile = this.authService.profile();
      if (profile && profile.photo_url) {
        this.photoURL = profile.photo_url;
      }
    });
  }

  setForm() {
    this.form = this.fb.group({});
  }

  //photo selection/cropping
  async selectImage() {
    const image = await Camera.getPhoto({
      quality: 100,
      allowEditing: false,
      resultType: CameraResultType.Base64,
    });

    this.recipeImageBase64 = `data:image/jpeg;base64,${image.base64String}`;
    this.croppedImage = null;

    // get file from base64 string so we can update 'selectedFile'
    const base64Response = await fetch(this.recipeImageBase64);
    const blob = await base64Response.blob();
    const file = new File([blob], `profileImage_${Date.now()}`, {
      type: 'image/jpeg',
    });
    this.selectedFile = file;
  }
  profileImageCropped(event: ImageCroppedEvent) {
    this.croppedImage = event.blob;
    this.imagePresent = true;
  }
  profileImageLoaded() {
    this.isImageLoaded = true;
  }
  profileCropperReady() {
    this.isCropperReady = true;
  }
  profileLoadImageFailed() {
    this.imageLoadFailed = true;
  }
  profileDeleteImage(): Observable<any> {
    return this.photoService.deleteFileFromS3(this.photoURL!, 'profile');
  }
  async replaceImage() {
    if (this.croppedImage && this.selectedFile) {
      this.isUploadingPhoto = true; // set the flag to true at the start
      try {
        if (this.photoURL) {
          // wait for delete operation to complete
          const result = await this.profileDeleteImage().toPromise();
          if (result.data) {
            //set 'photo_url' to null in profile state via profile Service
            this.authService.updateField('photo_url', null).subscribe({
              next: (result) => {
                console.log(`SET PHOTO_URL TO NULL: ${result}`);
              },
              error: (error) => {
                console.log(`ERROR SETTING PHOTO_URL TO NULL: ${error}`);
              },
            });
          }
        }
        // proceed with upload
        await this.uploadCroppedImage();
      } catch (error) {
        console.log('Error replacing profile image:', error);
      } finally {
        // reset the flag in either case (success/failure)
        this.isUploadingPhoto = false;
      }
    }
  }
  async uploadCroppedImage() {
    if (this.croppedImage && this.selectedFile) {
      try {
        const url: string = await this.photoService
          .getPreSignedPostUrl(
            'profile',
            this.selectedFile.name,
            this.selectedFile.type
          )
          .toPromise();

        const uploadResponseUrl = await this.photoService.uploadFileToS3(
          url,
          this.croppedImage
        );

        this.newPhotoURL = uploadResponseUrl;
        //set 'photo_url' to newPhotoURL in profile state via profile Service
        this.authService.updateField('photo_url', this.newPhotoURL).subscribe({
          next: (result) => {
            console.log(`SET PHOTO_URL TO ${this.newPhotoURL}: ${result}`);
          },
          error: (error) => {
            console.log(
              `ERROR SETTING PHOTO_URL TO ${this.newPhotoURL}: ${error}`
            );
          },
        });
        this.isUploadingPhoto = false;
      } catch (error) {
        console.log('Error Uploading new image:', error);
        this.dialogRef.close({ error: error });
      }
    }
  }

  async onSubmit() {
    if (this.croppedImage && this.selectedFile) {
      await this.replaceImage();
    }
    this.dialogRef.close('success');
  }

  onCancel() {
    this.dialogRef.close('cancel');
  }
}
