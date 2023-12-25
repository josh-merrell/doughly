import { Component, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { Ingredient, IngredientResponse } from './ingredients';
import { HeaderComponent } from '../header/header.component';
import { IngredientsService } from './services/ingredients.service';
import { Observable, Subscription, map } from 'rxjs';
import { HttpEventType } from '@angular/common/http';

@Component({
  selector: 'dl-ingredients',
  templateUrl: './ingredients.component.html',
})
export class IngredientsComponent {
  typesVisable = false;

  hideTypes() {
    this.typesVisable = !this.typesVisable;
  }

  ingredients: Ingredient[] = [];


  title: string = 'Ingredients';

  addedIngredientID!: number;

  totalBytes = 0;

  subscription!: Subscription;

  ingredients$ = this.ingredientsService.getIngredients$;

  ingredientsCount$ = this.ingredientsService.getIngredients$.pipe(map((ingredients) => ingredients.length));

  //runs prior to ngOnInit, inject services here
  constructor(private ingredientsService: IngredientsService) {}

  //runs after constructor, put logic here
  ngOnInit(): void {
    // this.ingredientsService.getIngredients$.subscribe(ingredients => {
    //   this.ingredients = ingredients;
    // });
    // this.ingredientsService.getPhotos().subscribe((event) => {
    //   switch (event.type) {
    //     case HttpEventType.Sent: {
    //       console.log('Request sent!');
    //       break;
    //     }
    //     case HttpEventType.ResponseHeader: {
    //       console.log('Request success!');
    //       break;
    //     }
    //     case HttpEventType.DownloadProgress: {
    //       this.totalBytes += event.loaded;
    //       break;
    //     }
    //     case HttpEventType.Response: {
    //       console.log(`Response complete, received ${this.totalBytes} bytes`);
    //       console.log(event.body);
    //       break;
    //     }
    //   }
    // });
  }

  deleteIngredient(ID: number) {
    this.ingredientsService.deleteIngredient(ID).subscribe((data) => {
      console.log(`DELETE RESPONSE DATA: ${data}`);
    });
  }

  @ViewChild(HeaderComponent, { static: true }) headerComponent!: HeaderComponent;
  @ViewChildren(HeaderComponent) headerComponents!: QueryList<HeaderComponent>;

  ngAfterViewInit() {
    console.log(Object.keys(this.headerComponents));
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }
}
