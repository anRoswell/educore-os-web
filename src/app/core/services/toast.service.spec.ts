import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { ToastService } from './toast.service';

describe('ToastService', () => {
  let service: ToastService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ToastService],
    });
    service = TestBed.inject(ToastService);
  });

  it('1. Debe estar definido el servicio de notificaciones Toast', () => {
    expect(service).toBeDefined();
  });

  it('2. Debe emitir un toast de éxito', () => {
    service.success('Operación completada con éxito');
    const list = service.toasts();
    expect(list.length).toBeGreaterThan(0);
    expect(list[list.length - 1].type).toBe('success');
    expect(list[list.length - 1].title).toBe('Operación completada con éxito');
  });

  it('3. Debe emitir un toast de error con tipo danger', () => {
    service.error('Error al procesar solicitud');
    const list = service.toasts();
    expect(list.length).toBeGreaterThan(0);
    expect(list[list.length - 1].type).toBe('danger');
    expect(list[list.length - 1].title).toBe('Error al procesar solicitud');
  });
});
