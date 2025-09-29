import { TestBed } from '@angular/core/testing';

import { Points } from './points';

describe('Points', () => {
  let service: Points;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Points);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
