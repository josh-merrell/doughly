import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IngredientsTableComponent } from './ingredients-table.component';

describe('IngredientsTableComponent', () => {
  let component: IngredientsTableComponent;
  let fixture: ComponentFixture<IngredientsTableComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [IngredientsTableComponent]
    });
    fixture = TestBed.createComponent(IngredientsTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
