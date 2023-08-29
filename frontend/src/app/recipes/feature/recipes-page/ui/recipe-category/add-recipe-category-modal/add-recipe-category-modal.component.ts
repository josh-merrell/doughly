import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { Observable, Subscription } from 'rxjs';
import { RecipeCategory } from 'src/app/recipes/state/recipe-category/recipe-category-state';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  selectAdding,
  selectError,
  selectLoading,
  selectRecipeCategories,
} from 'src/app/recipes/state/recipe-category/recipe-category-selectors';
import { Store } from '@ngrx/store';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { nonDuplicateString } from 'src/app/shared/utils/formValidator';
import { RecipeCategoryActions } from 'src/app/recipes/state/recipe-category/recipe-category-actions';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { PhotoUploadService } from 'src/app/shared/utils/photoUploadService';
import { ImageCroppedEvent, ImageCropperModule } from 'ngx-image-cropper';

@Component({
  selector: 'dl-add-recipe-category-modal',
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
  templateUrl: './add-recipe-category-modal.component.html',
})
export class AddRecipeCategoryModalComponent {
  recipeCategories: RecipeCategory[] = [];
  form!: FormGroup;
  isAdding$: Observable<boolean>;
  isLoading$: Observable<boolean>;
  private addingSubscription!: Subscription;
  private recipeCategoriesSubscription: Subscription = new Subscription();

  //photo upload
  photoURL!: string;
  public imageChangedEvent: any = '';
  public croppedImage: any = '';
  public selectedFile: File | null = null;
  public isImageLoaded: boolean = false;
  public isCropperReady: boolean = false;
  public imageLoadFailed: boolean = false;

  constructor(
    public dialogRef: MatDialogRef<AddRecipeCategoryModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private store: Store,
    private fb: FormBuilder,
    private photoUploadService: PhotoUploadService
  ) {
    this.isAdding$ = this.store.select(selectAdding);
    this.isLoading$ = this.store.select(selectLoading);
    this.recipeCategories = this.data.recipeCategories;
    this.setForm();
  }

  setForm() {
    this.form = this.fb.group({
      name: [
        '',
        [
          Validators.required,
          nonDuplicateString(
            this.recipeCategories.map((recipeCategory) => recipeCategory.name)
          ),
        ],
      ],
      photoURL: [null, [Validators.required]],
    });
  }

  onFileSelected(event: Event): void {
    this.imageChangedEvent = event; // For the cropping UI
    this.selectedFile = (event.target as HTMLInputElement).files?.[0] || null;
  }

  imageCropped(event: ImageCroppedEvent) {
    this.croppedImage = event.blob;
  }

  imageLoaded() {
    this.isImageLoaded = true;
  }

  cropperReady() {
    this.isCropperReady = true;
  }

  loadImageFailed() {
    this.imageLoadFailed = true;
  }

  async uploadCroppedImage() {
    if (this.croppedImage && this.selectedFile) {
      try {
        const url: string = await this.photoUploadService
          .getPreSignedUrl(this.selectedFile.name, this.selectedFile.type)
          .toPromise();

        const uploadResponse = await this.photoUploadService.uploadFileToS3(
          url,
          this.croppedImage
        );
        console.log('Upload Successful:', uploadResponse.url);

        this.photoURL = uploadResponse.url.split('?')[0];
      } catch (error) {
        console.log('An error occurred:', error);
      }
    }
  }

  async onSubmit() {
    //first upload the cropped image
    await this.uploadCroppedImage();

    const formValue = this.form.value;
    const payload = {
      ...formValue,
      photoURL: this.photoURL,
    };

    this.store.dispatch(
      RecipeCategoryActions.addRecipeCategory({ recipeCategory: payload })
    );

    this.addingSubscription = this.store
      .select(selectAdding)
      .subscribe((adding) => {
        if (!adding) {
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

  onCancel() {
    this.dialogRef.close();
  }

  ngOnDestroy(): void {
    if (this.addingSubscription) {
      this.addingSubscription.unsubscribe();
    }
  }
}
