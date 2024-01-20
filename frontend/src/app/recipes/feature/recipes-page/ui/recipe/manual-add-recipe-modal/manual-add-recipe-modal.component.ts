import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Observable, Subscription, filter, take } from 'rxjs';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Store } from '@ngrx/store';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import {
  nonDuplicateString,
  positiveIntegerValidator,
  twoByteInteger,
} from 'src/app/shared/utils/formValidator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';

import {
  selectAdding,
  selectError,
  selectLoading,
  selectRecipes,
} from 'src/app/recipes/state/recipe/recipe-selectors';
import { RecipeActions } from 'src/app/recipes/state/recipe/recipe-actions';
import { Recipe } from 'src/app/recipes/state/recipe/recipe-state';
import { selectRecipeCategories } from 'src/app/recipes/state/recipe-category/recipe-category-selectors';
import { PhotoService } from 'src/app/shared/utils/photoService';
import { ImageCropperModule, ImageCroppedEvent } from 'ngx-image-cropper';
import { RecipeCategory } from 'src/app/recipes/state/recipe-category/recipe-category-state';
import { ErrorModalComponent } from 'src/app/shared/ui/error-modal/error-modal.component';

@Component({
  selector: 'dl-manual-add-recipe-modal',
  standalone: true,
  imports: [
    CommonModule,
    MatProgressSpinnerModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    ImageCropperModule,
    MatSlideToggleModule,
  ],
  templateUrl: './manual-add-recipe-modal.component.html',
})
export class ManualAddRecipeModalComponent {
  isAdding: boolean = false;
  recipes!: Recipe[];
  categories$!: Observable<any[]>;
  form!: FormGroup;
  isLoading$: Observable<boolean>;
  private addingSubscription!: Subscription;
  recipeCategories: RecipeCategory[] = [];

  //photo upload
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
    public dialogRef: MatDialogRef<ManualAddRecipeModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private store: Store,
    private fb: FormBuilder,
    private photoUploadService: PhotoService,
    public dialog: MatDialog
  ) {
    this.isLoading$ = this.store.select(selectLoading);
    this.store.select(selectRecipes).subscribe((recipes) => {
      this.recipes = recipes;
      this.setForm();
    });
    this.categories$ = this.store.select(selectRecipeCategories);
    this.recipeCategories = this.data.recipeCategories;
  }

  setForm() {
    this.form = this.fb.group({
      title: [
        '',
        [
          Validators.required,
          nonDuplicateString(this.recipes.map((recipe) => recipe.title)),
        ],
      ],
      isPublicRecipe: [true],
      servings: [
        '',
        [Validators.required, positiveIntegerValidator(), twoByteInteger()],
      ],
      recipeCategoryID: ['', [Validators.required]],
      lifespanDays: [
        '',
        [Validators.required, positiveIntegerValidator(), twoByteInteger()],
      ],
      timePrep: [
        '',
        [Validators.required, positiveIntegerValidator(), twoByteInteger()],
      ],
      timeBake: [null, [positiveIntegerValidator(), twoByteInteger()]],
      photoURL: [null],
    });
  }

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
    if (this.croppedImage && this.selectedFile) {
      try {
        const url: string = await this.photoUploadService
          .getPreSignedPostUrl('recipe', this.selectedFile.name, this.selectedFile.type)
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
    this.isAdding = true;
    //first upload the cropped image
    await this.uploadCroppedImage();

    const formValue = this.form.value;
    const newRecipe: any = {
      title: formValue.title,
      recipeCategoryID: formValue.recipeCategoryID,
      type: formValue.isPublicRecipe ? 'public' : 'private',
      servings: parseInt(formValue.servings),
      lifespanDays: parseInt(formValue.lifespanDays),
      timePrep: parseInt(formValue.timePrep),
      photoURL: this.photoURL,
    };
    if (formValue.timeBake) {
      newRecipe['timeBake'] = parseInt(formValue.timeBake);
    }

    this.store.dispatch(RecipeActions.addRecipe({ recipe: newRecipe }));

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
                `Recipe addition failed: ${error.message}, CODE: ${error.statusCode}`
              );
              this.dialog.open(ErrorModalComponent, {
                maxWidth: '380px',
                data: {
                  errorMessage: error.message,
                  statusCode: error.statusCode,
                },
              });
            } else {
              this.dialogRef.close('success');
            }
            this.isAdding = false;
          });
      });
  }

  onCancel() {
    this.dialogRef.close();
  }

  ngOnDestroy() {
    if (this.addingSubscription) {
      this.addingSubscription.unsubscribe();
    }
  }
}
