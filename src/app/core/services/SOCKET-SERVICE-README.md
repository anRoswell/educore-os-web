# Socket Service - Documentación Completa

## 📋 Índice

1. [Descripción General](#descripción-general)
2. [Instalación](#instalación)
3. [Características](#características)
4. [Configuración](#configuración)
5. [Uso Básico](#uso-básico)
6. [API Completa](#api-completa)
7. [Ejemplos de Uso](#ejemplos-de-uso)
8. [Mejores Prácticas](#mejores-prácticas)
9. [Troubleshooting](#troubleshooting)

---

## 📖 Descripción General

El `SocketService` es un servicio centralizado para la gestión de conexiones WebSocket mediante Socket.IO en aplicaciones Angular. Implementa las mejores prácticas de programación y manejo de estado reactivo.

### Características Principales

- ✅ **Reconexión Automática**: Backoff exponencial con límite configurable de intentos
- ✅ **Estado Reactivo**: Uso de Signals de Angular para estado de conexión observable
- ✅ **Tipos TypeScript**: Fuertemente tipado para eventos y mensajes
- ✅ **RxJS Observables**: Eventos del socket como streams reactivos
- ✅ **Limpieza Automática**: Uso de `DestroyRef` para liberar recursos
- ✅ **Autenticación JWT**: Soporte integrado para tokens de autenticación
- ✅ **Heartbeat/Ping-Pong**: Detección de conexiones muertas
- ✅ **Logging Detallado**: Sistema de logs para debugging
- ✅ **Request-Response**: Patrón con acknowledgements
- ✅ **Error Handling**: Manejo robusto de errores de conexión

---

## 🔧 Instalación

### 1. Instalar dependencia de Socket.IO Client

```bash
npm install socket.io-client
```

### 2. Importar el servicio

El servicio ya está configurado con `providedIn: 'root'`, por lo que está disponible globalmente.

```typescript
import { SocketService } from '@app/core/services/socket.service';
```

---

## ⚙️ Configuración

### Interfaz de Configuración

```typescript
interface SocketConfig {
  url: string;                    // URL del servidor (ej: 'http://localhost:3000')
  path?: string;                  // Path del socket (default: '/socket.io')
  reconnection?: boolean;         // Habilitar reconexión automática (default: true)
  reconnectionAttempts?: number;  // Máximo de intentos (default: 5)
  reconnectionDelay?: number;     // Delay inicial en ms (default: 1000)
  reconnectionDelayMax?: number;  // Delay máximo en ms (default: 5000)
  timeout?: number;               // Timeout de conexión en ms (default: 20000)
  autoConnect?: boolean;          // Conectar automáticamente (default: false)
  transports?: string[];          // Transportes a usar (default: ['websocket', 'polling'])
  auth?: Record<string, any>;     // Datos de autenticación (ej: token JWT)
}
```

### Configuración por Defecto

```typescript
{
  path: '/socket.io',
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  timeout: 20000,
  autoConnect: false,
  transports: ['websocket', 'polling']
}
```

---

## 🚀 Uso Básico

### 1. Conectar al Servidor

```typescript
import { Component, OnInit, inject } from '@angular/core';
import { SocketService } from '@app/core/services/socket.service';

@Component({
  selector: 'app-root',
  template: `...`
})
export class AppComponent implements OnInit {
  private socketService = inject(SocketService);

  ngOnInit() {
    const token = localStorage.getItem('token');

    this.socketService.connect({
      url: 'http://localhost:3000',
      path: '/socket.io',
      auth: { token }
    });
  }
}
```

### 2. Escuchar Eventos

```typescript
// Escuchar un evento y recibir datos tipados
this.socketService.on$<MessageData>('new-message')
  .subscribe(message => {
    console.log('Mensaje recibido:', message);
  });
```

### 3. Emitir Eventos

```typescript
// Emitir un evento con datos
this.socketService.emit('send-message', {
  to: 'user123',
  content: 'Hola mundo'
});
```

### 4. Monitorear Estado de Conexión

```typescript
import { effect } from '@angular/core';

constructor() {
  // Reactive signal que actualiza automáticamente la UI
  effect(() => {
    const isConnected = this.socketService.isConnected();
    console.log('Conectado:', isConnected);
  });

  effect(() => {
    const state = this.socketService.connectionState();
    console.log('Estado:', state);
    // Posibles valores: 'disconnected', 'connecting', 'connected', 'reconnecting', 'error'
  });
}
```

---

## 📚 API Completa

### Métodos Principales

#### `connect(config: SocketConfig): void`

Inicia la conexión con el servidor Socket.IO.

```typescript
this.socketService.connect({
  url: 'http://localhost:3000',
  auth: { token: 'jwt-token-here' }
});
```

#### `disconnect(): void`

Desconecta el socket y limpia todos los recursos.

```typescript
this.socketService.disconnect();
```

#### `reconnect(): void`

Fuerza una reconexión manual.

```typescript
this.socketService.reconnect();
```

#### `emit<T>(event: string, data?: T): void`

Emite un evento al servidor sin esperar respuesta.

```typescript
this.socketService.emit('join-room', { roomId: '123' });
```

#### `emitWithAck<T, R>(event: string, data?: T): Promise<R>`

Emite un evento y espera respuesta del servidor (patrón request-response).

```typescript
const response = await this.socketService.emitWithAck<
  { roomId: string },
  { success: boolean }
>('join-room', { roomId: '123' });

console.log('Respuesta:', response);
```

#### `on$<T>(event: string): Observable<T>`

Escucha un evento del servidor y retorna un Observable tipado.

```typescript
this.socketService.on$<ChatMessage>('new-message')
  .subscribe(message => {
    console.log(message);
  });
```

#### `once$<T>(event: string): Observable<T>`

Escucha un evento una sola vez y luego se completa.

```typescript
this.socketService.once$<{ welcome: string }>('welcome')
  .subscribe(data => {
    console.log(data.welcome);
  });
```

#### `removeListener(event: string): void`

Remueve todos los listeners de un evento específico.

```typescript
this.socketService.removeListener('custom-event');
```

#### `getSocketId(): string | undefined`

Obtiene el ID único del socket actual.

```typescript
const socketId = this.socketService.getSocketId();
console.log('Socket ID:', socketId);
```

#### `isSocketConnected(): boolean`

Verifica si el socket está conectado actualmente.

```typescript
if (this.socketService.isSocketConnected()) {
  console.log('Socket está conectado');
}
```

### Signals Reactivos

#### `connectionState: Signal<SocketConnectionState>`

Signal que contiene el estado actual de la conexión.

Valores posibles:
- `'disconnected'`: Sin conexión
- `'connecting'`: Intentando conectar
- `'connected'`: Conectado exitosamente
- `'reconnecting'`: Intentando reconectar
- `'error'`: Error de conexión

```typescript
const state = this.socketService.connectionState();
```

#### `isConnected: Signal<boolean>`

Signal booleano que indica si está conectado.

```typescript
const connected = this.socketService.isConnected();
```

#### `lastError: Signal<string | null>`

Signal que contiene el último error de conexión.

```typescript
const error = this.socketService.lastError();
if (error) {
  console.error('Error:', error);
}
```

---

## 💡 Ejemplos de Uso

### Ejemplo 1: Sistema de Chat

```typescript
export class ChatComponent implements OnInit {
  private socketService = inject(SocketService);
  messages: ChatMessage[] = [];

  ngOnInit() {
    // Escuchar mensajes nuevos
    this.socketService.on$<ChatMessage>('new-message')
      .subscribe(message => {
        this.messages.push(message);
      });

    // Escuchar indicador de escritura
    this.socketService.on$<{ user: string }>('user-typing')
      .subscribe(data => {
        console.log(`${data.user} está escribiendo...`);
      });
  }

  sendMessage(content: string) {
    this.socketService.emit('send-message', {
      content,
      timestamp: new Date()
    });
  }
}
```

### Ejemplo 2: Notificaciones en Tiempo Real

```typescript
export class NotificationsComponent implements OnInit {
  private socketService = inject(SocketService);
  notifications = signal<Notification[]>([]);

  ngOnInit() {
    this.socketService.on$<Notification>('new-notification')
      .subscribe(notification => {
        this.notifications.update(current => [...current, notification]);
        this.showToast(notification);
      });
  }

  markAsRead(notificationId: string) {
    this.socketService.emit('mark-read', { notificationId });
  }

  private showToast(notification: Notification) {
    // Implementar lógica de toast
  }
}
```

### Ejemplo 3: Asistencia en Tiempo Real

```typescript
export class AttendanceComponent implements OnInit {
  private socketService = inject(SocketService);

  ngOnInit() {
    this.socketService.on$<AttendanceEvent>('attendance-updated')
      .subscribe(event => {
        this.updateAttendanceGrid(event);
        this.showNotification(`Asistencia actualizada para ${event.studentId}`);
      });
  }

  markAttendance(studentId: string, status: string) {
    this.socketService.emit('mark-attendance', {
      studentId,
      status,
      timestamp: new Date()
    });
  }

  private updateAttendanceGrid(event: AttendanceEvent) {
    // Actualizar grid de asistencia
  }

  private showNotification(message: string) {
    // Mostrar notificación
  }
}
```

### Ejemplo 4: Componente de Estado de Conexión

```typescript
@Component({
  selector: 'app-connection-status',
  template: `
    <div class="connection-status" [class]="statusClass()">
      @if (isConnected()) {
        <span>🟢 Conectado</span>
      } @else if (connectionState() === 'reconnecting') {
        <span>🟡 Reconectando...</span>
      } @else {
        <span>🔴 Desconectado</span>
      }

      @if (lastError()) {
        <span class="error">{{ lastError() }}</span>
      }

      @if (!isConnected()) {
        <button (click)="reconnect()">Reconectar</button>
      }
    </div>
  `
})
export class ConnectionStatusComponent {
  private socketService = inject(SocketService);

  isConnected = this.socketService.isConnected;
  connectionState = this.socketService.connectionState;
  lastError = this.socketService.lastError;

  statusClass = computed(() => {
    return `status-${this.connectionState()}`;
  });

  reconnect() {
    this.socketService.reconnect();
  }
}
```

---

## ✅ Mejores Prácticas

### 1. Inicialización en el Componente Principal

Conecta el socket en `app.component.ts` para que esté disponible globalmente:

```typescript
export class AppComponent implements OnInit {
  private socketService = inject(SocketService);

  ngOnInit() {
    const token = this.authService.getToken();
    if (token) {
      this.socketService.connect({
        url: environment.socketUrl,
        auth: { token }
      });
    }
  }
}
```

### 2. Desconectar al Hacer Logout

```typescript
logout() {
  this.socketService.disconnect();
  localStorage.removeItem('token');
  this.router.navigate(['/login']);
}
```

### 3. Uso de Tipos TypeScript

Define tipos para tus eventos y datos:

```typescript
interface UserTypingEvent {
  userId: string;
  userName: string;
  roomId: string;
}

this.socketService.on$<UserTypingEvent>('user-typing')
  .subscribe(data => {
    // TypeScript conoce la estructura de 'data'
    console.log(`${data.userName} está escribiendo`);
  });
```

### 4. Manejo de Errores

```typescript
this.socketService.on$('error')
  .subscribe(error => {
    console.error('Socket error:', error);
    this.showErrorToast('Error de conexión');
  });
```

### 5. Limpieza de Listeners

Los observables se limpian automáticamente gracias a `takeUntil(this.destroy$)`, pero puedes remover listeners específicos:

```typescript
ngOnDestroy() {
  this.socketService.removeListener('custom-event');
}
```

### 6. Uso de Variables de Entorno

```typescript
// environment.ts
export const environment = {
  production: false,
  socketUrl: 'http://localhost:3000',
  socketPath: '/socket.io'
};

// Uso
this.socketService.connect({
  url: environment.socketUrl,
  path: environment.socketPath
});
```

### 7. Reconexión con Nuevo Token

```typescript
reconnectWithNewToken(newToken: string) {
  this.socketService.disconnect();

  setTimeout(() => {
    this.socketService.connect({
      url: environment.socketUrl,
      auth: { token: newToken }
    });
  }, 100);
}
```

---

## 🔍 Troubleshooting

### Problema: El socket no se conecta

**Solución:**
1. Verifica que el servidor esté corriendo
2. Verifica la URL y el puerto
3. Revisa la consola para ver mensajes de error
4. Verifica que CORS esté configurado en el servidor

```typescript
// Backend NestJS - Configuración CORS para Socket.IO
app.enableCors({
  origin: 'http://localhost:4200',
  credentials: true
});
```

### Problema: Reconexiones infinitas

**Solución:**
El servicio limita automáticamente las reconexiones a 5 intentos. Si necesitas más:

```typescript
this.socketService.connect({
  url: 'http://localhost:3000',
  reconnectionAttempts: 10  // Aumentar intentos
});
```

### Problema: Token JWT expirado

**Solución:**
Implementa un interceptor para renovar el token y reconectar:

```typescript
if (tokenExpired()) {
  const newToken = await this.authService.refreshToken();
  this.socketService.disconnect();
  this.socketService.connect({
    url: environment.socketUrl,
    auth: { token: newToken }
  });
}
```

### Problema: Eventos no se reciben

**Solución:**
1. Verifica que el evento esté bien escrito (case-sensitive)
2. Verifica que el servidor esté emitiendo el evento
3. Usa el logging del servicio para debugging:

```typescript
// El servicio ya incluye logging automático
// Revisa la consola del navegador para ver todos los eventos
```

### Problema: Memory leaks

**Solución:**
El servicio maneja automáticamente la limpieza con `DestroyRef` y `takeUntil`. Asegúrate de no crear subscripciones manuales sin cleanup:

```typescript
// ❌ MAL - puede causar memory leak
this.socketService.on$('event').subscribe(...);

// ✅ BIEN - el servicio limpia automáticamente
this.socketService.on$('event')
  .pipe(takeUntil(this.destroy$))
  .subscribe(...);
```

---

## 🎯 Resumen

Este `SocketService` proporciona:

- ✅ Gestión robusta de conexiones WebSocket
- ✅ Estado reactivo con Signals de Angular
- ✅ Reconexión automática inteligente
- ✅ Tipos TypeScript para seguridad en desarrollo
- ✅ Integración con RxJS para programación reactiva
- ✅ Limpieza automática de recursos
- ✅ Sistema de logging para debugging
- ✅ Soporte para autenticación JWT
- ✅ Heartbeat para detectar conexiones muertas

Para más ejemplos, consulta el archivo `socket.service.usage.example.ts`.
