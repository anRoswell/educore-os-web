/**
 * Barrel export para servicios del core
 * Facilita la importación de servicios en otros módulos
 */

export { SocketService, SocketConnectionState } from './socket.service';
export type { SocketConfig } from './socket.service';

export {
  ClientSocketEvents,
  ServerSocketEvents,
  type ChatMessage,
  type Notification,
  type UserStatus,
  type AttendanceEvent,
  type GradeEvent,
  type PaymentEvent,
  type SystemAlert,
  type SocketError,
  type AuthResponse
} from './socket-events.types';
