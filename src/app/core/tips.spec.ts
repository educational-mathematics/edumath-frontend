import { TestBed } from '@angular/core/testing';

import { Tips } from './tips';

describe('Tips', () => {
  let service: Tips;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Tips);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
