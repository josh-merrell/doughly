import { Inject, Component, Optional } from '@angular/core';
import { localStorageToken } from './localstorage.token';
import { InitService } from './init.service';

@Component({
  selector: 'dl-root', //in the template, when we use container 'ng-content', the order in which we define elements here doesn't matter. Order of rendering is determined in the ng-content element template inside container.component.html
  templateUrl: './app.component.html',
})
export class AppComponent {
  title = 'doughleapapp';
  role = 'Admin';

  constructor(@Inject(localStorageToken) private localStorage: Storage, private initService: InitService) {
    console.log(initService.config);
  }

  ngOnInit() {
    this.localStorage.setItem('App Start Time:', new Date().toString());
  }

  // ngDoCheck() {
  //   this.localStorage.setItem('App Changed Time:', new Date().toString());
  // }
}

