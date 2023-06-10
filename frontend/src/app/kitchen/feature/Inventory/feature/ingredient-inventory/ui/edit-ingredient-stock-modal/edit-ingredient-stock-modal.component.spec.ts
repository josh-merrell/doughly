import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditIngredientStockModalComponent } from './edit-ingredient-stock-modal.component';

describe('EditIngredientStockModalComponent', () => {
  let component: EditIngredientStockModalComponent;
  let fixture: ComponentFixture<EditIngredientStockModalComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [EditIngredientStockModalComponent]
    });
    fixture = TestBed.createComponent(EditIngredientStockModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
