import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogRef,
} from '@angular/material/dialog';
import { ShoppingList } from 'src/app/recipes/state/recipe/recipe-state';

@Component({
  selector: 'dl-recipe-shopping-list-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './recipe-shopping-list-modal.component.html',
})
export class RecipeShoppingListModalComponent {

  shoppingList: ShoppingList;
  usageDate: string;
  recipeName: string;

  constructor(
    public dialog: MatDialog,
    public dialogRef: MatDialogRef<RecipeShoppingListModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.shoppingList = this.data.shoppingList;
    this.usageDate = this.data.usageDate;
    this.recipeName = this.data.recipeName;
  }

  onCancel() {
    this.dialogRef.close();
  }
}
