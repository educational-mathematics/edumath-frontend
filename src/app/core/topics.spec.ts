import { TestBed } from '@angular/core/testing';

import { Topics } from './topics';

describe('Topics', () => {
  let service: Topics;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Topics);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
