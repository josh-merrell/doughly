import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AppNotfoundComponent } from './app-notfound.component';

describe('AppNotfoundComponent', () => {
  let component: AppNotfoundComponent;
  let fixture: ComponentFixture<AppNotfoundComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [AppNotfoundComponent]
    });
    fixture = TestBed.createComponent(AppNotfoundComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
