import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LmsCuestionarioToma } from './lms-cuestionario-toma';

describe('LmsCuestionarioToma', () => {
  let component: LmsCuestionarioToma;
  let fixture: ComponentFixture<LmsCuestionarioToma>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LmsCuestionarioToma],
    }).compileComponents();

    fixture = TestBed.createComponent(LmsCuestionarioToma);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
