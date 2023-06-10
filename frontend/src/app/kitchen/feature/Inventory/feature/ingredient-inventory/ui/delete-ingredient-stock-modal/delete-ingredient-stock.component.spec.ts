import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DeleteIngredientStockComponent } from './delete-ingredient-stock.component';

describe('DeleteIngredientStockComponent', () => {
  let component: DeleteIngredientStockComponent;
  let fixture: ComponentFixture<DeleteIngredientStockComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [DeleteIngredientStockComponent]
    });
    fixture = TestBed.createComponent(DeleteIngredientStockComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
