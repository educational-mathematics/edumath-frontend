import { TestBed } from '@angular/core/testing';
import { CanActivateFn } from '@angular/router';

import { blockifdoneGuard } from './blockifdone-guard';

describe('blockifdoneGuard', () => {
  const executeGuard: CanActivateFn = (...guardParameters) => 
      TestBed.runInInjectionContext(() => blockifdoneGuard(...guardParameters));

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(executeGuard).toBeTruthy();
  });
});
