import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ActivityRenderer } from './activity-renderer';

describe('ActivityRenderer', () => {
  let component: ActivityRenderer;
  let fixture: ComponentFixture<ActivityRenderer>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ActivityRenderer]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ActivityRenderer);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
