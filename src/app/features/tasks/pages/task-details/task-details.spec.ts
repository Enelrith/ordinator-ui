import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TaskDetails } from './task-details';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

describe('TaskDetails', () => {
  let component: TaskDetails;
  let fixture: ComponentFixture<TaskDetails>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TaskDetails],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(TaskDetails);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
