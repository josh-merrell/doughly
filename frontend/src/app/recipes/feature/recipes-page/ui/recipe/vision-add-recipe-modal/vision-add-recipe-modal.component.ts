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
import {
  selectAdding,
  selectError,
  selectNewRecipeID,
} from 'src/app/recipes/state/recipe/recipe-selectors';
import { ErrorModalComponent } from 'src/app/shared/ui/error-modal/error-modal.component';
import { ImageCropperModule, ImageCroppedEvent } from 'ngx-image-cropper';
import { Router } from '@angular/router';
import { StringsService } from 'src/app/shared/utils/strings';
import {
  selectProfile,
  selectUpdating,
} from 'src/app/profile/state/profile-selectors';
import { OnboardingMessageModalComponent } from 'src/app/onboarding/ui/message-modal/onboarding-message-modal.component';
import { ProfileActions } from 'src/app/profile/state/profile-actions';
import { ExtraStuffService } from 'src/app/shared/utils/extraStuffService';

@Component({
  selector: 'dl-vision-add-recipe-modal',
  standalone: true,
  imports: [CommonModule, ImageCropperModule, MatProgressSpinnerModule],
  templateUrl: './vision-add-recipe-modal.component.html',
})
export class VisionAddRecipeModalComponent {
  isAdding: boolean = false;
  statusMessage: WritableSignal<string> = signal('');

  // source image upload
  sourceImageURL!: string;
  public sourceImageSelectedFile: File | null = null;
  public sourceImageSelectedFileUrl: string | null = null;
  public sourceImagePresent: boolean = false;

  // Onboarding
  public showOnboardingBadge: WritableSignal<boolean> = signal(false);
  public onboardingModalOpen: WritableSignal<boolean> = signal(false);
  private reopenOnboardingModal: WritableSignal<boolean> = signal(false);

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
  public profile: WritableSignal<any> = signal(null);

  constructor(
    public dialogRef: MatDialogRef<VisionAddRecipeModalComponent>,
    private photoUploadService: PhotoService,
    public dialog: MatDialog,
    public store: Store,
    public recipeProgressService: RecipeProgressService,
    private ngZone: NgZone,
    private router: Router,
    private stringsService: StringsService,
    private extraStuffService: ExtraStuffService
  ) {
    effect(
      () => {
        const profile = this.profile();
        if (!profile || profile.onboardingState === 0) return;
        if (!this.onboardingModalOpen() && this.reopenOnboardingModal()) {
          this.onboardingHandler(profile.onboardingState);
        }
      },
      { allowSignalWrites: true }
    );
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

  ngOnInit() {
    this.store.select(selectProfile).subscribe((profile) => {
      if (profile && profile.onboardingState !== 0) {
        this.showOnboardingBadge.set(true);
      }
      this.profile.set(profile);
    });
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
        : this.sourceImageSelectedFile;
    if (imageToUpload) {
      try {
        const type =
          variableName === 'sourceImageSelectedFile' ? 'temp' : 'recipe';
        const url: string = await this.photoUploadService
          .getPreSignedPostUrl(
            type,
            this[variableName].name,
            this[variableName].type
          )
          .toPromise();

        const uploadResponse = await this.photoUploadService.uploadFileToS3(
          url,
          imageToUpload
        );

        if (variableName === 'selectedFile')
          this.photoURL = uploadResponse.url.split('?')[0];
        else {
          this.sourceImageURL = uploadResponse.url.split('?')[0];
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
  }

  async onSubmit() {
    this.isAdding = true;
    this.statusMessage.set('Loading Image');
    //first upload the recipe source image to temp
    await this.uploadCroppedImage('sourceImageSelectedFile');
    //if recipe photo present, upload it also
    await this.uploadCroppedImage('selectedFile');

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

      // Start the vision add recipe process
      this.store.dispatch(
        RecipeActions.visionAddRecipe({
          recipeSourceImageURL: this.sourceImageURL,
          recipePhotoURL: this.photoURL,
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
                // show the error modal
                this.dialog.open(ErrorModalComponent, {
                  maxWidth: '380px',
                  data: {
                    errorMessage: `We couldn't add a recipe using that image. Make sure the image clearly shows all details of a recipe and try again.`,
                    statusCode: error.statusCode,
                  },
                });
              } else {
                this.removeFiles(false);
                this.recipeProgressService.stopListening();
                this.store
                  .select(selectNewRecipeID)
                  .subscribe((newRecipeID) => {
                    if (!newRecipeID) {
                      this.dialogRef.close('success');
                    } else {
                      //advance onboarding
                      this.extraStuffService.onboardingVisionRecipe.set(
                        newRecipeID.recipeID
                      );
                      if (this.profile().onboardingState === 12) {
                        this.store.dispatch(
                          ProfileActions.updateProfileProperty({
                            property: 'onboardingState',
                            value: 13,
                          })
                        );
                        this.store
                          .select(selectUpdating)
                          .pipe(
                            filter((updating) => !updating),
                            take(1)
                          )
                          .subscribe(() => {
                            this.store
                              .select(selectError)
                              .pipe(take(1))
                              .subscribe((error) => {
                                if (error) {
                                  console.error(
                                    `Error updating onboarding state: ${error.message}, CODE: ${error.statusCode}`
                                  );
                                }
                              });
                          });
                      }
                      //navigate to recipe page
                      this.router.navigate(['/recipe', newRecipeID.recipeID]);
                      this.dialog.closeAll();
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
    if (onboardingState === 12) {
      if (this.onboardingModalOpen()) return;
      this.onboardingModalOpen.set(true);
      this.showOnboardingBadge.set(false);
      this.reopenOnboardingModal.set(false);
      const dialogRef = this.dialog.open(OnboardingMessageModalComponent, {
        data: {
          message: this.stringsService.onboardingStrings.recipeCreateImage,
          currentStep: 12,
          showNextButton: false,
        },
        position: {
          top: '30%',
        },
      });
      dialogRef.afterClosed().subscribe(() => {
        this.onboardingModalOpen.set(false);
        this.showOnboardingBadge.set(true);
      });
    }
  }

  onboardingBadgeClick() {
    this.showOnboardingBadge.set(false);
    this.onboardingHandler(this.profile().onboardingState);
  }
}
