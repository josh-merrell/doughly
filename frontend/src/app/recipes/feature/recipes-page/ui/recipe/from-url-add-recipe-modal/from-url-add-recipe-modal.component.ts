import { CommonModule } from '@angular/common';
import { Component, WritableSignal, signal } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatInputModule } from '@angular/material/input';
import { Store } from '@ngrx/store';
import { NgZone } from '@angular/core';
import { PhotoService } from 'src/app/shared/utils/photoService';
import { RecipeProgressService } from 'src/app/recipes/data/recipeVisionProgress.service';
import { Observable, filter, take } from 'rxjs';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
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
  ],
  templateUrl: './from-url-add-recipe-modal.component.html',
})
export class FromUrlAddRecipeModalComponent {
  form!: FormGroup;
  isAdding: boolean = false;
  statusMessage: WritableSignal<string> = signal('');

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
    public dialogRef: MatDialogRef<FromUrlAddRecipeModalComponent>,
    private photoUploadService: PhotoService,
    public dialog: MatDialog,
    public store: Store,
    public recipeProgressService: RecipeProgressService,
    private ngZone: NgZone,
    private router: Router,
    private fb: FormBuilder
  ) {}

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

        const uploadResponse = await this.photoUploadService.uploadFileToS3(
          url,
          this.croppedImage
        );

        this.photoURL = uploadResponse.url.split('?')[0];
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
    this.setForm();
  }

  setForm() {
    this.form = this.fb.group({
      sourceURL: ['', [Validators.required]],
    });
  }

  async onSubmit() {
    this.isAdding = true;
    this.statusMessage.set('Loading Image');
    //if recipe photo is present, upload it
    if (this.selectedFile) {
      await this.uploadCroppedImage();
    }

    try {
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
                console.error('Error when adding recipe via URL:', error);
                // remove the recipe photo if it was uploaded
                this.removeFiles(true);
                // show error modal
                this.dialog.open(ErrorModalComponent, {
                  maxWidth: '380px',
                  data: {
                    errorMessage: `We couldn't add a recipe using that link. Make sure that web page has all details of a recipe and try again.`,
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
                      this.router.navigate(['/recipe', newRecipeID]);
                      this.dialog.closeAll();
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

  onDestroy() {
    this.removeFiles(true);
    this.recipeProgressService.stopListening();
  }
}
