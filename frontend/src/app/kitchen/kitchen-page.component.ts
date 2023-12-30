import { Component, WritableSignal, effect, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToolsComponent } from './feature/tools/tools.component';
import { IngredientsComponent } from './feature/ingredients/ingredients.component';
import { Router, RouterModule } from '@angular/router';


@Component({
  selector: 'dl-kitchen-page',
  standalone: true,
  imports: [RouterModule, CommonModule, ToolsComponent, IngredientsComponent],
  templateUrl: './kitchen-page.component.html',
})
export class KitchenPageComponent {
  view: WritableSignal<string> = signal('ingredients');

  constructor(private router: Router) {
    effect(() => {
      const view = this.view();
      if (view === 'tools') {
        this.router.navigate(['kitchen/tools']);
      } else if (view === 'ingredients') {
        this.router.navigate(['kitchen/ingredients']);
      }
    })
  }

  updateView(view: string) {
    this.view.set(view);
  }

  ngOnInit(): void {

  }
}
