import { Component, ElementRef, Renderer2, ViewChild, WritableSignal, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DraftPageComponent } from '../feature/draft-page/draft-page.component';
import { ShoppingPageComponent } from '../feature/shopping-page/shopping-page.component';

@Component({
  selector: 'dl-groceries-page',
  standalone: true,
  imports: [CommonModule, DraftPageComponent, ShoppingPageComponent],
  templateUrl: './groceries-page.component.html',
})
export class GroceriesPageComponent {
  menuOpen: boolean = false;
  public status: WritableSignal<string> = signal('draft');
  @ViewChild('menu') rowItemMenu!: ElementRef;
  globalClickListener: () => void = () => {};

  constructor(private renderer: Renderer2) {}

  toggleMenu(event: any) {
    event.stopPropagation();
    this.menuOpen = !this.menuOpen;
  }
  closeMenu() {
    this.menuOpen = false;
  }

  // LIFECYCLE HOOKS  *********************************
  ngAfterViewInit() {
    this.globalClickListener = this.renderer.listen(
      'document',
      'click',
      (event) => {
        const clickedInside = this.rowItemMenu?.nativeElement.contains(
          event.target
        );
        if (!clickedInside && this.rowItemMenu) {
          this.closeMenu();
        }
      }
    );
  }

  // INTERACTIVITY FUNCTIONS **************************
  onDeleteClick() {
    console.log('delete clicked');
  }
}
