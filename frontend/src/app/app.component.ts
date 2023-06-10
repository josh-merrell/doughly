import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AppHeaderComponent } from './header/feature/app-header.component';
import { Router } from '@angular/router';

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
