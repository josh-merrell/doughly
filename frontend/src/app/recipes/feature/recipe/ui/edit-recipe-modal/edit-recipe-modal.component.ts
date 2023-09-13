import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
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
import { Observable, Subject, Subscription, takeUntil } from 'rxjs';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Store } from '@ngrx/store';
import { PhotoService } from 'src/app/shared/utils/photoService';
import { ImageCropperModule, ImageCroppedEvent } from 'ngx-image-cropper';
import { selectError, selectRecipes, selectUpdating } from 'src/app/recipes/state/recipe/recipe-selectors';
import { RecipeActions } from 'src/app/recipes/state/recipe/recipe-actions';
import {
  positiveIntegerValidator,
  twoByteInteger,
} from 'src/app/shared/utils/formValidator';
import { selectRecipeCategories } from 'src/app/recipes/state/recipe-category/recipe-category-selectors';
import { AddRecipeCategoryModalComponent } from '../../../recipes-page/ui/recipe-category/add-recipe-category-modal/add-recipe-category-modal.component';
import { AddRequestConfirmationModalComponent } from 'src/app/shared/ui/add-request-confirmation/add-request-confirmation-modal.component';
import { AddRequestErrorModalComponent } from 'src/app/shared/ui/add-request-error/add-request-error-modal.component';

@Component({
  selector: 'dl-edit-recipe-modal',
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
  templateUrl: './edit-recipe-modal.component.html',
})
export class EditRecipeModalComponent {
  form!: FormGroup;
  isUploadingPhoto: boolean = false;
  private recipe$: Observable<any> = new Observable();
  private recipes: any[] = [];
  private unsubscribe$ = new Subject<void>();
  private updatingSubscription!: Subscription;
  categories$!: Observable<any[]>;
  categories: any[] = [];

  //photo upload
  public recipeImageChangedEvent: any = '';
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
    private dialogRef: MatDialogRef<EditRecipeModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    public dialog: MatDialog
  ) {
    this.setForm();
  }

  ngOnInit(): void {
    this.store
      .select(selectRecipes)
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((recipes) => {
        this.recipes = recipes;
      });

    this.photoURL = this.data.photoURL;
    this.categories$ = this.store.select(selectRecipeCategories);
    this.categories$
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((categories) => {
        this.categories = categories;
      });
  }

  setForm() {
    this.form = this.fb.group({
      title: [this.data.title, [Validators.required, this.titleValidator()]],
      recipeCategoryID: [this.data.recipeCategoryID, [Validators.required]],
      servings: [
        this.data.servings,
        [Validators.required, positiveIntegerValidator(), twoByteInteger()],
      ],
      lifespanDays: [
        this.data.lifespanDays,
        [Validators.required, positiveIntegerValidator(), twoByteInteger()],
      ],
      timePrep: [
        this.data.timePrep,
        [Validators.required, positiveIntegerValidator(), twoByteInteger()],
      ],
      timeBake: [
        this.data.timeBake,
        [positiveIntegerValidator(), twoByteInteger()],
      ],
    });
  }

  titleValidator(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } | null => {
      const title = control.value;

      // Check if the title is the same as the original title
      if (title === this.data.title) {
        return null;
      }

      if (this.recipes && this.recipes.length > 0) {
        const titleExists = this.recipes.some(
          (recipe) => recipe.title === title
        );
        if (titleExists) {
          return { titleExists: true };
        }
      }
      return null;
    };
  }

  onAddNewCategory() {
    const dialogRef = this.dialog.open(AddRecipeCategoryModalComponent, {
      data: {
        recipeCategories: this.categories,
      },
    });

    dialogRef.afterClosed().subscribe((result: any) => {
      if (result === 'success') {
        this.dialog.open(AddRequestConfirmationModalComponent, {
          data: {
            result: result,
            addSuccessMessage: 'Category added successfully!',
          },
        });
      } else if (result) {
        this.dialog.open(AddRequestErrorModalComponent, {
          data: {
            result: result,
            addErrorMessage: 'Failed to add category.',
          },
        });
      }
    });
  }

  //photo selection/cropping
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
  recipeDeleteImage(): Observable<any> {
    return this.photoService.deleteFileFromS3(
      this.photoURL!,
      'recipe',
      this.data.recipeID
    );
  }
  async replaceImage() {
    if (this.croppedImage && this.selectedFile) {
      this.isUploadingPhoto = true; // set the flag to true at the start
      try {
        if (this.photoURL) {
          // wait for delete operation to complete
          const result = await this.recipeDeleteImage().toPromise();
          if (result.data) {
            this.store.dispatch(RecipeActions.loadRecipe(this.data.recipeID));
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
    const newRecipe = {
      ...this.form.value,
      servings: parseInt(this.form.value.servings),
      lifespanDays: parseInt(this.form.value.lifespanDays),
      timePrep: parseInt(this.form.value.timePrep),
      timeBake: this.form.value.timeBake? parseInt(this.form.value.timeBake) : null,
      photoURL: this.photoURL,
      recipeID: this.data.recipeID,
    };
    //first replace the image if necessary
    if (this.croppedImage && this.selectedFile) {
      await this.replaceImage();
      newRecipe.photoURL = this.newPhotoURL;
    }

    this.store.dispatch(RecipeActions.updateRecipe({ recipe: newRecipe }));

    this.updatingSubscription = this.store.select(selectUpdating)
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

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  onCancel() {
    this.dialogRef.close('cancel');
  }
}
