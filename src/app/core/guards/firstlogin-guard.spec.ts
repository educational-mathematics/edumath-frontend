import { TestBed } from '@angular/core/testing';
import { CanActivateFn } from '@angular/router';

import { firstloginGuard } from './firstlogin-guard';

describe('firstloginGuard', () => {
  const executeGuard: CanActivateFn = (...guardParameters) => 
      TestBed.runInInjectionContext(() => firstloginGuard(...guardParameters));

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(executeGuard).toBeTruthy();
  });
});
