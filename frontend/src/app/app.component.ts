import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AppHeaderComponent } from './shared/ui/app-header/app-header.component';
import { StoreModule } from '@ngrx/store';
import { sharedReducer } from './shared/state/shared-reducers';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { setCurrentUrl } from './shared/state/shared-actions';
import { AppState } from './shared/state/app-state';

@Component({
  standalone: true,
  selector: 'app-root',
  imports: [CommonModule, RouterModule, AppHeaderComponent],
  templateUrl: './app.component.html',
})
export class AppComponent {
  title = 'frontend';

  constructor(private router: Router) {}
}
