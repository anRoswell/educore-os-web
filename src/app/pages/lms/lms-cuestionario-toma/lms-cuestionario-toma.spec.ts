import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LmsCuestionarioTomaComponent } from './lms-cuestionario-toma';

describe('LmsCuestionarioTomaComponent', () => {
  let component: LmsCuestionarioTomaComponent;
  let fixture: ComponentFixture<LmsCuestionarioTomaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LmsCuestionarioTomaComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(LmsCuestionarioTomaComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
