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
import {
  Observable,
  Subject,
  combineLatest,
  switchMap,
  takeUntil,
} from 'rxjs';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Store } from '@ngrx/store';
import { selectStepByID } from 'src/app/recipes/state/step/step-selectors';
import {
  selectRecipeStepByID,
  selectRecipeStepsByID,
} from 'src/app/recipes/state/recipe-step/recipe-step-selectors';
import { PhotoService } from 'src/app/shared/utils/photoService';
import { ImageCropperModule, ImageCroppedEvent } from 'ngx-image-cropper';
import { RecipeStepActions } from 'src/app/recipes/state/recipe-step/recipe-step-actions';

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
  ],
  templateUrl: './edit-recipe-step-modal.component.html',
})
export class EditRecipeStepModalComponent {
  form!: FormGroup;
  isUploadingPhoto: boolean = false;
  private steps: any[] = [];

  private unsubscribe$ = new Subject<void>();
  //photo upload
  public stepImageChangedEvent: any = '';
  public croppedImage: any = '';
  public selectedFile: File | null = null;
  public isImageLoaded: boolean = false;
  public isCropperReady: boolean = false;
  public imageLoadFailed: boolean = false;
  public imagePresent: boolean = false;
  public photoURL?: string = '';
  public photo: any;
  newPhotoURL!: string;

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
  }

  setForm() {
    this.form = this.fb.group({
      title: [this.data.title, [Validators.required, this.titleValidator()]],
      description: [this.data.description, Validators.required],
      // newPhotoURL: [null],
    });
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

  deleteImage(): Observable<any> {
    return this.photoService.deleteFileFromS3(this.photoURL!, 'recipeStep', this.data.recipeStepID);
  }

  async replaceImage() {
    if (this.croppedImage && this.selectedFile) {
      this.isUploadingPhoto = true; // set the flag to true at the start

      try {
        if (this.photoURL) {
          // wait for delete operation to complete
          const result = await this.deleteImage().toPromise();
          if (result.data) {
            this.store.dispatch(RecipeStepActions.loadRecipeStep(this.data.recipeStepID));
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
          .getPreSignedPostUrl(this.selectedFile.name, this.selectedFile.type)
          .toPromise();

        const uploadResponse = await this.photoService.uploadFileToS3(
          url,
          this.croppedImage
        );

        this.newPhotoURL = uploadResponse.url.split('?')[0];
        this.isUploadingPhoto = false;
      } catch (error) {
        console.log('Error Uploading new image:', error);
      }
    }
  }

  async onSubmit() {
    console.log('onSubmit');
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
