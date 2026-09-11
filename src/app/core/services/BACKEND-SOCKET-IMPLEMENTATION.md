# Implementación de Socket.IO en el Backend NestJS

Esta guía muestra cómo implementar el servidor Socket.IO en el backend NestJS de EduCoreOS para que funcione con el `SocketService` del frontend.

---

## 📦 1. Instalación de Dependencias

```bash
cd EduCoreOS-api
npm install @nestjs/websockets @nestjs/platform-socket.io socket.io
npm install -D @types/socket.io
```

---

## 🔧 2. Crear el Gateway de Socket.IO

Crea el archivo `src/socket/socket.gateway.ts`:

```typescript
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@WebSocketGateway({
  cors: {
    origin: ['https://qa-educoreos.secticsolar.site', 'https://app.educoreos.com'],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
})
export class SocketGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private logger = new Logger('SocketGateway');
  private connectedUsers = new Map<string, string>(); // socketId -> userId

  constructor(private jwtService: JwtService) {}

  // Se ejecuta cuando el gateway se inicializa
  afterInit(server: Server) {
    this.logger.log('Socket.IO Gateway inicializado');
  }

  // Se ejecuta cuando un cliente se conecta
  async handleConnection(client: Socket) {
    try {
      // Extraer y validar el token JWT
      const token = client.handshake.auth.token;

      if (!token) {
        this.logger.warn(`Cliente ${client.id} sin token, desconectando...`);
        client.disconnect();
        return;
      }

      // Validar el token
      const payload = await this.jwtService.verifyAsync(token);
      const userId = payload.sub || payload.userId;

      // Guardar asociación socket-usuario
      this.connectedUsers.set(client.id, userId);

      // Unir al usuario a su sala personal (para mensajes directos)
      client.join(`user:${userId}`);

      this.logger.log(`Cliente conectado: ${client.id} | Usuario: ${userId}`);

      // Notificar al cliente que está conectado
      client.emit('connected', {
        socketId: client.id,
        userId: userId,
        timestamp: new Date(),
      });

      // Notificar a otros usuarios que este usuario está online
      this.server.emit('user-status-change', {
        userId: userId,
        status: 'online',
        timestamp: new Date(),
      });
    } catch (error) {
      this.logger.error(`Error en conexión: ${error.message}`);
      client.emit('error', { message: 'Token inválido o expirado' });
      client.disconnect();
    }
  }

  // Se ejecuta cuando un cliente se desconecta
  handleDisconnect(client: Socket) {
    const userId = this.connectedUsers.get(client.id);

    if (userId) {
      this.logger.log(`Cliente desconectado: ${client.id} | Usuario: ${userId}`);

      // Notificar a otros usuarios que este usuario está offline
      this.server.emit('user-status-change', {
        userId: userId,
        status: 'offline',
        timestamp: new Date(),
      });

      this.connectedUsers.delete(client.id);
    } else {
      this.logger.log(`Cliente desconectado: ${client.id}`);
    }
  }

  // Responder a ping con pong (heartbeat)
  @SubscribeMessage('ping')
  handlePing(@ConnectedSocket() client: Socket) {
    client.emit('pong');
    return { event: 'pong', data: { timestamp: new Date() } };
  }

  // Evento de autenticación (si se requiere reautenticación)
  @SubscribeMessage('authenticate')
  async handleAuthenticate(
    @MessageBody() data: { token: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const payload = await this.jwtService.verifyAsync(data.token);
      const userId = payload.sub || payload.userId;

      this.connectedUsers.set(client.id, userId);
      client.join(`user:${userId}`);

      return {
        event: 'authenticated',
        data: { success: true, userId },
      };
    } catch (error) {
      return {
        event: 'error',
        data: { message: 'Token inválido' },
      };
    }
  }

  // Ejemplo: Enviar mensaje a un usuario específico
  @SubscribeMessage('send-message')
  handleSendMessage(
    @MessageBody() data: { receiverId: string; content: string },
    @ConnectedSocket() client: Socket,
  ) {
    const senderId = this.connectedUsers.get(client.id);

    if (!senderId) {
      client.emit('error', { message: 'No autenticado' });
      return;
    }

    const message = {
      id: this.generateId(),
      senderId,
      receiverId: data.receiverId,
      content: data.content,
      timestamp: new Date(),
      read: false,
    };

    // Enviar a la sala del receptor
    this.server.to(`user:${data.receiverId}`).emit('new-message', message);

    // Confirmar al emisor
    client.emit('message-sent', {
      messageId: message.id,
      timestamp: message.timestamp,
    });

    this.logger.log(`Mensaje de ${senderId} a ${data.receiverId}: ${data.content}`);

    return { event: 'message-sent', data: { messageId: message.id } };
  }

  // Ejemplo: Broadcast a todos los usuarios conectados
  @SubscribeMessage('broadcast')
  handleBroadcast(@MessageBody() data: any) {
    this.server.emit('system-alert', {
      level: 'info',
      message: data.message,
      timestamp: new Date(),
    });
  }

  // Métodos auxiliares para emitir eventos desde otros servicios

  /**
   * Envía notificación a un usuario específico
   */
  sendNotificationToUser(userId: string, notification: any) {
    this.server.to(`user:${userId}`).emit('new-notification', notification);
    this.logger.log(`Notificación enviada a usuario ${userId}`);
  }

  /**
   * Envía evento a todos los usuarios conectados
   */
  broadcastToAll(event: string, data: any) {
    this.server.emit(event, data);
    this.logger.log(`Broadcast: ${event}`);
  }

  /**
   * Envía evento a usuarios específicos
   */
  sendToUsers(userIds: string[], event: string, data: any) {
    userIds.forEach((userId) => {
      this.server.to(`user:${userId}`).emit(event, data);
    });
    this.logger.log(`Evento ${event} enviado a ${userIds.length} usuarios`);
  }

  /**
   * Obtiene el número de usuarios conectados
   */
  getConnectedUsersCount(): number {
    return this.connectedUsers.size;
  }

  /**
   * Verifica si un usuario está conectado
   */
  isUserConnected(userId: string): boolean {
    return Array.from(this.connectedUsers.values()).includes(userId);
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
```

---

## 📁 3. Crear el Módulo de Socket

Crea el archivo `src/socket/socket.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { SocketGateway } from './socket.gateway';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key',
      signOptions: { expiresIn: '7d' },
    }),
  ],
  providers: [SocketGateway],
  exports: [SocketGateway],
})
export class SocketModule {}
```

---

## 🔗 4. Importar en el AppModule

Edita `src/app.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { SocketModule } from './socket/socket.module';
// ... otros imports

@Module({
  imports: [
    // ... otros módulos
    SocketModule,
  ],
  // ...
})
export class AppModule {}
```

---

## 💡 5. Usar el Gateway en Otros Servicios

Ejemplo: Enviar notificaciones desde un servicio:

```typescript
import { Injectable } from '@nestjs/common';
import { SocketGateway } from '../socket/socket.gateway';

@Injectable()
export class NotificationService {
  constructor(private socketGateway: SocketGateway) {}

  async sendNotification(userId: string, title: string, message: string) {
    // Guardar en base de datos
    const notification = await this.notificationRepository.save({
      userId,
      title,
      message,
      read: false,
      createdAt: new Date(),
    });

    // Enviar en tiempo real por socket
    this.socketGateway.sendNotificationToUser(userId, {
      id: notification.id,
      title: notification.title,
      message: notification.message,
      type: 'info',
      createdAt: notification.createdAt,
    });

    return notification;
  }
}
```

---

## 🔐 6. Configuración de CORS en main.ts

Asegúrate de que CORS está configurado correctamente:

```typescript
// src/main.ts
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // CORS para HTTP y WebSocket
  app.enableCors({
    origin: [
      'https://qa-educoreos.secticsolar.site',
      'https://app.educoreos.com',
      'https://*.educoreos.com',
    ],
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
  });

  // ... resto de la configuración

  await app.listen(3000);
}
```

---

## 🚀 7. Eventos Personalizados para EduCoreOS

### Asistencia en Tiempo Real

```typescript
@SubscribeMessage('attendance-update')
async handleAttendanceUpdate(
  @MessageBody() data: { studentId: string; status: string },
  @ConnectedSocket() client: Socket
) {
  const teacherId = this.connectedUsers.get(client.id);

  // Guardar asistencia en BD
  const attendance = await this.attendanceService.markAttendance({
    studentId: data.studentId,
    status: data.status,
    markedBy: teacherId
  });

  // Notificar a todos los profesores del curso
  this.server.to(`course:${attendance.courseId}`).emit('attendance-updated', {
    studentId: data.studentId,
    status: data.status,
    timestamp: new Date()
  });

  // Notificar a los padres del estudiante
  const parents = await this.userService.getParents(data.studentId);
  parents.forEach(parent => {
    this.sendNotificationToUser(parent.id, {
      type: 'attendance',
      message: `Asistencia registrada: ${data.status}`,
      studentId: data.studentId
    });
  });

  return { success: true, attendanceId: attendance.id };
}
```

### Calificaciones en Tiempo Real

```typescript
@SubscribeMessage('grade-update')
async handleGradeUpdate(
  @MessageBody() data: { studentId: string; activityId: string; grade: number },
  @ConnectedSocket() client: Socket
) {
  const teacherId = this.connectedUsers.get(client.id);

  // Guardar calificación
  const gradeRecord = await this.gradeService.saveGrade({
    ...data,
    publishedBy: teacherId
  });

  // Notificar al estudiante
  this.sendNotificationToUser(data.studentId, {
    type: 'grade-published',
    message: 'Nueva calificación publicada',
    grade: data.grade,
    activityId: data.activityId
  });

  // Notificar a los padres
  const parents = await this.userService.getParents(data.studentId);
  parents.forEach(parent => {
    this.sendNotificationToUser(parent.id, {
      type: 'grade-published',
      message: `Nueva calificación para su hijo/a`,
      studentId: data.studentId,
      grade: data.grade
    });
  });

  return { success: true, gradeId: gradeRecord.id };
}
```

---

## 🧪 8. Testing

Prueba la conexión desde el frontend:

```bash
# Terminal 1: Iniciar backend
cd EduCoreOS-api
npm run start:dev

# Terminal 2: Iniciar frontend
cd EduCoreOS-web
npm start
```

Abre la consola del navegador y deberías ver:

```
[SocketService] Iniciando conexión a: /socket.io
[SocketService] ✅ Conectado con ID: abc123xyz
[SocketService] Recibido evento: connected {...}
```

---

## 📊 9. Monitoreo y Debugging

### Logs en el Backend

```typescript
this.logger.log(`Usuarios conectados: ${this.getConnectedUsersCount()}`);
this.logger.log(`Usuario ${userId} está ${this.isUserConnected(userId) ? 'online' : 'offline'}`);
```

### Dashboard de Sockets (Opcional)

Instala `@socket.io/admin-ui` para un dashboard web:

```bash
npm install @socket.io/admin-ui
```

```typescript
import { instrument } from '@socket.io/admin-ui';

afterInit(server: Server) {
  instrument(server, {
    auth: false, // En producción, configurar auth
    mode: 'development'
  });
  this.logger.log('Socket.IO Admin UI en /admin/queues');
}
```

---

## ✅ Checklist de Implementación

- [ ] Instalar dependencias de Socket.IO
- [ ] Crear SocketGateway con autenticación JWT
- [ ] Crear SocketModule e importar en AppModule
- [ ] Configurar CORS en main.ts
- [ ] Implementar eventos personalizados (mensajería, notificaciones, asistencia)
- [ ] Probar conexión desde el frontend
- [ ] Implementar manejo de errores y reconexión
- [ ] Agregar logging para debugging
- [ ] Documentar eventos personalizados
- [ ] Configurar para producción (HTTPS, rate limiting)

---

## 🔒 10. Seguridad

### Rate Limiting

```typescript
import { ThrottlerGuard } from '@nestjs/throttler';
import { UseGuards } from '@nestjs/common';

@UseGuards(ThrottlerGuard)
@SubscribeMessage('send-message')
handleSendMessage(...) {
  // Limitado a X requests por minuto
}
```

### Validación de Datos

```typescript
import { IsString, IsNotEmpty } from 'class-validator';

class SendMessageDto {
  @IsString()
  @IsNotEmpty()
  receiverId: string;

  @IsString()
  @IsNotEmpty()
  content: string;
}

@SubscribeMessage('send-message')
async handleSendMessage(
  @MessageBody(new ValidationPipe()) data: SendMessageDto,
  @ConnectedSocket() client: Socket
) {
  // data está validado
}
```

---

## 📚 Referencias

- [NestJS WebSockets Documentation](https://docs.nestjs.com/websockets/gateways)
- [Socket.IO Server Documentation](https://socket.io/docs/v4/server-api/)
- [Socket.IO Authentication](https://socket.io/docs/v4/middlewares/#sending-credentials)

---

**¡El Socket Service está listo para usar!** 🚀

Para integrarlo en tu aplicación:

1. Implementa el backend siguiendo esta guía
2. Instala `socket.io-client` en el frontend: `npm install socket.io-client`
3. Inicializa el servicio en `app.component.ts`
4. Usa los ejemplos de `socket.service.usage.example.ts`
