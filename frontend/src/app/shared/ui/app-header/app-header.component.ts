import { Renderer2, ElementRef, ViewChild, Component } from '@angular/core';
import { NavigationEnd, Router, RouterLinkWithHref, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Store } from '@ngrx/store';
import { Subject, filter, takeUntil, tap } from 'rxjs';
import { setCurrentUrl } from '../../state/shared-actions';
import { Observable } from 'rxjs';
import { selectCurrentUrl } from '../../state/shared-selectors';
import { AppState } from '../../state/app-state';

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
  currentUrl$: Observable<string> = this.store.select(selectCurrentUrl);
  private destroy$ = new Subject<void>();

  options: any = { exact: false }

  constructor(private renderer: Renderer2, private router: Router, private store: Store<AppState>) {}

  ngOnInit() {
    this.globalClickListener = this.renderer.listen('document', 'click', (event) => {
      const clickedInside = this.menu.nativeElement.contains(event.target);
      if (!clickedInside && this.isMenuOpen) {
        this.closeMenu();
      }
    });

    this.router.events
      .pipe(
        takeUntil(this.destroy$),
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        tap((event: NavigationEnd) => {
          this.store.dispatch(setCurrentUrl({ url: event.url }));
        }),
      )
      .subscribe();
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
