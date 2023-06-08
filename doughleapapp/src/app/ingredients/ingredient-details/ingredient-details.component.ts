import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Observable, map } from 'rxjs';

@Component({
  selector: 'dl-ingredient-details',
  templateUrl: './ingredient-details.component.html',
})
export class IngredientDetailsComponent {

  id$ = this.router.paramMap.pipe(map((params) => params.get('id')));

  constructor(private router: ActivatedRoute) {}

  subscriber: any;

  ngOnInit() {
  }
}
