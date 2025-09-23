import { TestBed } from '@angular/core/testing';

import { Badges } from './badges';

describe('Badges', () => {
  let service: Badges;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Badges);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
