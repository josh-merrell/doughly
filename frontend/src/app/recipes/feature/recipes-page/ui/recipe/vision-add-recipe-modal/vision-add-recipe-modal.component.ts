import { CommonModule } from '@angular/common';
import { Component, WritableSignal, signal } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Store } from '@ngrx/store';
import { NgZone } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { PhotoService } from 'src/app/shared/utils/photoService';
import { RecipeActions } from 'src/app/recipes/state/recipe/recipe-actions';
import { RecipeProgressService } from 'src/app/recipes/data/recipeVisionProgress.service';
import { filter, take } from 'rxjs';
import {
  selectAdding,
  selectError,
} from 'src/app/recipes/state/recipe/recipe-selectors';
import { ErrorModalComponent } from 'src/app/shared/ui/error-modal/error-modal.component';

@Component({
  selector: 'dl-vision-add-recipe-modal',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule],
  templateUrl: './vision-add-recipe-modal.component.html',
})
export class VisionAddRecipeModalComponent {
  isAdding: boolean = false;
  statusMessage: WritableSignal<string> = signal('');

  //photo upload
  photoURL!: string;
  public selectedFile: File | null = null;
  public selectedFileUrl: string | null = null;
  public imagePresent: boolean = false;

  constructor(
    public dialogRef: MatDialogRef<VisionAddRecipeModalComponent>,
    private photoUploadService: PhotoService,
    public dialog: MatDialog,
    public store: Store,
    public recipeProgressService: RecipeProgressService,
    private ngZone: NgZone
  ) {}

  recipeOnFileSelected(event: Event): void {
    this.selectedFile = (event.target as HTMLInputElement).files?.[0] || null;
    this.imagePresent = !!this.selectedFile;
    if (this.selectedFile) {
      this.selectedFileUrl = URL.createObjectURL(this.selectedFile);
    } else {
      this.selectedFileUrl = null;
    }
  }

  async uploadCroppedImage() {
    if (this.selectedFile) {
      try {
        const url: string = await this.photoUploadService
          .getPreSignedPostUrl('temp', this.selectedFile.name, this.selectedFile.type)
          .toPromise();

        const uploadResponse = await this.photoUploadService.uploadFileToS3(
          url,
          this.selectedFile
        );
        console.log('Upload Successful:', uploadResponse.url);

        this.photoURL = uploadResponse.url.split('?')[0];
      } catch (error) {
        console.log('An error occurred:', error);
      }
    }
  }

  async onSubmit() {
    this.isAdding = true;
    this.statusMessage.set('Loading Image');
    //first upload the cropped image
    await this.uploadCroppedImage();

    try {
      // Start listening for SSE messages relating to the recipe vision progress
      this.recipeProgressService.startListening().subscribe({
        next: (message) => {
          this.ngZone.run(() => {
            console.log(message);
            if (message === 'done') {
              this.recipeProgressService.stopListening();
            } else {
              this.statusMessage.set(JSON.parse(message).message);
            }
          })
        },
        error: (error) => {
          this.recipeProgressService.stopListening();
          console.log(error);
        },
      });

      // Start the vision add recipe process
      this.store.dispatch(
        RecipeActions.visionAddRecipe({ recipeImageURL: this.photoURL })
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
                this.dialog.open(ErrorModalComponent, {
                  maxWidth: '380px',
                  data: {
                    errorMessage: error.message,
                    statusCode: error.statusCode,
                  },
                });
              } else {
                this.recipeProgressService.stopListening();
                this.dialogRef.close('success');
              }
              this.isAdding = false;
            });
        });
    } catch (error) {
      console.error(`Error when adding recipe: ${error}`);
      this.isAdding = false;
    }
  }

  onCancel() {
    this.dialogRef.close();
  }
}
