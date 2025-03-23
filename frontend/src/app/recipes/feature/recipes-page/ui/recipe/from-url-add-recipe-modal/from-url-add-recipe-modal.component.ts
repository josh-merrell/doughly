import { CommonModule } from '@angular/common';
import { Component, WritableSignal, signal, Inject } from '@angular/core';
import { Camera, CameraResultType } from '@capacitor/camera';
import {
  MatDialog,
  MatDialogRef,
  MAT_DIALOG_DATA,
} from '@angular/material/dialog';
import { TextInputComponent } from 'src/app/shared/ui/text-input/text-input.component';
import { MatInputModule } from '@angular/material/input';
import { Store } from '@ngrx/store';
import { NgZone } from '@angular/core';
import { PhotoService } from 'src/app/shared/utils/photoService';
import { RecipeProgressService } from 'src/app/recipes/data/recipeVisionProgress.service';
import { Observable, filter, take } from 'rxjs';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  selectAdding,
  selectError,
  selectNewRecipeID,
} from 'src/app/recipes/state/recipe/recipe-selectors';
import { ErrorModalComponent } from 'src/app/shared/ui/error-modal/error-modal.component';
import { Router } from '@angular/router';
import { ImageCropperModule, ImageCroppedEvent } from 'ngx-image-cropper';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RecipeActions } from 'src/app/recipes/state/recipe/recipe-actions';
import { MatFormFieldModule } from '@angular/material/form-field';
import { AuthService } from 'src/app/shared/utils/authenticationService';
import { ModalService } from 'src/app/shared/utils/modalService';
import { AnimationOptions, LottieComponent } from 'ngx-lottie';
import { AnimationItem } from 'lottie-web';
import { RedirectPathService } from 'src/app/shared/utils/redirect-path.service';

@Component({
  selector: 'dl-from-url-add-recipe-modal',
  standalone: true,
  imports: [
    CommonModule,
    ImageCropperModule,
    MatProgressSpinnerModule,
    MatInputModule,
    MatFormFieldModule,
    ReactiveFormsModule,
    TextInputComponent,
    LottieComponent,
  ],
  templateUrl: './from-url-add-recipe-modal.component.html',
})
export class FromUrlAddRecipeModalComponent {
  form!: FormGroup;
  isAdding: boolean = false;
  statusMessage: WritableSignal<string> = signal('');
  promptMessage: WritableSignal<string> = signal(
    'Paste the URL of the recipe you wish to add to your collection. Optionally, choose a photo of the completed dish.'
  );
  private profile: WritableSignal<any> = this.authService.profile;

  // Lottie animation
  private animationItem: AnimationItem | undefined;
  animationOptions: AnimationOptions = {
    path: '/assets/animations/lottie/constructingRecipe.json',
    loop: true,
    autoplay: true,
  };
  lottieStyles = {
    position: 'absolute',
    right: '0',
    top: '0',
    height: '40px',
    width: '40px',
  };

  // recipe photo upload
  photoURL!: string;
  public recipeImageBase64: any = '';
  public croppedImage: any = '';
  public selectedFile: File | null = null;
  public isImageLoaded: boolean = false;
  public isCropperReady: boolean = false;
  public imageLoadFailed: boolean = false;
  public imagePresent: boolean = false;
  public isChecked = true;
  public sharedUrl: string = '';

  constructor(
    @Inject(MAT_DIALOG_DATA)
    public data: { sharedUrl: string },
    public dialogRef: MatDialogRef<FromUrlAddRecipeModalComponent>,
    private photoUploadService: PhotoService,
    public dialog: MatDialog,
    public store: Store,
    public recipeProgressService: RecipeProgressService,
    private ngZone: NgZone,
    private router: Router,
    private fb: FormBuilder,
    private authService: AuthService,
    private modalService: ModalService,
    private redirectPathService: RedirectPathService
  ) {}

  // for recipe photo
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
    const file = new File([blob], `recipeImage_${Date.now()}`, {
      type: 'image/jpeg',
    });
    this.selectedFile = file;
  }
  recipeImageCropped(event: ImageCroppedEvent) {
    this.croppedImage = event.blob;
    this.imagePresent = true;
  }
  recipeImageLoaded() {
    this.isImageLoaded = true;
  }
  recipeCropperReady() {
    this.isCropperReady = true;
  }
  recipeLoadImageFailed() {
    this.imageLoadFailed = true;
  }

  animationCreated(animationItem: AnimationItem): void {
    this.animationItem = animationItem;
    this.animationItem.setSpeed(1.0);
  }
  loopComplete(): void {
    // this.animationItem?.pause();
  }

  async uploadCroppedImage() {
    if (this.croppedImage) {
      try {
        const type = 'recipe';
        const url: string = await this.photoUploadService
          .getPreSignedPostUrl(
            type,
            this.selectedFile!.name,
            this.selectedFile!.type
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

  deleteFile(url: string, type: string): Observable<any> {
    return this.photoUploadService.deleteFileFromS3(url, type);
  }

  async removeFiles(removeRecipePhoto: boolean = false) {
    if (this.photoURL && removeRecipePhoto) {
      const result = await this.deleteFile(this.photoURL, 'recipe').toPromise();
      console.log(`deleted recipe photo: ${result}`);
    }
  }

  ngOnInit(): void {
    if (this.data?.sharedUrl) {
      this.promptMessage.set(
        "We'll import the recipe from the URL you shared if present. Optionally, choose a photo of the completed dish before starting!"
      );
    }
    this.setForm();
    // this.redirectPathService.setTargetModal(''); // reset target modal now that we're at a terminal modal
  }

  setForm() {
    this.form = this.fb.group({
      sourceURL: [this.data?.sharedUrl || '', [Validators.required]],
    });
  }

  async onSubmit() {
    this.isAdding = true;
    this.statusMessage.set('Getting Recipe Details');
    //if recipe photo is present, upload it
    if (this.selectedFile) {
      await this.uploadCroppedImage();
    }

    try {
      this.redirectPathService.sharedUrl.set('');
      this.redirectPathService.resetPath();
      // Start listening for recipe vision progress
      this.recipeProgressService.startListening().subscribe({
        next: (message) => {
          this.ngZone.run(() => {
            if (message === 'done') {
              this.recipeProgressService.stopListening();
            } else {
              this.statusMessage.set(JSON.parse(message).message);
            }
          });
        },
        error: (error) => {
          this.recipeProgressService.stopListening();
          console.log(error);
        },
      });

      // Start the recipe Add process
      this.store.dispatch(
        RecipeActions.UrlAddRecipe({
          recipeURL: this.form.value.sourceURL,
          recipePhotoURL: this.photoURL,
          reviewAIIngredients: this.profile().reviewAIIngredients || false,
        })
      );
      this.store
        .select(selectAdding)
        .pipe(
          filter((adding) => !adding),
          take(1)
        )
        .subscribe(() => {
          this.store
            .select(selectError)
            .pipe(take(1))
            .subscribe((error) => {
              if (error) {
                this.recipeProgressService.stopListening();
                console.error('Error when adding recipe via URL:', error);
                // remove the recipe photo if it was uploaded
                this.removeFiles(true);
                // show error modal
                this.modalService.open(
                  ErrorModalComponent,
                  {
                    maxWidth: '380px',
                    data: {
                      errorMessage: `We couldn't add a recipe using that link. Make sure that web page has all details of a recipe and try again.`,
                      statusCode: error.statusCode,
                    },
                  },
                  3,
                  true,
                  'ErrorModalComponent'
                );
              } else {
                this.removeFiles(false);
                this.recipeProgressService.stopListening();
                // reduce AI Token count by 1
                this.authService.updateField(
                  'permAITokenCount',
                  `${this.profile().permAITokenCount - 1}`
                );
                this.store
                  .select(selectNewRecipeID)
                  .subscribe((newRecipeID) => {
                    if (!newRecipeID) {
                      this.dialogRef.close('success');
                    } else {
                      this.router.navigate(['/recipe', newRecipeID.recipeID]);
                      this.modalService.closeAll();
                    }
                  });
              }
              this.isAdding = false;
            });
        });
    } catch (error) {
      console.log('Error when adding recipe via URL:', error);
      this.isAdding = false;
      this.removeFiles(true);
    }
  }

  onCancel() {
    this.removeFiles(true);
    this.dialogRef.close('cancel');
  }

  ngOnDestroy() {
    this.removeFiles(true);
    this.recipeProgressService.stopListening();
    this.redirectPathService.sharedUrl.set('');
    this.redirectPathService.resetPath();
  }
}
