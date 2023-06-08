import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IngredientsAddComponent } from './ingredients-add.component';

describe('IngredientsAddComponent', () => {
  let component: IngredientsAddComponent;
  let fixture: ComponentFixture<IngredientsAddComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [IngredientsAddComponent]
    });
    fixture = TestBed.createComponent(IngredientsAddComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
