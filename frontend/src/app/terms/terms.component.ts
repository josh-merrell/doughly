import { CommonModule } from '@angular/common';
import { Component, Renderer2 } from '@angular/core';
import { Router } from '@angular/router';
import { ExtraStuffService } from '../shared/utils/extraStuffService';
import { Capacitor } from '@capacitor/core';
import { StylesService } from '../shared/utils/stylesService';

@Component({
  selector: 'dl-terms',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './terms.component.html',
})
export class TermsComponent {
  constructor(
    private router: Router,
    public extraStuffService: ExtraStuffService,
    private stylesService: StylesService,
    private renderer: Renderer2
  ) {}

  ngOnInit() {
    if (Capacitor.isNativePlatform()) {
      this.stylesService.updateStyles();
      this.renderer.addClass(document.body, 'product-page');
    }
  }

  onExitClick() {
    this.router.navigate(['/profile']);
  }
}
