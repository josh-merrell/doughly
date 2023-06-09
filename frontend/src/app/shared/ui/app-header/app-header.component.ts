import { Renderer2, ElementRef, ViewChild, Component } from '@angular/core';
import { NavigationEnd, Router, RouterLinkWithHref, RouterOutlet, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs/operators';


@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLinkWithHref],
  templateUrl: './app-header.component.html',
})
export class AppHeaderComponent {
  @ViewChild('menu') menu!: ElementRef;
  globalClickListener: () => void = () => {};
  isMenuOpen = false;
  currentUrl: string = '';

  constructor(private renderer: Renderer2, private router: Router) {
    router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.currentUrl = event.url;
        console.log(`currentUrl: ${this.currentUrl}`);
      }
    });
  }

  ngOnInit() {
    this.globalClickListener = this.renderer.listen('document', 'click', (event) => {
      const clickedInside = this.menu.nativeElement.contains(event.target);
      if (!clickedInside && this.isMenuOpen) {
        this.closeMenu();
      }
    });
  }

  ngOnDestroy() {
    if (this.globalClickListener) {
      this.globalClickListener();
    }
  }

  toggleMenu(event: any) {
    event.stopPropagation();
    this.isMenuOpen = !this.isMenuOpen;
  }

  closeMenu() {
    this.isMenuOpen = false;
  }
}
