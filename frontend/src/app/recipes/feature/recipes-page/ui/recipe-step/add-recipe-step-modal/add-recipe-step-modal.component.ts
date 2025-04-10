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
import {
  Observable,
  Subject,
  Subscription,
  forkJoin,
  switchMap,
  takeUntil,
} from 'rxjs';
import {
  MAT_DIALOG_DATA,
  MatDialogRef,
} from '@angular/material/dialog';
import { Store } from '@ngrx/store';
import {
  selectAdding,
  selectLoading,
  selectStepByID,
} from 'src/app/recipes/state/step/step-selectors';
import {
  selectAddingRecipeStep,
  selectLoadingRecipeStep,
  selectRecipeStepsByID,
} from 'src/app/recipes/state/recipe-step/recipe-step-selectors';
import { PhotoService } from 'src/app/shared/utils/photoService';
import { ImageCropperModule, ImageCroppedEvent } from 'ngx-image-cropper';
import { TextInputComponent } from 'src/app/shared/ui/text-input/text-input.component';
import { SelectInputComponent } from 'src/app/shared/ui/select-input/select-input.component';

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
    TextInputComponent,
    SelectInputComponent,
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

  private unsubscribe$ = new Subject<void>();

  private steps: any[] = [];

  //photo upload
  photoURL!: string;
  public recipeImageBase64: any = '';
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
    private store: Store,
    private photoUploadService: PhotoService
  ) {
    this.isAddingStep$ = this.store.select(selectAdding);
    this.isAddingRecipeStep$ = this.store.select(selectAddingRecipeStep);
    this.isLoadingStep$ = this.store.select(selectLoading);
    this.isLoadingRecipeStep$ = this.store.select(selectLoadingRecipeStep);
    this.setForm();
  }

  ngOnInit() {
    this.store
      .select(selectRecipeStepsByID(this.data.recipeID))
      .pipe(
        switchMap((recipeSteps) => {
          const stepObservables = recipeSteps.map((recipeStep) =>
            this.store.select(selectStepByID(recipeStep.stepID))
          );
          return forkJoin(stepObservables);
        }),
        takeUntil(this.unsubscribe$)
      )
      .subscribe((stepsForRecipe) => {
        this.steps = stepsForRecipe;
      });
  }

  setForm() {
    this.form = this.fb.group({
      title: ['', [Validators.required, this.titleValidator()]],
      description: ['', Validators.required],
      photoURL: [null],
    });
  }

  titleValidator(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } | null => {
      const title = control.value;
      if (this.steps && this.steps.length > 0) {
        const step = this.steps.find((step) => step.title === title);
        return step ? { titleExists: true } : null;
      }
      return null;
    };
  }

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

  async uploadCroppedImage() {
    if (this.croppedImage && this.selectedFile) {
      try {
        const url: string = await this.photoUploadService
          .getPreSignedPostUrl(
            'recipeStep',
            this.selectedFile.name,
            this.selectedFile.type
          )
          .toPromise();

        const uploadResponseUrl = await this.photoUploadService.uploadFileToS3(
          url,
          this.croppedImage
        );

        this.photoURL = uploadResponseUrl;
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
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }
}
