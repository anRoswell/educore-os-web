import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ModalManagerService {
  private readonly stack = signal<string[]>([]);

  /**
   * Registra la apertura de un modal en la pila activa.
   * Si ya existía, lo mueve a la cima para garantizar que esté al frente.
   */
  open(modalId: string) {
    this.stack.update((current) => {
      const filtered = current.filter((id) => id !== modalId);
      return [...filtered, modalId];
    });
  }

  /**
   * Remueve un modal de la pila activa al cerrarse.
   */
  close(modalId: string) {
    this.stack.update((current) => current.filter((id) => id !== modalId));
  }

  /**
   * Calcula el z-index dinámico según la posición en la pila de modales abiertos.
   * Modales abiertos más recientemente reciben un z-index superior automáticamente.
   */
  getZIndex(modalId: string, baseZIndex = 100000): number {
    const current = this.stack();
    const idx = current.indexOf(modalId);
    if (idx === -1) {
      return baseZIndex;
    }
    return baseZIndex + (idx + 1) * 15;
  }
}
