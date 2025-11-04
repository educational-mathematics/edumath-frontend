import { TestBed } from '@angular/core/testing';

import { AssistantApi } from './assistant-api';

describe('AssistantApi', () => {
  let service: AssistantApi;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AssistantApi);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
