import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CreateTask } from './create-task';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

describe('CreateTask', () => {
  let component: CreateTask;
  let fixture: ComponentFixture<CreateTask>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateTask],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(CreateTask);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
