import { TestBed } from '@angular/core/testing';
import { CanActivateFn } from '@angular/router';

import { verifyEntryGuard } from './verify-entry-guard';

describe('verifyEntryGuard', () => {
  const executeGuard: CanActivateFn = (...guardParameters) => 
      TestBed.runInInjectionContext(() => verifyEntryGuard(...guardParameters));

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(executeGuard).toBeTruthy();
  });
});
