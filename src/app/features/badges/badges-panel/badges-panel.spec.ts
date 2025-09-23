import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BadgesPanel } from './badges-panel';

describe('BadgesPanel', () => {
  let component: BadgesPanel;
  let fixture: ComponentFixture<BadgesPanel>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BadgesPanel]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BadgesPanel);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
