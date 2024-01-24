import { Component, Inject, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { LogService } from 'src/app/shared/utils/logService';

@Component({
  selector: 'dl-timeline',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './timeline.component.html',
})
export class TimelineComponent {
  public posts = {};
  @Input() userID!: string;
  private weekAgo!: string;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private logService: LogService
  ) {}

  ngOnInit() {
    let date = new Date();
    date.setDate(date.getDate() - 7);
    date.setUTCHours(0, 0, 0, 0);
    this.weekAgo = this.formatDateToUTCString(date);

    this.logService
      .getRecipeLogs(this.userID, 'recipeCreate', this.weekAgo, undefined)
      .subscribe((res) => {
        this.posts['createRecipe'] = [...res];
      });
    this.logService
      .getRecipeFeedbackLogs(this.userID, undefined, undefined, undefined)
      .subscribe((res) => {
        this.posts['recipeUse'] = [...res];
      });
    this.logService
      .getKitchenLogs(this.userID, 'createIngredient', this.weekAgo, undefined)
      .subscribe((res) => {
        this.posts['createIngredient'] = [...res];
      });
  }

  private formatDateToUTCString(date: Date): string {
    return (
      date.getUTCFullYear() +
      '-' +
      this.pad(date.getUTCMonth() + 1) +
      '-' +
      this.pad(date.getUTCDate()) +
      ' ' +
      this.pad(date.getUTCHours()) +
      ':' +
      this.pad(date.getUTCMinutes()) +
      ':' +
      this.pad(date.getUTCSeconds()) +
      '.' +
      date.getUTCMilliseconds() +
      '+00'
    );
  }

  private pad(number: number): string {
    if (number < 10) {
      return '0' + number;
    }
    return number.toString();
  }
}
