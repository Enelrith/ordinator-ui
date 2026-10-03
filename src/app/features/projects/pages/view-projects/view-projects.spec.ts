import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ViewProjects } from './view-projects';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

describe('ViewProjects', () => {
  let component: ViewProjects;
  let fixture: ComponentFixture<ViewProjects>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ViewProjects],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(ViewProjects);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
