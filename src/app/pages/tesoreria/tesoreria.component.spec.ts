import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TesoreriaComponent } from './tesoreria.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { AuthService } from '../../core/services/auth.service';

describe('TesoreriaComponent', () => {
  let component: TesoreriaComponent;
  let fixture: ComponentFixture<TesoreriaComponent>;

  const mockAuthService = {
    user: () => ({ id: '1', nombre: 'Test' }),
    colegioSeleccionado: () => ({ id: '1' })
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TesoreriaComponent, HttpClientTestingModule],
      providers: [
        { provide: AuthService, useValue: mockAuthService }
      ]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(TesoreriaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
