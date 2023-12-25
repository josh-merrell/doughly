import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'dl-login',
  templateUrl: './login.component.html',
})
export class LoginComponent {

  email: string = '';
  password: string = '';

  constructor(private route: Router) { }

  ngOnInit(): void {
  }

  login() {
    if(this.email==="admin@gmail.com" && this.password==="admin") {
      this.route.navigate(['/ingredients', 'add']);
      //this.route.navigateByUrl('/ingredients/add'); // alternative to above
    }
  }

}
