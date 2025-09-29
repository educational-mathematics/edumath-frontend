import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddTopicDialog } from './add-topic-dialog';

describe('AddTopicDialog', () => {
  let component: AddTopicDialog;
  let fixture: ComponentFixture<AddTopicDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddTopicDialog]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddTopicDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
