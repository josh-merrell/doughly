import { CommonModule } from '@angular/common';
import { Component, WritableSignal, signal } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
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

  // recipe photo upload
  photoURL!: string;
  public recipeImageChangedEvent: any = '';
  public croppedImage: any = '';
  public selectedFile: File | null = null;
  public isImageLoaded: boolean = false;
  public isCropperReady: boolean = false;
  public imageLoadFailed: boolean = false;
  public imagePresent: boolean = false;
  public isChecked = true;

  constructor(
    public dialogRef: MatDialogRef<VisionAddRecipeModalComponent>,
    private photoUploadService: PhotoService,
    public dialog: MatDialog,
    public store: Store,
    public recipeProgressService: RecipeProgressService,
    private ngZone: NgZone,
    private router: Router
  ) {}

  // for recipe source image
  recipeSourceImageOnFileSelected(event: Event): void {
    this.sourceImageSelectedFile =
      (event.target as HTMLInputElement).files?.[0] || null;
    this.sourceImagePresent = true;
    if (this.sourceImageSelectedFile) {
      this.sourceImageSelectedFileUrl = URL.createObjectURL(
        this.sourceImageSelectedFile
      );
    } else {
      this.sourceImageSelectedFileUrl = null;
    }
  }

  // for recipe photo
  recipeOnFileSelected(event: Event): void {
    this.recipeImageChangedEvent = event; // For the cropping UI
    this.selectedFile = (event.target as HTMLInputElement).files?.[0] || null;
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
    const imageToUpload = variableName === 'selectedFile' ? this.croppedImage : this.sourceImageSelectedFile;
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
      console.log(`deleted recipe photo: ${result}`)
    }
    if (this.sourceImageURL) {
      const result = await this.deleteFile(this.sourceImageURL, 'temp').toPromise();
      console.log(`deleted source Image: ${result}`)
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
}
