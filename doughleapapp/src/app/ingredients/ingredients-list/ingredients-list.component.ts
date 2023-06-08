import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, SimpleChange, ViewChild } from '@angular/core';
import { Ingredient } from '../ingredients';

@Component({
  selector: 'dl-ingredients-list',
  templateUrl: './ingredients-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IngredientsListComponent {

  @Input() ingredients: Ingredient[] | null = [];

  @Input() title: string = '';


  constructor() { }

  ngOnInit(): void {
  }

  ngOnChanges(changes: SimpleChange): void {
    console.log('on changes called');
  }


}
