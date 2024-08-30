import { Component, Renderer2 } from '@angular/core';
import { Router } from '@angular/router';
import { ExtraStuffService } from 'src/app/shared/utils/extraStuffService';
import { CommonModule } from '@angular/common';
import { Capacitor } from '@capacitor/core';
import { StylesService } from 'src/app/shared/utils/stylesService';

@Component({
  selector: 'dl-privacy-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './privacy-page.component.html',
})
export class PrivacyPageComponent {
  constructor(
    private router: Router,
    public extraStuffService: ExtraStuffService,
    private stylesService: StylesService,
    private renderer: Renderer2
  ) {}

  ngOnInit() {
    if (Capacitor.isNativePlatform()) {
      this.stylesService.updateStyles('#A54C18', 'dark');
      this.renderer.addClass(document.body, 'product-page');
    }
  }

  onExitClick() {
    this.router.navigate(['/profile']);
  }

}
