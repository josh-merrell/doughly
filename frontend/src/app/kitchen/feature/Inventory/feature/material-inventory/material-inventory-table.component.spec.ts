import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MaterialInventoryTableComponent } from './material-inventory-table.component';

describe('MaterialInventoryTableComponent', () => {
  let component: MaterialInventoryTableComponent;
  let fixture: ComponentFixture<MaterialInventoryTableComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [MaterialInventoryTableComponent]
    });
    fixture = TestBed.createComponent(MaterialInventoryTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
