import { TestBed } from '@angular/core/testing';
import { CanActivateFn } from '@angular/router';

import { requiredoneGuard } from './requiredone-guard';

describe('requiredoneGuard', () => {
  const executeGuard: CanActivateFn = (...guardParameters) => 
      TestBed.runInInjectionContext(() => requiredoneGuard(...guardParameters));

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(executeGuard).toBeTruthy();
  });
});
