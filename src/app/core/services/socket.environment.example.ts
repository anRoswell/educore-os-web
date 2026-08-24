/**
 * CONFIGURACIÓN DE SOCKET.IO PARA DIFERENTES ENTORNOS
 *
 * Este archivo muestra cómo configurar el Socket Service en diferentes entornos.
 * Copia la configuración correspondiente a tu archivo environment.ts
 */

/**
 * DESARROLLO LOCAL
 * Backend corriendo en localhost:3000
 */
export const environmentDevelopment = {
  production: false,
  apiUrl: 'http://localhost:3000/api/v1',
  socket: {
    url: 'http://localhost:3000',
    path: '/socket.io',
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 20000,
    transports: ['websocket', 'polling']
  }
};

/**
 * DESARROLLO - BACKEND EN SERVIDOR REMOTO
 * Backend corriendo en servidor de desarrollo
 */
export const environmentDevServer = {
  production: false,
  apiUrl: 'https://dev-api.educoreos.com/api/v1',
  socket: {
    url: 'https://dev-api.educoreos.com',
    path: '/socket.io',
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 20000,
    transports: ['websocket', 'polling'],
    // En HTTPS, preferir websocket
    secure: true
  }
};

/**
 * STAGING / QA
 * Entorno de pruebas pre-producción
 */
export const environmentStaging = {
  production: false,
  apiUrl: 'https://staging-api.educoreos.com/api/v1',
  socket: {
    url: 'https://staging-api.educoreos.com',
    path: '/socket.io',
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 2000,
    reconnectionDelayMax: 10000,
    timeout: 30000,
    transports: ['websocket', 'polling'],
    secure: true
  }
};

/**
 * PRODUCCIÓN
 * Entorno de producción con configuración optimizada
 */
export const environmentProduction = {
  production: true,
  apiUrl: 'https://api.educoreos.com/api/v1',
  socket: {
    url: 'https://api.educoreos.com',
    path: '/socket.io',
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 2000,
    reconnectionDelayMax: 10000,
    timeout: 30000,
    // En producción, preferir websocket sobre polling
    transports: ['websocket'],
    secure: true,
    // Opciones adicionales de producción
    upgrade: false, // No hacer upgrade de polling a websocket
    rememberUpgrade: true
  }
};

/**
 * CONFIGURACIÓN MULTI-TENANT
 * Para sistemas con múltiples subdominios
 */
export const environmentMultiTenant = {
  production: true,
  // La URL se construye dinámicamente según el subdominio
  getApiUrl: (tenant: string) => `https://${tenant}.educoreos.com/api/v1`,
  getSocketConfig: (tenant: string, token: string) => ({
    url: `https://${tenant}.educoreos.com`,
    path: '/socket.io',
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 2000,
    reconnectionDelayMax: 10000,
    timeout: 30000,
    transports: ['websocket'],
    secure: true,
    auth: {
      token,
      tenant // Enviar tenant en la autenticación
    }
  })
};

/**
 * EJEMPLO DE USO EN app.component.ts
 */
/*
import { Component, OnInit, inject } from '@angular/core';
import { SocketService } from '@app/core/services';
import { environment } from '@env/environment';

@Component({
  selector: 'app-root',
  template: `...`
})
export class AppComponent implements OnInit {
  private socketService = inject(SocketService);

  ngOnInit() {
    const token = localStorage.getItem('token');

    if (token) {
      this.socketService.connect({
        ...environment.socket,
        auth: { token }
      });
    }
  }
}
*/

/**
 * EJEMPLO CON MULTI-TENANT
 */
/*
export class AppComponent implements OnInit {
  private socketService = inject(SocketService);

  ngOnInit() {
    const token = localStorage.getItem('token');
    const tenant = this.getTenantFromUrl(); // Extraer de subdomain

    if (token && tenant) {
      const config = environment.getSocketConfig(tenant, token);
      this.socketService.connect(config);
    }
  }

  private getTenantFromUrl(): string {
    const hostname = window.location.hostname;
    const parts = hostname.split('.');
    return parts[0]; // Primera parte del dominio es el tenant
  }
}
*/

/**
 * NOTAS IMPORTANTES:
 *
 * 1. CORS en el Backend:
 *    El servidor NestJS debe permitir conexiones Socket.IO desde el frontend:
 *
 *    app.enableCors({
 *      origin: ['http://localhost:4200', 'https://app.educoreos.com'],
 *      credentials: true
 *    });
 *
 * 2. WebSocket en Nginx (si usas proxy reverso):
 *
 *    location /socket.io/ {
 *      proxy_pass http://backend:3000;
 *      proxy_http_version 1.1;
 *      proxy_set_header Upgrade $http_upgrade;
 *      proxy_set_header Connection "upgrade";
 *      proxy_set_header Host $host;
 *      proxy_cache_bypass $http_upgrade;
 *    }
 *
 * 3. Transports:
 *    - 'websocket': Más rápido, requiere soporte del servidor
 *    - 'polling': Fallback, funciona en todos lados pero más lento
 *    - En producción con HTTPS, preferir solo websocket
 *
 * 4. Autenticación:
 *    El token JWT se envía en la propiedad 'auth' y el servidor lo valida
 *    al establecer la conexión. Si el token expira, desconectar y reconectar
 *    con el nuevo token.
 *
 * 5. Seguridad:
 *    - Siempre usar HTTPS en producción (secure: true)
 *    - Validar tokens en el servidor
 *    - Implementar rate limiting para eventos del socket
 *    - No enviar información sensible sin cifrar
 */
