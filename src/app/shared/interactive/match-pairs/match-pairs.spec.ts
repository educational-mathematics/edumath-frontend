import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MatchPairs } from './match-pairs';

describe('MatchPairs', () => {
  let component: MatchPairs;
  let fixture: ComponentFixture<MatchPairs>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MatchPairs]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MatchPairs);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
