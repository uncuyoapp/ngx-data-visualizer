import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FullExampleComponent } from './full-example.component';

describe('FullExampleComponent', () => {
  let component: FullExampleComponent;
  let fixture: ComponentFixture<FullExampleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FullExampleComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(FullExampleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
