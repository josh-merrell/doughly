import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { Observable, Subscription } from 'rxjs';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogRef,
} from '@angular/material/dialog';
import { Store } from '@ngrx/store';
import { AddRequestConfirmationModalComponent } from 'src/app/shared/ui/add-request-confirmation/add-request-confirmation-modal.component';
import { AddRequestErrorModalComponent } from 'src/app/shared/ui/add-request-error/add-request-error-modal.component';
import {
  selectAdding,
  selectLoading,
} from 'src/app/recipes/state/step/step-selectors';
import {
  selectAddingRecipeStep,
  selectLoadingRecipeStep,
} from 'src/app/recipes/state/recipe-step/recipe-step-selectors';
import { PhotoService } from 'src/app/shared/utils/photoService';
import { ImageCropperModule, ImageCroppedEvent } from 'ngx-image-cropper';

@Component({
  selector: 'dl-add-recipe-step-modal',
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
  templateUrl: './add-recipe-step-modal.component.html',
})
export class AddRecipeStepModalComponent {
  form!: FormGroup;
  isAddingStep$: Observable<boolean>;
  isAddingRecipeStep$: Observable<boolean>;
  isLoadingStep$: Observable<boolean>;
  isLoadingRecipeStep$: Observable<boolean>;
  private addingSubscription!: Subscription;

  //photo upload
  photoURL!: string;
  public stepImageChangedEvent: any = '';
  public croppedImage: any = '';
  public selectedFile: File | null = null;
  public isImageLoaded: boolean = false;
  public isCropperReady: boolean = false;
  public imageLoadFailed: boolean = false;
  public imagePresent: boolean = false;

  constructor(
    public dialogRef: MatDialogRef<AddRecipeStepModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private fb: FormBuilder,
    private dialog: MatDialog,
    private store: Store,
    private photoUploadService: PhotoService
  ) {
    this.isAddingStep$ = this.store.select(selectAdding);
    this.isAddingRecipeStep$ = this.store.select(selectAddingRecipeStep);
    this.isLoadingStep$ = this.store.select(selectLoading);
    this.isLoadingRecipeStep$ = this.store.select(selectLoadingRecipeStep);
    this.setForm();
  }

  setForm() {
    this.form = this.fb.group({
      title: ['', Validators.required],
      description: ['', Validators.required],
      photoURL: [null],
    });
  }

  stepOnFileSelected(event: Event): void {
    this.stepImageChangedEvent = event; // For the cropping UI
    this.selectedFile = (event.target as HTMLInputElement).files?.[0] || null;
  }

  stepImageCropped(event: ImageCroppedEvent) {
    this.croppedImage = event.blob;
    this.imagePresent = true;
  }

  stepImageLoaded() {
    this.isImageLoaded = true;
  }

  stepCropperReady() {
    this.isCropperReady = true;
  }

  stepLoadImageFailed() {
    this.imageLoadFailed = true;
  }

  async uploadCroppedImage() {
    if (this.croppedImage && this.selectedFile) {
      try {
        const url: string = await this.photoUploadService
          .getPreSignedUrl(this.selectedFile.name, this.selectedFile.type)
          .toPromise();

        const uploadResponse = await this.photoUploadService.uploadFileToS3(
          url,
          this.croppedImage
        );
        console.log('Upload Successful:', uploadResponse.url);

        this.photoURL = uploadResponse.url.split('?')[0];
      } catch (error) {
        console.log('An error occurred:', error);
      }
    }
  }

  async onSubmit() {
    //first upload the cropped image
    await this.uploadCroppedImage();
    const newRecipeStep = {
      ...this.form.value,
      photoURL: this.photoURL,
    };
    this.dialogRef.close(newRecipeStep);
  }

  onCancel() {
    this.dialogRef.close('cancel');
  }

  ngOnDestroy() {
    if (this.addingSubscription) {
      this.addingSubscription.unsubscribe();
    }
  }
}
