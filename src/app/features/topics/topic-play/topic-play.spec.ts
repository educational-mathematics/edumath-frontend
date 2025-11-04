import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TopicPlay } from './topic-play';

describe('TopicPlay', () => {
  let component: TopicPlay;
  let fixture: ComponentFixture<TopicPlay>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TopicPlay]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TopicPlay);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
