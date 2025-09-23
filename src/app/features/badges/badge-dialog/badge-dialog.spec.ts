import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BadgeDialog } from './badge-dialog';

describe('BadgeDialog', () => {
  let component: BadgeDialog;
  let fixture: ComponentFixture<BadgeDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BadgeDialog]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BadgeDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
