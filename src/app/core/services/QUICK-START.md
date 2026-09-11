# Socket Service - Quick Start Guide

## ⚡ Inicio Rápido en 5 Minutos

### 1️⃣ Instalar Dependencia (1 minuto)

```bash
npm install socket.io-client
```

### 2️⃣ Inicializar en app.component.ts (2 minutos)

```typescript
import { Component, OnInit, inject, effect } from '@angular/core';
import { SocketService } from '@app/core/services';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
})
export class AppComponent implements OnInit {
  private socketService = inject(SocketService);

  ngOnInit() {
    // Obtener token (si tienes autenticación)
    const token = localStorage.getItem('token');

    // Conectar al backend
    this.socketService.connect({
      url: '', // Usa el dominio actual mediante el proxy
      path: '/socket.io',
      auth: { token },
    });

    // (Opcional) Monitorear estado de conexión
    effect(() => {
      console.log('Socket conectado:', this.socketService.isConnected());
    });
  }
}
```

### 3️⃣ Usar en Cualquier Componente (2 minutos)

```typescript
import { Component, OnInit, inject } from '@angular/core';
import { SocketService, ServerSocketEvents } from '@app/core/services';

@Component({
  selector: 'app-notifications',
  template: `
    <div *ngFor="let notif of notifications">
      {{ notif.message }}
    </div>
  `,
})
export class NotificationsComponent implements OnInit {
  private socketService = inject(SocketService);
  notifications: any[] = [];

  ngOnInit() {
    // Escuchar evento del servidor
    this.socketService.on$<any>(ServerSocketEvents.NEW_NOTIFICATION).subscribe((notification) => {
      this.notifications.push(notification);
      console.log('Nueva notificación:', notification);
    });
  }

  // Emitir evento al servidor
  sendMessage(message: string) {
    this.socketService.emit('send-message', { content: message });
  }
}
```

---

## 🎯 Casos de Uso Más Comunes

### Chat / Mensajería

```typescript
// Escuchar mensajes nuevos
this.socketService.on$<ChatMessage>('new-message')
  .subscribe(message => {
    this.messages.push(message);
  });

// Enviar mensaje
sendMessage(content: string) {
  this.socketService.emit('send-message', {
    receiverId: 'user123',
    content: content
  });
}
```

### Notificaciones en Tiempo Real

```typescript
// Escuchar notificaciones
this.socketService.on$<Notification>('new-notification')
  .subscribe(notification => {
    this.showToast(notification.message);
  });

// Marcar como leída
markAsRead(id: string) {
  this.socketService.emit('mark-notification-read', { notificationId: id });
}
```

### Asistencia Escolar

```typescript
// Escuchar actualizaciones de asistencia
this.socketService.on$<AttendanceEvent>('attendance-updated')
  .subscribe(event => {
    this.updateGrid(event);
  });

// Marcar asistencia
markAttendance(studentId: string, status: string) {
  this.socketService.emit('attendance-update', {
    studentId,
    status
  });
}
```

---

## 🔧 Configuración por Entorno

### Development (localhost)

```typescript
this.socketService.connect({
  url: '',
  path: '/socket.io',
});
```

### Production (HTTPS)

```typescript
this.socketService.connect({
  url: 'https://api.educoreos.com',
  path: '/socket.io',
  transports: ['websocket'], // Solo websocket en producción
  auth: { token: this.authService.getToken() },
});
```

---

## 📱 Indicador de Estado de Conexión

```typescript
@Component({
  selector: 'app-connection-status',
  template: `
    <div class="status-indicator">
      @if (isConnected()) {
        <span class="badge badge-success">🟢 Conectado</span>
      } @else {
        <span class="badge badge-danger">🔴 Desconectado</span>
      }
    </div>
  `,
})
export class ConnectionStatusComponent {
  private socketService = inject(SocketService);
  isConnected = this.socketService.isConnected;
}
```

---

## 🚨 Desconectar al Hacer Logout

```typescript
logout() {
  // 1. Desconectar socket
  this.socketService.disconnect();

  // 2. Limpiar token
  localStorage.removeItem('token');

  // 3. Redirigir a login
  this.router.navigate(['/login']);
}
```

---

## ⚠️ Troubleshooting Rápido

### Problema: No se conecta

```typescript
// Verifica la URL y que el backend esté corriendo
console.log('Intentando conectar al dominio actual mediante el proxy');
```

### Problema: Token inválido

```typescript
// El servidor rechaza la conexión si el token es inválido
// Verifica el token antes de conectar
const token = localStorage.getItem('token');
if (token) {
  this.socketService.connect({
    url: '',
    auth: { token },
  });
}
```

### Problema: Eventos no se reciben

```typescript
// Verifica que el nombre del evento sea correcto (case-sensitive)
// Verifica en la consola los logs del servicio
this.socketService.on$('new-message'); // ✅ Correcto
this.socketService.on$('newMessage'); // ❌ Diferente evento
```

---

## 📚 Más Información

- **Documentación completa**: `SOCKET-SERVICE-README.md`
- **Ejemplos detallados**: `socket.service.usage.example.ts`
- **Implementación backend**: `BACKEND-SOCKET-IMPLEMENTATION.md`
- **Configuración entornos**: `socket.environment.example.ts`

---

## ✅ Checklist de Implementación

- [ ] Instalar `socket.io-client`
- [ ] Inicializar en `app.component.ts`
- [ ] Conectar con token JWT
- [ ] Escuchar eventos necesarios
- [ ] Emitir eventos al servidor
- [ ] Mostrar indicador de conexión
- [ ] Desconectar en logout
- [ ] Probar en desarrollo

---

**¡Listo! Ya puedes usar el Socket Service en tu aplicación.** 🚀

Si necesitas más ayuda, revisa la documentación completa en los archivos mencionados arriba.
