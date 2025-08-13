import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MultichartDemoComponent } from './multichart-demo.component';

describe('MultichartDemoComponent', () => {
  let component: MultichartDemoComponent;
  let fixture: ComponentFixture<MultichartDemoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MultichartDemoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MultichartDemoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
