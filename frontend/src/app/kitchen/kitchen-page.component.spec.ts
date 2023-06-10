import { ComponentFixture, TestBed } from '@angular/core/testing';

import { KitchenPageComponent } from './kitchen-page.component';

describe('KitchenPageComponent', () => {
  let component: KitchenPageComponent;
  let fixture: ComponentFixture<KitchenPageComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [KitchenPageComponent]
    });
    fixture = TestBed.createComponent(KitchenPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
