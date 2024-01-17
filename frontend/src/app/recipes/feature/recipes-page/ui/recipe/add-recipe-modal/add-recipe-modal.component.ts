import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogRef,
} from '@angular/material/dialog';

import { ManualAddRecipeModalComponent } from '../manual-add-recipe-modal/manual-add-recipe-modal.component';
import { VisionAddRecipeModalComponent } from '../vision-add-recipe-modal/vision-add-recipe-modal.component';
import { RecipeCategory } from 'src/app/recipes/state/recipe-category/recipe-category-state';

@Component({
  selector: 'dl-add-recipe-modal',
  standalone: true,
  imports: [CommonModule, ManualAddRecipeModalComponent],
  templateUrl: './add-recipe-modal.component.html',
})
export class AddRecipeModalComponent {
  recipeCategories: RecipeCategory[] = [];
  constructor(
    public dialogRef: MatDialogRef<AddRecipeModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    public dialog: MatDialog
  ) {
    this.recipeCategories = this.data.recipeCategories;
  }

  onManualAddClick(): void {
    const dialogRef = this.dialog.open(ManualAddRecipeModalComponent, {
      data: {
        recipeCategories: this.data.categories,
      },
      width: '90%',
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result === 'success') {
        this.dialogRef.close('success');
      }
    });
  }

  onVisionAddClick(): void {
    const dialogRef = this.dialog.open(VisionAddRecipeModalComponent, {
      width: '90%',
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result === 'success') {
        this.dialogRef.close('success');
      }
    });
  }
}
