import { TestBed } from '@angular/core/testing';
import { CommentApi } from './comment-api';

describe('CommentApi', () => {
  let service: CommentApi;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CommentApi);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
