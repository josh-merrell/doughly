import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IngredientDetailsComponent } from './ingredient-details.component';

describe('IngredientDetailsComponent', () => {
  let component: IngredientDetailsComponent;
  let fixture: ComponentFixture<IngredientDetailsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [IngredientDetailsComponent]
    });
    fixture = TestBed.createComponent(IngredientDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
