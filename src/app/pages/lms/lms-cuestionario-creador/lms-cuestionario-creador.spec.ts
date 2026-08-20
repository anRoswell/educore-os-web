import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LmsCuestionarioCreador } from './lms-cuestionario-creador';

describe('LmsCuestionarioCreador', () => {
  let component: LmsCuestionarioCreador;
  let fixture: ComponentFixture<LmsCuestionarioCreador>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LmsCuestionarioCreador],
    }).compileComponents();

    fixture = TestBed.createComponent(LmsCuestionarioCreador);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
