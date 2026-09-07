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

  it('debe abrir y cerrar el modal de configuracion financiera por colegio', () => {
    expect(component.modalConfiguracionFinanciera()).toBe(false);
    component.abrirConfiguracionTesoreria();
    expect(component.modalConfiguracionFinanciera()).toBe(true);
    component.cerrarConfiguracionTesoreria();
    expect(component.modalConfiguracionFinanciera()).toBe(false);
  });

  it('debe actualizar los signals al guardar nueva configuracion financiera', () => {
    const nuevaConfig = {
      anioLectivoDefecto: 2027,
      tarifaBasePension: 580000,
      diaLimitePagoDefecto: 12,
      diaPagoAcuerdoDefecto: 18,
      cuotasAcuerdoDefecto: 4,
      valorDefaultAcuerdo: 950000,
      moraPorcentajeDefault: 2.5,
      diasGraciaDefault: 6,
    };
    component.onConfiguracionFinancieraGuardada(nuevaConfig);
    expect(component.configuracionFinanciera().tarifaBasePension).toBe(580000);
    expect(component.configuracionFinanciera().anioLectivoDefecto).toBe(2027);
  });
});
