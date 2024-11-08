import { Component, Inject } from '@angular/core';
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
import { Observable, Subject, combineLatest, switchMap, takeUntil } from 'rxjs';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Store } from '@ngrx/store';
import { PhotoService } from 'src/app/shared/utils/photoService';
import { ImageCropperModule, ImageCroppedEvent } from 'ngx-image-cropper';
import { selectStepByID } from 'src/app/recipes/state/step/step-selectors';
import {
  selectRecipeStepByID,
  selectRecipeStepsByID,
} from 'src/app/recipes/state/recipe-step/recipe-step-selectors';
import { TextInputComponent } from 'src/app/shared/ui/text-input/text-input.component';
import { AnimationOptions } from 'ngx-lottie';

@Component({
  selector: 'dl-edit-recipe-step-modal',
  standalone: true,
  imports: [
    CommonModule,
    MatProgressSpinnerModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    ImageCropperModule,
    TextInputComponent,
  ],
  templateUrl: './edit-recipe-step-modal.component.html',
})
export class EditRecipeStepModalComponent {
  form!: FormGroup;
  isUploadingPhoto: boolean = false;
  private steps: any[] = [];

  private unsubscribe$ = new Subject<void>();

  //photo upload
  public recipeImageBase64: any = '';
  public croppedImage: any = '';
  public selectedFile: File | null = null;
  public isImageLoaded: boolean = false;
  public isCropperReady: boolean = false;
  public imageLoadFailed: boolean = false;
  public imagePresent: boolean = false;
  public photoURL?: string = '';
  public photo: any;
  newPhotoURL!: string;
  dragToReorder: string = '';
  animationOptions: AnimationOptions = {
    path: '',
    loop: true,
    autoplay: false,
  };

  constructor(
    private fb: FormBuilder,
    private store: Store,
    private photoService: PhotoService,
    public dialogRef: MatDialogRef<EditRecipeStepModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.setForm();
  }

  ngOnInit(): void {
    this.store
      .select(selectRecipeStepsByID(this.data.recipeID))
      .pipe(
        takeUntil(this.unsubscribe$),
        switchMap((recipeSteps) => {
          const stepObservables = recipeSteps.map((recipeStep) =>
            this.store.select(selectStepByID(recipeStep.stepID))
          );
          return combineLatest(stepObservables);
        })
      )
      .subscribe((stepsForRecipe) => {
        this.steps = stepsForRecipe;
      });

    //retrieve recipeStep from store to get 'photoURL'
    const storeRecipeStep = this.store.select(
      selectRecipeStepByID(this.data.recipeStepID)
    );
    storeRecipeStep
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((recipeStep) => {
        if (recipeStep) {
          this.photoURL = recipeStep.photoURL;
        }
      });

    this.setAnimationPath();
  }

  setForm() {
    this.form = this.fb.group({
      title: [this.data.title, [Validators.required, this.titleValidator()]],
      description: [this.data.description, Validators.required],
      // newPhotoURL: [null],
    });
  }

  setAnimationPath() {
    if (!document.body.classList.contains('dark')) {
      this.dragToReorder = '/assets/animations/lottie/dragToReorder-light.json';
    } else {
      this.dragToReorder = '/assets/animations/lottie/dragToReorder-dark.json';
    }
    this.updateAnimationOptions();
  }

  updateAnimationOptions() {
    this.animationOptions = {
      ...this.animationOptions,
      path: this.dragToReorder,
    };
  }

  titleValidator(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } | null => {
      const title = control.value;

      // Check if the title is the same as the original title
      if (title === this.data.title) {
        return null;
      }

      if (this.steps && this.steps.length > 0) {
        const titleExists = this.steps.some((step) => step.title === title);
        if (titleExists) {
          return { titleExists: true };
        }
      }
      return null;
    };
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
    const file = new File([blob], `recipeStepImage_${Date.now()}`, {
      type: 'image/jpeg',
    });
    this.selectedFile = file;
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
  deleteImage(): Observable<any> {
    return this.photoService.deleteFileFromS3(
      this.photoURL!,
      'recipeStep',
      this.data.recipeStepID
    );
  }
  async replaceImage() {
    if (this.croppedImage && this.selectedFile) {
      this.isUploadingPhoto = true; // set the flag to true at the start
      try {
        if (this.photoURL) {
          // wait for delete operation to complete
          const result = await this.deleteImage().toPromise();
          if (result.data) {
            // this.store.dispatch(
            //   RecipeStepActions.loadRecipeStep(this.data.recipeStepID)
            // );
          }
        }
        // proceed with upload
        await this.uploadCroppedImage();
      } catch (error) {
        console.log('Error replacing image:', error);
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
            'recipeStep',
            this.selectedFile.name,
            this.selectedFile.type
          )
          .toPromise();

        const uploadResponseUrl = await this.photoService.uploadFileToS3(
          url,
          this.croppedImage
        );

        this.newPhotoURL = uploadResponseUrl;
        this.isUploadingPhoto = false;
      } catch (error) {
        console.log('Error Uploading new image:', error);
      }
    }
  }

  async onSubmit() {
    const newRecipeStep = {
      ...this.form.value,
      photoURL: this.data.photoURL,
    };
    //first replace the image if necessary
    if (this.croppedImage && this.selectedFile) {
      await this.replaceImage();
      newRecipeStep.photoURL = this.newPhotoURL;
    }
    this.dialogRef.close(newRecipeStep);
  }

  ngOnDestroy() {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  onCancel() {
    this.dialogRef.close('cancel');
  }
}
