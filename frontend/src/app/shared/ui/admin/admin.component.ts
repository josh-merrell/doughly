import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'dl-admin',
  standalone: true,
  imports: [],
  templateUrl: './admin.component.html',
})
export class AdminComponent {
  constructor(private router: Router) {}

  // navigate to login page with 'admin=true' query parameter
  ngOnInit() {
    this.router.navigate(['/login'], { queryParams: { admin: true } });
  }
}
