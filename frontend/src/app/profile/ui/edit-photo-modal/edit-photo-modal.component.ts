import { Component, Inject } from '@angular/core';
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
    private fb: FormBuilder,
    private photoService: PhotoService,
    private authService: AuthService,
    public dialogRef: MatDialogRef<EditPhotoModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.setForm();
  }

  ngOnInit() {
    //update photoURL if it exists on auth service
    this.authService.$profile.subscribe((profile) => {
      if (!profile) return;
      this.photoURL = profile?.photo_url;
    });
  }

  setForm() {
    this.form = this.fb.group({});
  }

  //photo selection/cropping
  profileOnFileSelected(event: Event): void {
    console.log('here');
    this.profileImageChangedEvent = event; // For the cropping UI
    this.selectedFile = (event.target as HTMLInputElement).files?.[0] || null;
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
          .getPreSignedPostUrl(this.selectedFile.name, this.selectedFile.type)
          .toPromise();

        const uploadResponse = await this.photoService.uploadFileToS3(
          url,
          this.croppedImage
        );

        this.newPhotoURL = uploadResponse.url.split('?')[0];
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
        this.dialogRef.close({ error: error })
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
