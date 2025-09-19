import { TestBed } from '@angular/core/testing';
import { CanActivateFn } from '@angular/router';

import { forgotEntryGuard } from './forgot-entry-guard';

describe('forgotEntryGuard', () => {
  const executeGuard: CanActivateFn = (...guardParameters) => 
      TestBed.runInInjectionContext(() => forgotEntryGuard(...guardParameters));

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(executeGuard).toBeTruthy();
  });
});
