import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IngredientsModalComponent } from './ingredients-modal.component';

describe('IngredientsModalComponent', () => {
  let component: IngredientsModalComponent;
  let fixture: ComponentFixture<IngredientsModalComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [IngredientsModalComponent]
    });
    fixture = TestBed.createComponent(IngredientsModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
