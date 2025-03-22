import { CommonModule } from '@angular/common';
import { Component, WritableSignal, effect, signal } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Camera, CameraResultType } from '@capacitor/camera';
import { Store } from '@ngrx/store';
import { NgZone } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { PhotoService } from 'src/app/shared/utils/photoService';
import { RecipeActions } from 'src/app/recipes/state/recipe/recipe-actions';
import { RecipeProgressService } from 'src/app/recipes/data/recipeVisionProgress.service';
import { Observable, filter, take } from 'rxjs';
import { VisionAddExampleModalComponent } from 'src/app/recipes/feature/recipes-page/ui/recipe/vision-add-example-modal/vision-add-example-modal.component';
import {
  selectAdding,
  selectError,
  selectNewRecipeID,
} from 'src/app/recipes/state/recipe/recipe-selectors';
import { ErrorModalComponent } from 'src/app/shared/ui/error-modal/error-modal.component';
import { ImageCropperModule, ImageCroppedEvent } from 'ngx-image-cropper';
import { Router } from '@angular/router';
import { StringsService } from 'src/app/shared/utils/strings';
import { selectProfile } from 'src/app/profile/state/profile-selectors';
import { ExtraStuffService } from 'src/app/shared/utils/extraStuffService';
import { AuthService } from 'src/app/shared/utils/authenticationService';
import { ModalService } from 'src/app/shared/utils/modalService';
import { ImageFromCDN } from 'src/app/shared/utils/imageFromCDN.pipe';
import { AnimationOptions, LottieComponent } from 'ngx-lottie';
import { AnimationItem } from 'lottie-web';

@Component({
  selector: 'dl-vision-add-recipe-modal',
  standalone: true,
  imports: [
    CommonModule,
    ImageCropperModule,
    MatProgressSpinnerModule,
    ImageFromCDN,
    LottieComponent,
  ],
  templateUrl: './vision-add-recipe-modal.component.html',
})
export class VisionAddRecipeModalComponent {
  isAdding: boolean = false;
  statusMessage: WritableSignal<string> = signal('Uploading Source Image');

  // source image upload
  sourceImageURL!: string;
  public sourceImageSelectedFile: File | null = null;
  public sourceImageSelectedFileUrl: string | null = null;
  public sourceImagePresent: boolean = false;

  // source image2 upload
  sourceImage2URL!: string;
  public sourceImage2SelectedFile: File | null = null;
  public sourceImage2SelectedFileUrl: string | null = null;
  public sourceImage2Present: boolean = false;

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

  // Onboarding
  // ** OLD ONBOARDING **
  // public showOnboardingBadge: WritableSignal<boolean> = signal(false);
  // public onboardingModalOpen: WritableSignal<boolean> = signal(false);
  // private reopenOnboardingModal: WritableSignal<boolean> = signal(false);

  // recipe photo upload
  public recipeImageBase64: any = '';
  photoURL!: string;
  public croppedImage: any = '';
  public selectedFile: File | null = null;
  public isImageLoaded: boolean = false;
  public isCropperReady: boolean = false;
  public imageLoadFailed: boolean = false;
  public imagePresent: boolean = false;
  public isChecked = true;
  // public profile: WritableSignal<any> = signal(null);
  public profile: object | any = {};

  constructor(
    public dialogRef: MatDialogRef<VisionAddRecipeModalComponent>,
    private photoUploadService: PhotoService,
    public dialog: MatDialog,
    public store: Store,
    public recipeProgressService: RecipeProgressService,
    private ngZone: NgZone,
    private router: Router,
    private stringsService: StringsService,
    public extraStuffService: ExtraStuffService,
    private authService: AuthService,
    private modalService: ModalService
  ) {
    effect(() => {
      const profile = this.authService.profile();
      this.profile = profile;
      console.log(`profile: `, profile);
    });
  }

  // for recipe source image
  async selectSourceImage() {
    const image = await Camera.getPhoto({
      quality: 100,
      allowEditing: false,
      resultType: CameraResultType.DataUrl,
    });
    const sourceImageBase64 = image.dataUrl;

    // get file from base64 string so we can update 'selectedFile'
    const base64Response = await fetch(sourceImageBase64!);
    const blob = await base64Response.blob();
    const file = new File([blob], `recipeSourceImage_${Date.now()}`, {
      type: 'image/jpeg',
    });
    this.sourceImagePresent = true;
    this.sourceImageSelectedFile = file;
    this.sourceImageSelectedFileUrl = sourceImageBase64!;
  }

  // for recipe source image2
  async selectSourceImage2() {
    const image = await Camera.getPhoto({
      quality: 100,
      allowEditing: false,
      resultType: CameraResultType.DataUrl,
    });
    const sourceImageBase64 = image.dataUrl;

    // get file from base64 string so we can update 'selectedFile'
    const base64Response = await fetch(sourceImageBase64!);
    const blob = await base64Response.blob();
    const file = new File([blob], `recipeSourceImage_${Date.now()}`, {
      type: 'image/jpeg',
    });
    this.sourceImage2Present = true;
    this.sourceImage2SelectedFile = file;
    this.sourceImage2SelectedFileUrl = sourceImageBase64!;
  }

  ngOnInit() {}

  animationCreated(animationItem: AnimationItem): void {
    this.animationItem = animationItem;
    this.animationItem.setSpeed(1.0);
  }
  loopComplete(): void {
    // this.animationItem?.pause();
  }

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

  async uploadCroppedImage(variableName) {
    const imageToUpload =
      variableName === 'selectedFile'
        ? this.croppedImage
        : variableName === 'sourceImageSelectedFile'
        ? this.sourceImageSelectedFile
        : this.sourceImage2SelectedFile;
    if (imageToUpload) {
      try {
        const type =
          variableName === 'sourceImageSelectedFile'
            ? 'temp'
            : 'sourceImage2SelectedFile'
            ? 'temp'
            : 'recipe';
        const url: string = await this.photoUploadService
          .getPreSignedPostUrl(
            type,
            this[variableName].name,
            this[variableName].type
          )
          .toPromise();

        const uploadResponseUrl = await this.photoUploadService.uploadFileToS3(
          url,
          imageToUpload
        );

        if (variableName === 'selectedFile') this.photoURL = uploadResponseUrl;
        else if (variableName === 'sourceImageSelectedFile') {
          this.sourceImageURL = uploadResponseUrl;
        } else {
          this.sourceImage2URL = uploadResponseUrl;
        }
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
    if (this.sourceImageURL) {
      const result = await this.deleteFile(
        this.sourceImageURL,
        'temp'
      ).toPromise();
      console.log(`deleted source Image: ${result}`);
    }
    if (this.sourceImage2URL) {
      const result = await this.deleteFile(
        this.sourceImage2URL,
        'temp'
      ).toPromise();
      console.log(`deleted source Image 2: ${result}`);
    }
  }

  async onSubmit() {
    this.isAdding = true;
    this.statusMessage.set('Uploading Source Image');
    //first upload the recipe source image to temp
    await this.uploadCroppedImage('sourceImageSelectedFile');
    //if sourceImage2 present, upload it also
    if (this.sourceImage2SelectedFile) {
      await this.uploadCroppedImage('sourceImage2SelectedFile');
    }
    //if recipe photo present, upload it also
    if (this.selectedFile) {
      await this.uploadCroppedImage('selectedFile');
    }

    try {
      // Start listening for SSE messages relating to the recipe vision progress
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
      const sourceImageURLs = [this.sourceImageURL];
      if (this.sourceImage2SelectedFile) {
        sourceImageURLs.push(this.sourceImage2URL);
      }

      // Start the vision add recipe process
      this.store.dispatch(
        RecipeActions.visionAddRecipe({
          recipeSourceImageURLs: [...sourceImageURLs],
          recipePhotoURL: this.photoURL,
          reviewAIIngredients: this.profile.reviewAIIngredients || false,
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
                console.error(
                  `Vision add recipe failed: ${error.message}, CODE: ${error.statusCode}`
                );
                // remove the image and photo, and stop listening for SSE messages
                this.removeFiles(true);
                this.recipeProgressService.stopListening();
                this.modalService.open(
                  VisionAddExampleModalComponent,
                  {
                    width: '90%',
                    data: {},
                  },
                  3,
                  true
                );

                // show the error modal
                this.modalService.open(
                  ErrorModalComponent,
                  {
                    maxWidth: '380px',
                    data: {
                      errorMessage: `We couldn't add a recipe using that image. Make sure the image clearly shows all needed details and try again.`,
                      statusCode: error.statusCode,
                    },
                  },
                  4,
                  true
                );
              } else {
                this.removeFiles(false);
                this.recipeProgressService.stopListening();
                // reduce AI Token count by 1
                this.authService.updateField(
                  'permAITokenCount',
                  `${this.profile.permAITokenCount - 1}`
                );
                this.store
                  .select(selectNewRecipeID)
                  .subscribe((newRecipeID) => {
                    if (!newRecipeID) {
                      this.dialogRef.close('success');
                    } else {
                      //navigate to recipe page
                      this.router.navigate(['/recipe', newRecipeID.recipeID]);
                      this.modalService.closeAll();
                    }
                  });
              }
              this.isAdding = false;
            });
        });
    } catch (error) {
      console.error(`Error when adding recipe: ${error}`);
      this.isAdding = false;
      this.removeFiles(true);
    }
  }

  onCancel() {
    this.dialogRef.close();
  }

  onDestroy() {
    this.removeFiles(false);
    this.recipeProgressService.stopListening();
  }

  onboardingHandler(onboardingState: number): void {
    // ** OLD ONBOARDING **
    // if (onboardingState === 12) {
    //   if (this.onboardingModalOpen()) return;
    //   this.onboardingModalOpen.set(true);
    //   this.showOnboardingBadge.set(false);
    //   this.reopenOnboardingModal.set(false);
    //   const dialogRef = this.modalService.open(
    //     OnboardingMessageModalComponent,
    //     {
    //       data: {
    //         message: this.stringsService.onboardingStrings.recipeCreateImage,
    //         currentStep: 12,
    //         showNextButton: false,
    //       },
    //       position: {
    //         top: '30%',
    //       },
    //     },
    //     3
    //   );
    //   if (dialogRef) {
    //     dialogRef.afterClosed().subscribe(() => {
    //       this.onboardingModalOpen.set(false);
    //       this.showOnboardingBadge.set(true);
    //     });
    //   } else {
    //   }
    // }
  }

  onClickHelp() {
    this.modalService.open(
      VisionAddExampleModalComponent,
      {
        width: '90%',
        data: {},
      },
      3,
      true
    );
  }
}
