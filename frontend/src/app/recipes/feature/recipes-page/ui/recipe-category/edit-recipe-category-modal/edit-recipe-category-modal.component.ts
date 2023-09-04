import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { Observable, Subject, Subscription, take, takeUntil } from 'rxjs';
import { RecipeCategory } from 'src/app/recipes/state/recipe-category/recipe-category-state';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { Store } from '@ngrx/store';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { nonDuplicateString } from 'src/app/shared/utils/formValidator';
import { RecipeCategoryActions } from 'src/app/recipes/state/recipe-category/recipe-category-actions';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { PhotoService } from 'src/app/shared/utils/photoService';
import { ImageCroppedEvent, ImageCropperModule } from 'ngx-image-cropper';
import { selectError, selectRecipeCategories, selectRecipeCategoryByID, selectUpdating } from 'src/app/recipes/state/recipe-category/recipe-category-selectors';
import { Actions, ofType } from '@ngrx/effects';


@Component({
  selector: 'dl-edit-recipe-category-modal',
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
  templateUrl: './edit-recipe-category-modal.component.html',
})
export class EditRecipeCategoryModalComponent {
  private recipeCategories: RecipeCategory[] = [];
  form!: FormGroup;
  isUploadingPhoto: boolean = false;

  private unsubscribe$ = new Subject<void>();
  private updatingSubscription!: Subscription;

  //photo upload
  public categoryImageChangedEvent: any = '';
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
    public dialogRef: MatDialogRef<EditRecipeCategoryModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private actions$: Actions
  ) {
    this.setForm();
  }

  ngOnInit(): void {
    this.store
      .select(selectRecipeCategories)
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((categories) => {
        this.recipeCategories = categories;
      });

    //retrieve category from store to get 'photoURL'
    const storeCategory = this.store.select(
      selectRecipeCategoryByID(this.data.recipeCategoryID)
    );
    storeCategory.pipe(takeUntil(this.unsubscribe$)).subscribe((category) => {
      if (category) {
        this.photoURL = category.photoURL;
      }
    });
  }

  setForm() {
    this.form = this.fb.group({
      name: [this.data.name, [Validators.required, this.titleValidator()]],
    });
  }

  titleValidator(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } | null => {
      const name = control.value;

      // Check if the title is the same as the original title
      if (name === this.data.name) {
        return null;
      }

      if (this.recipeCategories && this.recipeCategories.length > 0) {
        const nameExists = this.recipeCategories.some(
          (category) => category.name === name
        );
        if (nameExists) {
          return { nameExists: true };
        }
      }
      return null;
    };
  }

  //photo selection/cropping
  categoryOnFileSelected(event: Event): void {
    this.categoryImageChangedEvent = event; // For the cropping UI
    this.selectedFile = (event.target as HTMLInputElement).files?.[0] || null;
  }
  categoryImageCropped(event: ImageCroppedEvent) {
    this.croppedImage = event.blob;
    this.imagePresent = true;
  }
  categoryImageLoaded() {
    this.isImageLoaded = true;
  }
  categoryCropperReady() {
    this.isCropperReady = true;
  }
  categoryLoadImageFailed() {
    this.imageLoadFailed = true;
  }

  deleteImage(): Observable<any> {
    return this.photoService.deleteFileFromS3(
      this.photoURL!,
      'recipeCategory',
      this.data.recipeCategoryID
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
            this.store.dispatch(
              RecipeCategoryActions.loadRecipeCategory(
                this.data.recipeCategoryID
              )
            );
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
    const newRecipeCategory = {
      ...this.form.value,
      recipeCategoryID: this.data.recipeCategoryID,
      photoURL: this.data.photoURL,
    };
    //first replace the image if necessary
    if (this.croppedImage && this.selectedFile) {
      await this.replaceImage();
      newRecipeCategory.photoURL = this.newPhotoURL;
    }

    this.store.dispatch(
      RecipeCategoryActions.updateRecipeCategory({
        recipeCategory: newRecipeCategory,
      })
    );

    this.updatingSubscription = this.store
      .select(selectUpdating)
      .subscribe((updating) => {
        if (!updating) {
          this.store.select(selectError).subscribe((error) => {
            if (error) {
              this.dialogRef.close(error);
            } else {
              this.dialogRef.close('success');
            }
          });
        }
      });
  }

  ngOnDestroy() {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  onCancel() {
    this.dialogRef.close('cancel');
  }
}
