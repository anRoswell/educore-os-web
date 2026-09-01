import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LmsComponent } from './lms.component';
import { AuthService } from '../../core/services/auth.service';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';
import { ModalManagerService } from '../../core/services/modal-manager.service';

describe('LmsComponent', () => {
  let component: LmsComponent;
  let fixture: ComponentFixture<LmsComponent>;
  let apiService: ApiService;
  let toastService: ToastService;

  const mockAuthService = {
    currentUser: () => ({ id: 'usr-1', nombre: 'Docente Juan', rol: 'DOCENTE' }),
    colegio: () => ({ id: 'col-1', nombre: 'Colegio San Bartolomé' }),
    esDocente: () => true,
    esEstudiante: () => false,
    esRectorOAdmin: () => false,
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LmsComponent, HttpClientTestingModule],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        ApiService,
        ToastService,
        ModalManagerService,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LmsComponent);
    component = fixture.componentInstance;
    apiService = TestBed.inject(ApiService);
    toastService = TestBed.inject(ToastService);
  });

  it('1. Debe inicializar el componente LMS correctamente', () => {
    expect(component).toBeTruthy();
    expect(component.modalEliminarTarea()).toBeNull();
  });

  it('2. Debe abrir modal de confirmación al solicitar eliminar tarea sin usar confirm() nativo', () => {
    const mockTarea: any = {
      id: 'tarea-1',
      titulo: 'Taller de Física Vectorial',
      descripcion: 'Resolver guía 3',
    };

    component.eliminarTareaConfirm(mockTarea);
    expect(component.modalEliminarTarea()).toEqual(mockTarea);
  });

  it('3. Debe confirmar la eliminación y llamar al endpoint DELETE', () => {
    const mockTarea: any = {
      id: 'tarea-1',
      titulo: 'Taller de Física Vectorial',
    };
    component.tareas.set([mockTarea]);
    component.modalEliminarTarea.set(mockTarea);

    const deleteSpy = vi.spyOn(apiService, 'delete').mockReturnValue(of({ success: true }));
    const toastSpy = vi.spyOn(toastService, 'warning');

    component.confirmarEliminarTarea();

    expect(deleteSpy).toHaveBeenCalledWith('lms/tareas/tarea-1');
    expect(component.tareas().length).toBe(0);
    expect(component.modalEliminarTarea()).toBeNull();
    expect(toastSpy).toHaveBeenCalledWith('Tarea Eliminada', expect.stringContaining('Taller de Física Vectorial'));
  });
});
