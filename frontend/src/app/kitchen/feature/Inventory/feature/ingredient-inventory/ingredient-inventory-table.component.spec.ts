import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IngredientInventoryTableComponent } from './ingredient-inventory-table.component';

describe('IngredientInventoryTableComponent', () => {
  let component: IngredientInventoryTableComponent;
  let fixture: ComponentFixture<IngredientInventoryTableComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [IngredientInventoryTableComponent]
    });
    fixture = TestBed.createComponent(IngredientInventoryTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
