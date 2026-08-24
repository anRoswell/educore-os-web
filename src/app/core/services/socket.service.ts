import { Injectable, inject, DestroyRef, signal } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable, Subject, fromEvent, merge, timer } from 'rxjs';
import { takeUntil, tap, retryWhen, delayWhen, take } from 'rxjs/operators';

/**
 * Estado de la conexión del socket
 */
export enum SocketConnectionState {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  RECONNECTING = 'reconnecting',
  ERROR = 'error'
}

/**
 * Configuración del socket con valores por defecto
 */
export interface SocketConfig {
  url: string;
  path?: string;
  reconnection?: boolean;
  reconnectionAttempts?: number;
  reconnectionDelay?: number;
  reconnectionDelayMax?: number;
  timeout?: number;
  autoConnect?: boolean;
  transports?: string[];
  auth?: Record<string, any>;
}

/**
 * Servicio centralizado para la gestión de conexiones Socket.IO
 *
 * Implementa las siguientes mejores prácticas:
 * - Manejo automático de reconexión con backoff exponencial
 * - Observables tipados para eventos del socket
 * - Manejo de estado de conexión reactivo con signals
 * - Limpieza automática de recursos con DestroyRef
 * - Autenticación JWT integrada
 * - Sistema de heartbeat para detectar conexiones muertas
 * - Logging detallado de eventos
 *
 * @example
 * constructor(private socketService: SocketService) {
 *   this.socketService.connect({
 *     url: 'http://localhost:3000',
 *     path: '/socket.io',
 *     auth: { token: 'jwt-token' }
 *   });
 *
 *   this.socketService.on$<MessageData>('new-message')
 *     .subscribe(data => console.log(data));
 * }
 */
@Injectable({
  providedIn: 'root'
})
export class SocketService {
  private destroyRef = inject(DestroyRef);
  private socket: Socket | null = null;
  private destroy$ = new Subject<void>();
  private reconnectionAttempts = 0;
  private maxReconnectionAttempts = 5;
  private heartbeatInterval: any = null;

  // Signals para estado reactivo
  public connectionState = signal<SocketConnectionState>(SocketConnectionState.DISCONNECTED);
  public isConnected = signal<boolean>(false);
  public lastError = signal<string | null>(null);

  // Configuración por defecto
  private defaultConfig: Partial<SocketConfig> = {
    path: '/socket.io',
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 20000,
    autoConnect: false,
    transports: ['websocket', 'polling']
  };

  constructor() {
    // Limpieza automática cuando el servicio se destruye
    this.destroyRef.onDestroy(() => {
      this.disconnect();
      this.destroy$.next();
      this.destroy$.complete();
    });
  }

  /**
   * Conecta al servidor de Socket.IO con la configuración proporcionada
   * @param config Configuración de la conexión
   */
  public connect(config: SocketConfig): void {
    if (this.socket?.connected) {
      console.warn('[SocketService] Ya existe una conexión activa');
      return;
    }

    const fullConfig = { ...this.defaultConfig, ...config };
    this.maxReconnectionAttempts = fullConfig.reconnectionAttempts || 5;

    try {
      this.connectionState.set(SocketConnectionState.CONNECTING);

      this.socket = io(fullConfig.url, {
        path: fullConfig.path,
        reconnection: fullConfig.reconnection,
        reconnectionAttempts: fullConfig.reconnectionAttempts,
        reconnectionDelay: fullConfig.reconnectionDelay,
        reconnectionDelayMax: fullConfig.reconnectionDelayMax,
        timeout: fullConfig.timeout,
        autoConnect: fullConfig.autoConnect,
        transports: fullConfig.transports,
        auth: fullConfig.auth
      });

      this.setupEventListeners();

      if (fullConfig.autoConnect !== false) {
        this.socket.connect();
      }

      console.log('[SocketService] Iniciando conexión a:', fullConfig.url);
    } catch (error) {
      this.handleConnectionError('Error al inicializar socket', error);
    }
  }

  /**
   * Desconecta el socket y limpia recursos
   */
  public disconnect(): void {
    if (this.socket) {
      console.log('[SocketService] Desconectando socket...');
      this.stopHeartbeat();
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
      this.connectionState.set(SocketConnectionState.DISCONNECTED);
      this.isConnected.set(false);
      this.reconnectionAttempts = 0;
    }
  }

  /**
   * Reconecta el socket manualmente
   */
  public reconnect(): void {
    if (this.socket) {
      console.log('[SocketService] Reconectando manualmente...');
      this.socket.connect();
    }
  }

  /**
   * Emite un evento al servidor
   * @param event Nombre del evento
   * @param data Datos a enviar
   */
  public emit<T = any>(event: string, data?: T): void {
    if (!this.socket?.connected) {
      console.warn('[SocketService] No se puede emitir evento, socket no conectado:', event);
      return;
    }

    this.socket.emit(event, data);
    console.log(`[SocketService] Emitido evento: ${event}`, data);
  }

  /**
   * Emite un evento y espera respuesta (patrón request-response)
   * @param event Nombre del evento
   * @param data Datos a enviar
   * @returns Promise con la respuesta
   */
  public emitWithAck<T = any, R = any>(event: string, data?: T): Promise<R> {
    return new Promise((resolve, reject) => {
      if (!this.socket?.connected) {
        reject(new Error('Socket no conectado'));
        return;
      }

      const timeout = setTimeout(() => {
        reject(new Error(`Timeout esperando respuesta para evento: ${event}`));
      }, 10000);

      this.socket.emit(event, data, (response: R) => {
        clearTimeout(timeout);
        resolve(response);
      });
    });
  }

  /**
   * Escucha un evento del servidor y retorna un Observable
   * @param event Nombre del evento a escuchar
   * @returns Observable que emite los datos del evento
   */
  public on$<T = any>(event: string): Observable<T> {
    if (!this.socket) {
      throw new Error('Socket no inicializado. Llama a connect() primero.');
    }

    return fromEvent<T>(this.socket, event).pipe(
      takeUntil(this.destroy$),
      tap(data => console.log(`[SocketService] Recibido evento: ${event}`, data))
    );
  }

  /**
   * Escucha un evento una sola vez
   * @param event Nombre del evento
   * @returns Observable que emite una vez y se completa
   */
  public once$<T = any>(event: string): Observable<T> {
    return this.on$<T>(event).pipe(take(1));
  }

  /**
   * Remueve todos los listeners de un evento específico
   * @param event Nombre del evento
   */
  public removeListener(event: string): void {
    if (this.socket) {
      this.socket.off(event);
      console.log(`[SocketService] Removidos listeners del evento: ${event}`);
    }
  }

  /**
   * Configura los listeners internos para eventos del socket
   */
  private setupEventListeners(): void {
    if (!this.socket) return;

    // Evento de conexión exitosa
    this.socket.on('connect', () => {
      console.log('[SocketService] ✅ Conectado con ID:', this.socket?.id);
      this.connectionState.set(SocketConnectionState.CONNECTED);
      this.isConnected.set(true);
      this.lastError.set(null);
      this.reconnectionAttempts = 0;
      this.startHeartbeat();
    });

    // Evento de desconexión
    this.socket.on('disconnect', (reason: string) => {
      console.warn('[SocketService] ⚠️ Desconectado. Razón:', reason);
      this.connectionState.set(SocketConnectionState.DISCONNECTED);
      this.isConnected.set(false);
      this.stopHeartbeat();

      // Razones que no requieren reconexión automática
      if (reason === 'io server disconnect' || reason === 'io client disconnect') {
        console.log('[SocketService] Desconexión intencional, no se reconectará automáticamente');
      }
    });

    // Evento de error de conexión
    this.socket.on('connect_error', (error: Error) => {
      this.reconnectionAttempts++;
      const message = `Error de conexión (intento ${this.reconnectionAttempts}/${this.maxReconnectionAttempts})`;
      console.error(`[SocketService] ❌ ${message}:`, error.message);

      this.connectionState.set(SocketConnectionState.ERROR);
      this.lastError.set(error.message);

      if (this.reconnectionAttempts >= this.maxReconnectionAttempts) {
        console.error('[SocketService] Máximo de intentos de reconexión alcanzado');
        this.disconnect();
      }
    });

    // Evento de intento de reconexión
    this.socket.on('reconnect_attempt', (attempt: number) => {
      console.log(`[SocketService] 🔄 Intento de reconexión ${attempt}...`);
      this.connectionState.set(SocketConnectionState.RECONNECTING);
    });

    // Evento de reconexión exitosa
    this.socket.on('reconnect', (attempt: number) => {
      console.log(`[SocketService] ✅ Reconectado exitosamente después de ${attempt} intentos`);
      this.reconnectionAttempts = 0;
    });

    // Evento de fallo en reconexión
    this.socket.on('reconnect_failed', () => {
      console.error('[SocketService] ❌ Falló la reconexión después de todos los intentos');
      this.connectionState.set(SocketConnectionState.ERROR);
    });

    // Evento de error general
    this.socket.on('error', (error: any) => {
      console.error('[SocketService] ❌ Error del socket:', error);
      this.lastError.set(error?.message || 'Error desconocido');
    });

    // Evento personalizado de pong (respuesta al heartbeat)
    this.socket.on('pong', () => {
      console.log('[SocketService] 💓 Heartbeat recibido (pong)');
    });
  }

  /**
   * Inicia el sistema de heartbeat para detectar conexiones muertas
   */
  private startHeartbeat(): void {
    this.stopHeartbeat();

    this.heartbeatInterval = setInterval(() => {
      if (this.socket?.connected) {
        this.socket.emit('ping');
        console.log('[SocketService] 💓 Heartbeat enviado (ping)');
      }
    }, 30000); // Cada 30 segundos
  }

  /**
   * Detiene el sistema de heartbeat
   */
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * Maneja errores de conexión
   */
  private handleConnectionError(message: string, error: any): void {
    console.error(`[SocketService] ${message}:`, error);
    this.connectionState.set(SocketConnectionState.ERROR);
    this.lastError.set(error?.message || message);
  }

  /**
   * Obtiene el ID del socket actual
   */
  public getSocketId(): string | undefined {
    return this.socket?.id;
  }

  /**
   * Verifica si el socket está conectado
   */
  public isSocketConnected(): boolean {
    return this.socket?.connected || false;
  }
}
