import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DragToBucket } from './drag-to-bucket';

describe('DragToBucket', () => {
  let component: DragToBucket;
  let fixture: ComponentFixture<DragToBucket>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DragToBucket]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DragToBucket);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
