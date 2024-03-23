import { Inject, Component, WritableSignal, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogRef,
} from '@angular/material/dialog';
import { RecipeService } from 'src/app/recipes/data/recipe.service';
import { Store } from '@ngrx/store';
import { RecipeActions } from 'src/app/recipes/state/recipe/recipe-actions';
import { filter, take } from 'rxjs';
import {
  selectUpdating,
  selectError,
} from 'src/app/recipes/state/recipe/recipe-selectors';
import { ErrorModalComponent } from 'src/app/shared/ui/error-modal/error-modal.component';
import { selectProfile } from 'src/app/profile/state/profile-selectors';
import { Router } from '@angular/router';


@Component({
  selector: 'dl-use-recipe-modal',
  standalone: true,
  imports: [
    CommonModule,
    MatSelectModule,
    FormsModule,
    MatProgressSpinnerModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSlideToggleModule,
  ],
  templateUrl: './use-recipe-modal.component.html',
})
export class UseRecipeModalComponent {
  form!: FormGroup;
  public confirmed: boolean = false;
  public isSubmitting: boolean = false;
  public userProfile: WritableSignal<any> = signal(null);

  constructor(
    private fb: FormBuilder,
    private store: Store,
    private dialogRef: MatDialogRef<UseRecipeModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    public dialog: MatDialog,
    private router: Router
  ) {
    this.setForm();
  }

  ngOnInit(): void {
    this.store.select(selectProfile).subscribe((profile) => {
      this.userProfile.set(profile);
    });
  }

  setForm() {
    this.form = this.fb.group({
      satisfaction: [null, [Validators.required]],
      difficulty: [null, [Validators.required]],
      note: [null, []],
    });
  }

  onSubmit() {
    this.isSubmitting = true;
    const satisfaction = this.form.get('satisfaction')?.value;
    const difficulty = this.form.get('difficulty')?.value;
    const note = this.form.get('note')?.value;

    this.store.dispatch(
      RecipeActions.useRecipe({
        recipeID: this.data.recipeID,
        satisfaction,
        difficulty,
        note,
        checkIngredientStock: this.userProfile().checkIngredientStock,
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
                `Recipe use failed: ${error.message}, CODE: ${error.statusCode}`
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
            this.isSubmitting = false;
          });
      });
  }

  onViewSettings() {
    this.dialogRef.close();
    this.router.navigate(['/settings']);
  }

  onCancel() {
    this.dialogRef.close('cancel');
  }
}
