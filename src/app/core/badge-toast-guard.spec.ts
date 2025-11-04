import { TestBed } from '@angular/core/testing';

import { BadgeToastGuard } from './badge-toast-guard';

describe('BadgeToastGuard', () => {
  let service: BadgeToastGuard;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BadgeToastGuard);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
