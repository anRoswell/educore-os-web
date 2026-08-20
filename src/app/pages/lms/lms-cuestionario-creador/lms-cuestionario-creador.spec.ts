import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { LmsCuestionarioCreadorComponent } from './lms-cuestionario-creador';

describe('LmsCuestionarioCreadorComponent', () => {
  let component: LmsCuestionarioCreadorComponent;
  let fixture: ComponentFixture<LmsCuestionarioCreadorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LmsCuestionarioCreadorComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(LmsCuestionarioCreadorComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
