import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddIngredientStockModalComponent } from './add-ingredient-stock-modal.component';

describe('AddIngredientStockModalComponent', () => {
  let component: AddIngredientStockModalComponent;
  let fixture: ComponentFixture<AddIngredientStockModalComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [AddIngredientStockModalComponent]
    });
    fixture = TestBed.createComponent(AddIngredientStockModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
