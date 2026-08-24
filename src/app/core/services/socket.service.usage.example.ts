/**
 * EJEMPLO DE USO DEL SOCKET SERVICE
 *
 * Este archivo contiene ejemplos de cómo usar el SocketService en diferentes escenarios.
 * NO es código que se ejecute, es solo documentación con ejemplos.
 */

import { Component, OnInit, inject, effect } from '@angular/core';
import { SocketService } from './socket.service';
import {
  ServerSocketEvents,
  ClientSocketEvents,
  ChatMessage,
  Notification,
  AttendanceEvent
} from './socket-events.types';

/**
 * EJEMPLO 1: Inicialización básica en el componente principal (app.component.ts)
 */
export class AppComponentExample implements OnInit {
  private socketService = inject(SocketService);

  ngOnInit() {
    // Obtener el token JWT del servicio de autenticación
    const token = localStorage.getItem('token');

    // Conectar al servidor
    this.socketService.connect({
      url: 'http://localhost:3000', // URL del backend
      path: '/socket.io',
      auth: {
        token: token // Enviar token para autenticación
      },
      reconnection: true,
      reconnectionAttempts: 5
    });

    // Monitorear el estado de conexión con signals
    effect(() => {
      const state = this.socketService.connectionState();
      console.log('Estado de conexión:', state);
    });

    // Verificar si está conectado
    effect(() => {
      const connected = this.socketService.isConnected();
      if (connected) {
        console.log('Socket conectado con ID:', this.socketService.getSocketId());
      }
    });
  }
}

/**
 * EJEMPLO 2: Sistema de mensajería/chat
 */
export class ChatComponentExample implements OnInit {
  private socketService = inject(SocketService);

  ngOnInit() {
    // Escuchar mensajes nuevos
    this.socketService.on$<ChatMessage>(ServerSocketEvents.NEW_MESSAGE)
      .subscribe(message => {
        console.log('Nuevo mensaje recibido:', message);
        this.addMessageToUI(message);
        this.playNotificationSound();
      });

    // Escuchar confirmación de mensaje enviado
    this.socketService.on$<{ messageId: string }>(ServerSocketEvents.MESSAGE_SENT)
      .subscribe(response => {
        console.log('Mensaje enviado confirmado:', response.messageId);
        this.markMessageAsSent(response.messageId);
      });

    // Escuchar indicador de escritura
    this.socketService.on$<{ userId: string, userName: string }>(ServerSocketEvents.USER_TYPING)
      .subscribe(data => {
        console.log(`${data.userName} está escribiendo...`);
        this.showTypingIndicator(data);
      });
  }

  sendMessage(receiverId: string, content: string) {
    const message: Partial<ChatMessage> = {
      receiverId,
      content,
      timestamp: new Date()
    };

    // Emitir mensaje
    this.socketService.emit(ClientSocketEvents.SEND_MESSAGE, message);
  }

  notifyTyping(receiverId: string) {
    this.socketService.emit(ClientSocketEvents.TYPING_START, { receiverId });
  }

  stopTyping(receiverId: string) {
    this.socketService.emit(ClientSocketEvents.TYPING_STOP, { receiverId });
  }

  // Métodos auxiliares de UI (implementar según necesidad)
  private addMessageToUI(message: ChatMessage) { }
  private playNotificationSound() { }
  private markMessageAsSent(messageId: string) { }
  private showTypingIndicator(data: any) { }
}

/**
 * EJEMPLO 3: Sistema de notificaciones en tiempo real
 */
export class NotificationsComponentExample implements OnInit {
  private socketService = inject(SocketService);

  ngOnInit() {
    // Escuchar notificaciones nuevas
    this.socketService.on$<Notification>(ServerSocketEvents.NEW_NOTIFICATION)
      .subscribe(notification => {
        console.log('Nueva notificación:', notification);
        this.showNotificationToast(notification);
        this.updateNotificationBadge();
      });

    // Escuchar confirmación de lectura
    this.socketService.on$<{ notificationId: string }>(ServerSocketEvents.NOTIFICATION_READ)
      .subscribe(response => {
        console.log('Notificación marcada como leída:', response.notificationId);
        this.markAsReadInUI(response.notificationId);
      });
  }

  markNotificationAsRead(notificationId: string) {
    this.socketService.emit(ClientSocketEvents.MARK_NOTIFICATION_READ, {
      notificationId
    });
  }

  private showNotificationToast(notification: Notification) { }
  private updateNotificationBadge() { }
  private markAsReadInUI(notificationId: string) { }
}

/**
 * EJEMPLO 4: Actualizaciones de asistencia en tiempo real
 */
export class AttendanceComponentExample implements OnInit {
  private socketService = inject(SocketService);

  ngOnInit() {
    // Escuchar actualizaciones de asistencia
    this.socketService.on$<AttendanceEvent>(ServerSocketEvents.ATTENDANCE_UPDATED)
      .subscribe(event => {
        console.log('Asistencia actualizada:', event);
        this.updateAttendanceGrid(event);
      });

    // Escuchar alertas de asistencia (estudiantes con muchas faltas)
    this.socketService.on$<{ studentId: string, absences: number }>(ServerSocketEvents.ATTENDANCE_ALERT)
      .subscribe(alert => {
        console.log('Alerta de asistencia:', alert);
        this.showAttendanceWarning(alert);
      });
  }

  markAttendance(studentId: string, status: string) {
    const attendanceData: Partial<AttendanceEvent> = {
      studentId,
      status: status as any,
      timestamp: new Date()
    };

    this.socketService.emit(ClientSocketEvents.ATTENDANCE_UPDATE, attendanceData);
  }

  private updateAttendanceGrid(event: AttendanceEvent) { }
  private showAttendanceWarning(alert: any) { }
}

/**
 * EJEMPLO 5: Patrón Request-Response (con acknowledgement)
 */
export class RequestResponseExample {
  private socketService = inject(SocketService);

  async sendMessageWithConfirmation(receiverId: string, content: string) {
    try {
      const response = await this.socketService.emitWithAck<
        { receiverId: string, content: string },
        { success: boolean, messageId: string }
      >(ClientSocketEvents.SEND_MESSAGE, {
        receiverId,
        content
      });

      if (response.success) {
        console.log('Mensaje enviado con ID:', response.messageId);
        return response.messageId;
      }
    } catch (error) {
      console.error('Error enviando mensaje:', error);
      throw error;
    }
  }
}

/**
 * EJEMPLO 6: Monitoreo de estado con signals en la UI
 */
export class ConnectionStatusComponentExample {
  private socketService = inject(SocketService);

  // Estos signals son reactivos y actualizan automáticamente la UI
  connectionState = this.socketService.connectionState;
  isConnected = this.socketService.isConnected;
  lastError = this.socketService.lastError;

  constructor() {
    // Efecto que se ejecuta cuando cambia el estado
    effect(() => {
      const state = this.connectionState();

      switch (state) {
        case 'connected':
          this.showSuccessMessage('Conectado al servidor');
          break;
        case 'disconnected':
          this.showWarningMessage('Desconectado del servidor');
          break;
        case 'reconnecting':
          this.showInfoMessage('Reconectando...');
          break;
        case 'error':
          this.showErrorMessage(`Error: ${this.lastError()}`);
          break;
      }
    });
  }

  manualReconnect() {
    this.socketService.reconnect();
  }

  private showSuccessMessage(msg: string) { }
  private showWarningMessage(msg: string) { }
  private showInfoMessage(msg: string) { }
  private showErrorMessage(msg: string) { }
}

/**
 * EJEMPLO 7: Limpieza de listeners al destruir componente
 */
export class CleanupComponentExample implements OnInit {
  private socketService = inject(SocketService);

  ngOnInit() {
    // Los observables ya se limpian automáticamente con takeUntil en el servicio
    // Pero si necesitas remover un listener específico:
    this.socketService.on$<any>('custom-event')
      .subscribe(data => {
        console.log('Evento personalizado:', data);
      });
  }

  ngOnDestroy() {
    // Remover listeners específicos si es necesario
    this.socketService.removeListener('custom-event');
  }
}

/**
 * EJEMPLO 8: Desconexión manual (por ejemplo, al hacer logout)
 */
export class LogoutExample {
  private socketService = inject(SocketService);

  logout() {
    // Desconectar el socket antes de hacer logout
    this.socketService.disconnect();

    // Limpiar token y redirigir
    localStorage.removeItem('token');
    // router.navigate(['/login']);
  }
}

/**
 * EJEMPLO 9: Uso con guards de autenticación
 */
export class AuthGuardExample {
  private socketService = inject(SocketService);

  canActivate(): boolean {
    const token = localStorage.getItem('token');

    if (token && !this.socketService.isSocketConnected()) {
      // Reconectar si hay token pero no hay conexión
      this.socketService.connect({
        url: 'http://localhost:3000',
        auth: { token }
      });
    }

    return !!token;
  }
}
