import { Component } from '@angular/core';

@Component({
  selector: 'dl-root',
  template: `
    <h1 class="m-3 rounded-lg border-4 bg-gray-200 p-1.5 shadow-sm hover:bg-gray-100">Root Component</h1>
    <div [ngSwitch]="role">
      <div *ngSwitchCase="'Admin'">Welcome Admin</div>
      <div *ngSwitchCase="'User'">Welcome User</div>
      <div *ngSwitchDefault>Unknown User</div>
    </div>
    <dl-ingredients></dl-ingredients>
  `,
})
export class AppComponent {
  title = 'doughleapapp';
  role = 'Admin';
}
