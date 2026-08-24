/**
 * Tipos para eventos del Socket.IO
 * Define la estructura de mensajes entre cliente y servidor
 */

/**
 * Eventos que el cliente puede emitir al servidor
 */
export enum ClientSocketEvents {
  // Eventos de autenticación
  AUTHENTICATE = 'authenticate',

  // Eventos de chat/mensajería
  SEND_MESSAGE = 'send-message',
  TYPING_START = 'typing-start',
  TYPING_STOP = 'typing-stop',

  // Eventos de notificaciones
  MARK_NOTIFICATION_READ = 'mark-notification-read',

  // Eventos de presencia
  USER_ONLINE = 'user-online',
  USER_OFFLINE = 'user-offline',

  // Eventos de asistencia
  ATTENDANCE_UPDATE = 'attendance-update',

  // Eventos de calificaciones
  GRADE_UPDATE = 'grade-update',

  // Eventos de ping/heartbeat
  PING = 'ping'
}

/**
 * Eventos que el servidor puede emitir al cliente
 */
export enum ServerSocketEvents {
  // Eventos de conexión
  CONNECTED = 'connected',
  AUTHENTICATED = 'authenticated',

  // Eventos de mensajería
  NEW_MESSAGE = 'new-message',
  MESSAGE_SENT = 'message-sent',
  USER_TYPING = 'user-typing',

  // Eventos de notificaciones
  NEW_NOTIFICATION = 'new-notification',
  NOTIFICATION_READ = 'notification-read',

  // Eventos de presencia
  USER_STATUS_CHANGE = 'user-status-change',

  // Eventos de asistencia
  ATTENDANCE_UPDATED = 'attendance-updated',
  ATTENDANCE_ALERT = 'attendance-alert',

  // Eventos de calificaciones
  GRADE_PUBLISHED = 'grade-published',
  GRADE_UPDATED = 'grade-updated',

  // Eventos de cartera
  PAYMENT_RECEIVED = 'payment-received',
  PAYMENT_OVERDUE = 'payment-overdue',

  // Eventos de documentos
  DOCUMENT_READY = 'document-ready',
  DOCUMENT_SIGNED = 'document-signed',

  // Eventos de convivencia
  DISCIPLINARY_ACTION = 'disciplinary-action',

  // Eventos de sistema
  SYSTEM_ALERT = 'system-alert',
  MAINTENANCE_MODE = 'maintenance-mode',

  // Eventos de pong/heartbeat
  PONG = 'pong',

  // Eventos de error
  ERROR = 'error'
}

/**
 * Estructura de un mensaje de chat
 */
export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  receiverId: string;
  content: string;
  timestamp: Date;
  read: boolean;
}

/**
 * Estructura de una notificación
 */
export interface Notification {
  id: string;
  userId: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  data?: Record<string, any>;
  read: boolean;
  createdAt: Date;
  expiresAt?: Date;
}

/**
 * Estructura de estado de usuario
 */
export interface UserStatus {
  userId: string;
  status: 'online' | 'offline' | 'away' | 'busy';
  lastSeen?: Date;
}

/**
 * Estructura de evento de asistencia
 */
export interface AttendanceEvent {
  studentId: string;
  courseId: string;
  classDate: Date;
  status: 'presente' | 'ausente' | 'tarde' | 'excusa';
  markedBy: string;
  timestamp: Date;
}

/**
 * Estructura de evento de calificación
 */
export interface GradeEvent {
  studentId: string;
  courseId: string;
  activityId: string;
  grade: number;
  period: number;
  publishedBy: string;
  timestamp: Date;
}

/**
 * Estructura de evento de pago
 */
export interface PaymentEvent {
  studentId: string;
  amount: number;
  concept: string;
  paymentDate: Date;
  receiptNumber: string;
}

/**
 * Estructura de alerta del sistema
 */
export interface SystemAlert {
  level: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
  affectedModules?: string[];
  timestamp: Date;
}

/**
 * Estructura de error del socket
 */
export interface SocketError {
  code: string;
  message: string;
  details?: any;
}

/**
 * Respuesta de autenticación
 */
export interface AuthResponse {
  success: boolean;
  userId?: string;
  message?: string;
}
