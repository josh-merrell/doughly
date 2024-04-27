import { Component, Inject } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogRef,
} from '@angular/material/dialog';

import { ManualAddRecipeModalComponent } from '../manual-add-recipe-modal/manual-add-recipe-modal.component';
import { VisionAddRecipeModalComponent } from '../vision-add-recipe-modal/vision-add-recipe-modal.component';
import { FromUrlAddRecipeModalComponent } from '../from-url-add-recipe-modal/from-url-add-recipe-modal.component';
import { RecipeCategory } from 'src/app/recipes/state/recipe-category/recipe-category-state';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { filter, map } from 'rxjs';

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
    public dialog: MatDialog,
    public route: ActivatedRoute,
    public router: Router,
    public location: Location
  ) {
    this.recipeCategories = this.data.recipeCategories;
  }

  ngOnInit() {
    // Check the initial URL
    this.checkUrlAndAct(this.location.path());

    // Listen for future URL changes
    this.router.events
      .pipe(
        filter(
          (event): event is NavigationEnd => event instanceof NavigationEnd
        ),
        map((event) => event as NavigationEnd)
      )
      .subscribe((navigationEndEvent) => {
        this.checkUrlAndAct(navigationEndEvent.urlAfterRedirects);
      });
  }

  private checkUrlAndAct(fullUrl: string) {
    if (fullUrl.includes('/vision')) {
      this.onVisionAddClick();
    }
    if (fullUrl.includes('/from-url')) {
      this.onFromUrlAddClick();
    }
    // Any other URL checks can be added here

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
    // update url to include '/vision' if it's not already there
    this.location.go('/recipes/created/add/vision');

    const dialogRef = this.dialog.open(VisionAddRecipeModalComponent, {
      width: '90%',
    });
    dialogRef.afterClosed().subscribe((result) => {
      // remove '/vision' from the url
      this.location.go('/recipes/created/add');
      if (result === 'success') {
        this.dialogRef.close('success');
      }
    });
  }

  onFromUrlAddClick(): void {
    // update url to include '/from-url' if it's not already there
    this.location.go('/recipes/created/add/from-url');

    const dialogRef = this.dialog.open(FromUrlAddRecipeModalComponent, {
      width: '90%',
    });
    dialogRef.afterClosed().subscribe((result) => {
      // remove '/from-url' from the url
      this.location.go('/recipes/created/add');
      if (result === 'success') {
        this.dialogRef.close('success');
      }
    });
  }

  onDestroy() {
    this.dialogRef.close();
  }
}
