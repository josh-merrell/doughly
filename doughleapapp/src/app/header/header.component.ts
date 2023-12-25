import { Component, Input } from '@angular/core';

@Component({
  selector: 'dl-header',
  templateUrl: './header.component.html',
})
export class HeaderComponent {
  @Input() title: string = '';

  changeCase() {
    this.title = this.title.toUpperCase();
  }
}


