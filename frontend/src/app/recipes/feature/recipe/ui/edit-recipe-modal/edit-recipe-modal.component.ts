import { Component, Inject, WritableSignal, signal } from '@angular/core';
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
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import {
  Observable,
  Subject,
  Subscription,
  catchError,
  filter,
  of,
  take,
  takeUntil,
} from 'rxjs';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogRef,
} from '@angular/material/dialog';
import { Store } from '@ngrx/store';
import { PhotoService } from 'src/app/shared/utils/photoService';
import { ImageCropperModule, ImageCroppedEvent } from 'ngx-image-cropper';
import {
  selectError,
  selectRecipes,
  selectUpdating,
} from 'src/app/recipes/state/recipe/recipe-selectors';
import { RecipeActions } from 'src/app/recipes/state/recipe/recipe-actions';
import {
  positiveIntegerValidator,
  twoByteInteger,
} from 'src/app/shared/utils/formValidator';
import { selectRecipeCategories } from 'src/app/recipes/state/recipe-category/recipe-category-selectors';
import { ErrorModalComponent } from 'src/app/shared/ui/error-modal/error-modal.component';
import {
  selectFollowers,
  selectFriends,
  selectProfile,
} from 'src/app/profile/state/profile-selectors';
import { PushTokenService } from 'src/app/shared/utils/pushTokenService';

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
    MatSlideToggleModule,
  ],
  templateUrl: './edit-recipe-modal.component.html',
})
export class EditRecipeModalComponent {
  public isSubmitting: boolean = false;
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
  public isPublic!: boolean;
  public isHeirloom!: boolean;
  private profile: WritableSignal<any> = signal(null);
  newPhotoURL!: string;

  constructor(
    private fb: FormBuilder,
    private store: Store,
    private photoService: PhotoService,
    private dialogRef: MatDialogRef<EditRecipeModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    public dialog: MatDialog,
    private pushTokenService: PushTokenService
  ) {
    this.setForm();
  }

  ngOnInit(): void {
    this.store.select(selectProfile).subscribe((profile) => {
      this.profile.set(profile);
    });
    this.isPublic = this.data.type === 'public' ? true : false;
    this.isHeirloom =
      this.data.type === 'heirloom' || this.data.type === 'public'
        ? true
        : false;
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
      isHeirloomRecipe: [
        this.data.type === 'heirloom' || this.data.type === 'public'
          ? true
          : false,
      ],
      isPublicRecipe: [this.data.type === 'public' ? true : false],
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
            // this.store.dispatch(RecipeActions.loadRecipe(this.data.recipeID));
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
          .getPreSignedPostUrl(
            'recipe',
            this.selectedFile.name,
            this.selectedFile.type
          )
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
      timeBake: this.form.value.timeBake
        ? parseInt(this.form.value.timeBake)
        : null,
      type: this.form.value.isHeirloomRecipe
        ? this.form.value.isPublicRecipe
          ? 'public'
          : 'heirloom'
        : 'private',
      recipeID: this.data.recipeID,
    };

    if (this.photoURL) {
      newRecipe.photoURL = this.photoURL;
    }
    //first replace the image if necessary
    if (this.croppedImage && this.selectedFile) {
      await this.replaceImage();
      newRecipe.photoURL = this.newPhotoURL;
    }

    this.isSubmitting = true;
    this.store.dispatch(RecipeActions.updateRecipe({ recipe: newRecipe }));

    this.updatingSubscription = this.store
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
                `Recipe update failed: ${error.message}, CODE: ${error.statusCode}`
              );
              this.dialog.open(ErrorModalComponent, {
                maxWidth: '380px',
                data: {
                  errorMessage: error.message,
                  statusCode: error.statusCode,
                },
              });
            } else {
              this.sendNotification();
              this.dialogRef.close('success');
            }
            this.isSubmitting = false;
          });
      });
  }

  sendNotification() {
    if (!this.form.value.isPublicRecipe && !this.form.value.isHeirloomRecipe) {
      return;
    }
    if (this.form.value.isPublicRecipe) {
      this.store
        .select(selectFriends)
        .pipe(
          take(1),
          catchError((error) => {
            console.error('Error selecting friends:', error);
            return of([]); // Return an empty array as fallback
          })
        )
        .subscribe((friends) => {
          friends.forEach((friend) => {
            this.pushTokenService
              .getOtherUserPushTokens(friend.userID)
              .pipe(
                catchError((error) => {
                  console.error('Error getting user push tokens:', error);
                  return of([]); // Return an empty array as fallback
                })
              )
              .subscribe((tokens) => {
                this.pushTokenService
                  .sendPushNotification(
                    tokens,
                    'notifyFriendsHeirloomRecipeCreated',
                    {
                      recipeAuthor: `${this.profile().nameFirst} ${
                        this.profile().nameLast
                      }`,
                      recipeName: this.form.value.title,
                      imageUrl: this.newPhotoURL,
                    }
                  )
                  .pipe(
                    catchError((error) => {
                      console.error('Error sending push notification:', error);
                      return of(null); // You might want to handle this differently
                    })
                  )
                  .subscribe();
              });
          });
        });
    } else if (this.form.value.isHeirloomRecipe) {
      this.store
        .select(selectFollowers)
        .pipe(
          catchError((error) => {
            console.error('Error selecting followers:', error);
            return of([]); // Return an empty array as fallback
          })
        )
        .subscribe((followers) => {
          followers.forEach((follower) => {
            this.pushTokenService
              .getOtherUserPushTokens(follower.userID)
              .pipe(
                catchError((error) => {
                  console.error('Error getting user push tokens:', error);
                  return of([]); // Return an empty array as fallback
                })
              )
              .subscribe((tokens) => {
                this.pushTokenService
                  .sendPushNotification(
                    tokens,
                    'notifyFollowersPublicRecipeCreated',
                    {
                      recipeAuthor: `${this.profile().nameFirst} ${
                        this.profile().nameLast
                      }`,
                      recipeName: this.form.value.title,
                      imageUrl: this.newPhotoURL,
                    }
                  )
                  .pipe(
                    catchError((error) => {
                      console.error('Error sending push notification:', error);
                      return of(null);
                    })
                  )
                  .subscribe();
              });
          });
        });
    }
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  onCancel() {
    this.dialogRef.close('cancel');
  }
}
