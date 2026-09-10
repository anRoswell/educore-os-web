import { Injectable, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { User, Colegio } from '../models';

export const COLEGIOS_DEMO: Colegio[] = [
  {
    id: '11111111-2222-3333-4444-555555555555',
    nombre: 'Colegio Mayor de San Bartolomé',
    slug: 'san-bartolome',
    nit: '890.102.345-1',
    codigoDane: '111001002003',
    ciudad: 'Bogotá D.C.',
    direccion: 'Cra. 7 # 35-42',
    emailContacto: 'contacto@sanbartolome.edu.co',
    telefonoContacto: '+57 (601) 3456789',
    logoUrl: 'https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=160&auto=format&fit=crop&q=80',
    colorPrimario: '#1e3a8a',
    colorSecundario: '#d97706',
    plan: 'ENTERPRISE',
    modulosActivos: ['M01', 'M02', 'M03', 'M04', 'M05', 'M06', 'M07', 'M08', 'M09', 'M10', 'M11', 'M12', 'M13', 'M14', 'M15', 'M16'],
  },
  {
    id: '22222222-3333-4444-5555-666666666666',
    nombre: 'Gimnasio Campestre La Colina',
    slug: 'gimnasio-campestre',
    nit: '900.876.543-2',
    codigoDane: '111001004567',
    ciudad: 'Medellín',
    direccion: 'Km 7 Vía Las Palmas',
    emailContacto: 'info@lacolina.edu.co',
    telefonoContacto: '+57 (604) 4441234',
    logoUrl: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=160&auto=format&fit=crop&q=80',
    colorPrimario: '#065f46',
    colorSecundario: '#10b981',
    plan: 'STANDARD',
    modulosActivos: ['M01', 'M02', 'M03', 'M04', 'M05', 'M06', 'M07', 'M08'],
  },
  {
    id: '33333333-4444-5555-6666-777777777777',
    nombre: 'Liceo Bilingüe Internacional',
    slug: 'liceo-bilingue',
    nit: '800.123.987-9',
    codigoDane: '111001008901',
    ciudad: 'Cali',
    direccion: 'Av. Cañasgordas # 120-40',
    emailContacto: 'admissions@liceobilingue.edu.co',
    telefonoContacto: '+57 (602) 5557890',
    logoUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=160&auto=format&fit=crop&q=80',
    colorPrimario: '#4f46e5',
    colorSecundario: '#06b6d4',
    plan: 'ENTERPRISE',
    modulosActivos: ['M01', 'M02', 'M03', 'M04', 'M05', 'M06', 'M07', 'M08', 'M09', 'M10', 'M11', 'M12', 'M13', 'M14', 'M15', 'M16'],
  },
];

export const TOKENS_BY_ROLE: Record<string, string> = {
  SUPER_ADMIN: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI5OTk5OTk5OS05OTk5LTk5OTktOTk5OS05OTk5OTk5OTk5OTkiLCJlbWFpbCI6InN1cGVyYWRtaW5AcG9zY29yZS5jbyIsInJvbGUiOiJTVVBFUl9BRE1JTiIsInJvbGVzIjpbIlNVUEVSX0FETUlOIl0sInBlcm1pc3Npb25zIjpbIioiXSwiY29sZWdpb0lkIjoiMTExMTExMTEtMjIyMi0zMzMzLTQ0NDQtNTU1NTU1NTU1NTU1IiwiaWF0IjoxNzcyMzkwMDAwLCJleHAiOjE5OTk5OTk5OTl9.1Dlc76bQYUZzEEZBqolhdLc0415ZAX3OkTgaeNhkOIQ',
  RECTOR: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI3MTExMTExMS0xMTExLTQxMTEtODExMS0wMDAwMDAwMDAwMDEiLCJlbWFpbCI6InJlY3RvcmlhQHNhbmJhcnRvbG9tZS5lZHUuY28iLCJyb2xlIjoiUkVDVE9SIiwicm9sZXMiOlsiUkVDVE9SIiwiU1VQRVJfQURNSU4iXSwicGVybWlzc2lvbnMiOlsiKiJdLCJjb2xlZ2lvSWQiOiIxMTExMTExMS0yMjIyLTMzMzMtNDQ0NC01NTU1NTU1NTU1NTUiLCJpYXQiOjE3NzIzOTAwMDAsImV4cCI6MTk5OTk5OTk5OX0.Xrwb9ON-U9pdmv2LL3eh0EAHUusgXqMoA7wtImPgnbs',
  DOCENTE: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI3MTExMTExMS0xMTExLTQxMTEtODExMS0wMDAwMDAwMDAwMDMiLCJlbWFpbCI6ImRpYW5hLmdvbWV6QHNhbmJhcnRvbG9tZS5lZHUuY28iLCJyb2xlIjoiRE9DRU5URSIsInJvbGVzIjpbIkRPQ0VOVEUiLCJTVVBFUl9BRE1JTiJdLCJwZXJtaXNzaW9ucyI6WyIqIl0sImNvbGVnaW9JZCI6IjExMTExMTExLTIyMjItMzMzMy00NDQ0LTU1NTU1NTU1NTU1NSIsImlhdCI6MTc3MjM5MDAwMCwiZXhwIjoxOTk5OTk5OTk5fQ.NOptpIEF6LFJEeY9M27LDneX223gwLfxqRwQ4P31BQ0',
  TESORERO: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI3MTExMTExMS0xMTExLTQxMTEtODExMS0wMDAwMDAwMDAwMDQiLCJlbWFpbCI6InRlc29yZXJpYUBzYW5iYXJ0b2xvbWUuZWR1LmNvIiwicm9sZSI6IlRFU09SRVJPIiwicm9sZXMiOlsiVEVTT1JFUk8iLCJTVVBFUl9BRE1JTiJdLCJwZXJtaXNzaW9ucyI6WyIqIl0sImNvbGVnaW9JZCI6IjExMTExMTExLTIyMjItMzMzMy00NDQ0LTU1NTU1NTU1NTU1NSIsImlhdCI6MTc3MjM5MDAwMCwiZXhwIjoxOTk5OTk5OTk5fQ.5mU3AyPxvnefxPhWW51nLrBNA2_LMa_w8Pz5bygRJYA',
  COORDINADOR: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI3MTExMTExMS0xMTExLTQxMTEtODExMS0wMDAwMDAwMDAwMDIiLCJlbWFpbCI6ImNvb3JkaW5hY2lvbkBzYW5iYXJ0b2xvbWUuZWR1LmNvIiwicm9sZSI6IkNPT1JESU5BRE9SIiwicm9sZXMiOlsiQ09PUkRJTkFET1IiLCJTVVBFUl9BRE1JTiJdLCJwZXJtaXNzaW9ucyI6WyIqIl0sImNvbGVnaW9JZCI6IjExMTExMTExLTIyMjItMzMzMy00NDQ0LTU1NTU1NTU1NTU1NSIsImlhdCI6MTc3MjM5MDAwMCwiZXhwIjoxOTk5OTk5OTk5fQ.VraPpeoWMiqbn84wr0mQr9NZoy5UvknAQnIfSIHlxhE',
  ESTUDIANTE: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMTExMTExMS0xMTExLTQxMTEtODExMS0wMDAwMDAwMDAwMDEiLCJlbWFpbCI6Im1hcmlhbmFAZWR1Y29yZW9zLmNvbSIsInJvbGUiOiJFU1RVRElBTlRFIiwicm9sZXMiOlsiRVNUVURJQU5URSIsIlNVUEVSX0FETUlOIl0sInBlcm1pc3Npb25zIjpbIioiXSwiY29sZWdpb0lkIjoiMTExMTExMTEtMjIyMi0zMzMzLTQ0NDQtNTU1NTU1NTU1NTU1IiwiaWF0IjoxNzcyMzkwMDAwLCJleHAiOjE5OTk5OTk5OTl9.Lr1MWbGgqI7qK9LhuJ6c9KtOFn8Jdj9IEWf-UazXuGc',
};

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private getInitialUser(): User | null {
    if (typeof localStorage === 'undefined') {
      return {
        id: '71111111-1111-4111-8111-000000000001',
        email: 'rectoria@sanbartolome.edu.co',
        primerNombre: 'Carlos',
        primerApellido: 'Mendoza',
        role: 'RECTOR',
        colegioId: '11111111-2222-3333-4444-555555555555',
        colegiosIds: ['11111111-2222-3333-4444-555555555555'],
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      };
    }
    const saved = localStorage.getItem('educore_user');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (!parsed.colegioId) {
          parsed.colegioId = '11111111-2222-3333-4444-555555555555';
          parsed.colegiosIds = ['11111111-2222-3333-4444-555555555555'];
        }
        return parsed;
      } catch {}
    }
    return {
      id: '71111111-1111-4111-8111-000000000001',
      email: 'rectoria@sanbartolome.edu.co',
      primerNombre: 'Carlos',
      primerApellido: 'Mendoza',
      role: 'RECTOR',
      colegioId: '11111111-2222-3333-4444-555555555555',
      colegiosIds: ['11111111-2222-3333-4444-555555555555'],
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    };
  }

  private getInitialToken(): string | null {
    if (typeof localStorage === 'undefined') {
      return TOKENS_BY_ROLE['RECTOR'];
    }
    return localStorage.getItem('educore_token') || TOKENS_BY_ROLE['RECTOR'];
  }

  readonly user = signal<User | null>(this.getInitialUser());
  readonly currentUser = computed(() => this.user());
  readonly todosLosColegios = signal<Colegio[]>([]);

  readonly colegiosDisponibles = computed<Colegio[]>(() => {
    const todos = this.todosLosColegios();
    const u = this.user();
    if (!u) {
      return todos;
    }
    if (u.role === 'SUPER_ADMIN') {
      return todos;
    }

    if (u.colegiosIds && u.colegiosIds.length > 0) {
      const filtrados = todos.filter((c) => u.colegiosIds!.includes(c.id));
      if (filtrados.length > 0) return filtrados;
    }

    if (u.colegioId) {
      const filtrados = todos.filter((c) => c.id === u.colegioId);
      if (filtrados.length > 0) return filtrados;
    }

    const emailLower = (u.email || '').toLowerCase();
    const matchEmail = todos.filter((c) => {
      const slugClean = c.slug.replace(/-/g, '');
      return (
        emailLower.includes(c.slug) ||
        emailLower.includes(slugClean) ||
        (c.emailContacto && emailLower === c.emailContacto.toLowerCase())
      );
    });
    if (matchEmail.length > 0) return matchEmail;

    const actual = this.colegio();
    return actual ? [actual] : (todos.length > 0 ? [todos[0]] : []);
  });

  readonly colegio = signal<Colegio>(COLEGIOS_DEMO[0]);
  readonly token = signal<string | null>(this.getInitialToken());

  readonly isAuthenticated = computed(() => !!this.user() && !!this.token());

  constructor(private readonly router: Router) {
    this.cargarColegios();
  }

  private cargarColegios() {
    if (typeof localStorage === 'undefined') {
      this.todosLosColegios.set([...COLEGIOS_DEMO]);
      return;
    }
    const customColegiosRaw = localStorage.getItem('educore_colegios_custom');
    let lista = [...COLEGIOS_DEMO];
    if (customColegiosRaw) {
      try {
        const customColegios = JSON.parse(customColegiosRaw);
        if (Array.isArray(customColegios)) {
          lista = [...COLEGIOS_DEMO, ...customColegios];
        }
      } catch (e) {
        console.error('Error cargando colegios personalizados', e);
      }
    }

    // Aplicar overrides de módulos si existen
    const overridesRaw = localStorage.getItem('educore_colegios_modules_override');
    if (overridesRaw) {
      try {
        const overrides: Record<string, string[]> = JSON.parse(overridesRaw);
        lista = lista.map((col) => {
          if (overrides[col.id]) {
            return { ...col, modulosActivos: overrides[col.id] };
          }
          return col;
        });
      } catch {}
    }

    this.todosLosColegios.set(lista);

    const u = this.user();
    if (u && u.role !== 'SUPER_ADMIN' && u.colegioId) {
      const userCol = lista.find((c) => c.id === u.colegioId);
      if (userCol) {
        this.colegio.set(userCol);
        return;
      }
    }

    const savedColegioId = localStorage.getItem('educore_colegio_id');
    if (savedColegioId) {
      const found = lista.find((c) => c.id === savedColegioId);
      if (found) {
        this.colegio.set(found);
        return;
      }
    }
    this.colegio.set(COLEGIOS_DEMO[0]);
  }

  setColegio(colegio: Colegio) {
    this.colegio.set(colegio);
    localStorage.setItem('educore_colegio_id', colegio.id);
    localStorage.setItem('educore_colegio_slug', colegio.slug);
  }

  registrarNuevoColegio(
    nuevoColegio: Partial<Colegio>,
    adminData?: { nombre: string; apellido: string; email: string }
  ): Colegio {
    const slugGenerado = (nuevoColegio.slug || nuevoColegio.nombre || 'colegio-nuevo')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');

    const idGenerado = nuevoColegio.id || (crypto?.randomUUID ? crypto.randomUUID() : 'col-' + Date.now());

    const colegioCreado: Colegio = {
      id: idGenerado,
      nombre: nuevoColegio.nombre || 'Nueva Institución Educativa',
      razonSocial: nuevoColegio.razonSocial || nuevoColegio.nombre,
      slug: nuevoColegio.slug || slugGenerado,
      nit: nuevoColegio.nit || '900.000.000-1',
      codigoDane: nuevoColegio.codigoDane || '111001' + Math.floor(100000 + Math.random() * 900000),
      ciudad: nuevoColegio.ciudad || 'Bogotá D.C.',
      direccion: nuevoColegio.direccion || 'Sede Principal',
      emailContacto: nuevoColegio.emailContacto || (adminData?.email || 'contacto@' + slugGenerado + '.edu.co'),
      telefonoContacto: nuevoColegio.telefonoContacto || '+57 (601) 7000000',
      logoUrl: nuevoColegio.logoUrl || '',
      colorPrimario: nuevoColegio.colorPrimario || '#4f46e5',
      colorSecundario: nuevoColegio.colorSecundario || '#10b981',
      plan: nuevoColegio.plan || 'ENTERPRISE',
      modulosActivos: ['M01', 'M02', 'M03', 'M04', 'M05', 'M06', 'M07', 'M08', 'M09', 'M10', 'M11', 'M12', 'M13', 'M14', 'M15', 'M16'],
    };

    // Guardar en localStorage
    const customColegiosRaw = localStorage.getItem('educore_colegios_custom');
    let customColegios: Colegio[] = [];
    if (customColegiosRaw) {
      try { customColegios = JSON.parse(customColegiosRaw); } catch {}
    }
    customColegios.unshift(colegioCreado);
    localStorage.setItem('educore_colegios_custom', JSON.stringify(customColegios));

    // Actualizar signal y seleccionar el nuevo colegio
    this.todosLosColegios.update(cols => [colegioCreado, ...cols]);
    this.setColegio(colegioCreado);

    // Actualizar rector si se proporcionó
    if (adminData) {
      this.user.set({
        id: 'usr-admin-' + Date.now(),
        email: adminData.email,
        primerNombre: adminData.nombre,
        primerApellido: adminData.apellido,
        role: 'RECTOR',
        colegioId: colegioCreado.id,
        colegiosIds: [colegioCreado.id],
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      });
    }

    return colegioCreado;
  }

  hasRole(role: string): boolean {
    const u = this.user();
    if (!u) return false;
    return u.role === 'SUPER_ADMIN' || u.role === 'RECTOR' || u.role === role;
  }

  hasPermission(permission: string): boolean {
    const u = this.user();
    if (!u) return false;
    return u.role === 'SUPER_ADMIN' || u.role === 'RECTOR';
  }

  isModuloActivo(moduloCodigo: string): boolean {
    const col = this.colegio();
    if (!col) return true;
    if (!col.modulosActivos || col.modulosActivos.length === 0) return true;
    return col.modulosActivos.includes(moduloCodigo);
  }

  loginDemo(role: 'RECTOR' | 'DOCENTE' | 'TESORERO' | 'COORDINADOR' | 'ESTUDIANTE', targetColegio?: Colegio) {
    const col = targetColegio || COLEGIOS_DEMO[0];
    this.setColegio(col);

    const domain = col.slug.replace(/-/g, '');
    let nombre = 'Carlos';
    let apellido = 'Mendoza';
    let email = `rectoria@${domain}.edu.co`;

    if (role === 'DOCENTE') {
      nombre = 'Diana';
      apellido = 'Gómez';
      email = `diana.gomez@${domain}.edu.co`;
    } else if (role === 'TESORERO') {
      nombre = 'Andrés';
      apellido = 'Salazar';
      email = `tesoreria@${domain}.edu.co`;
    } else if (role === 'COORDINADOR') {
      nombre = 'Marta';
      apellido = 'Rojas';
      email = `coordinacion@${domain}.edu.co`;
    } else if (role === 'ESTUDIANTE') {
      nombre = 'Felipe';
      apellido = 'García';
      email = `felipe.garcia@estudiantes.${domain}.edu.co`;
    }

    const userUuidMap: Record<string, string> = {
      RECTOR: '71111111-1111-4111-8111-000000000001',
      DOCENTE: '71111111-1111-4111-8111-000000000003',
      TESORERO: '71111111-1111-4111-8111-000000000004',
      COORDINADOR: '71111111-1111-4111-8111-000000000002',
      ESTUDIANTE: '11111111-1111-4111-8111-000000000001',
    };

    const userObj: User = {
      id: userUuidMap[role] || '71111111-1111-4111-8111-000000000001',
      email,
      primerNombre: nombre,
      primerApellido: apellido,
      role,
      colegioId: col.id,
      colegiosIds: [col.id],
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    };

    this.user.set(userObj);
    const tokenVal = TOKENS_BY_ROLE[role] || TOKENS_BY_ROLE['RECTOR'];
    this.token.set(tokenVal);
    localStorage.setItem('educore_user', JSON.stringify(userObj));
    localStorage.setItem('educore_token', tokenVal);
    this.router.navigate(['/dashboard']);
  }

  loginWithCredentials(email: string, password?: string): { success: boolean; message?: string } {
    const emailLower = (email || '').toLowerCase().trim();
    const pass = (password || '').trim();

    if (!emailLower || !pass) {
      return {
        success: false,
        message: 'Por favor ingresa tu correo institucional y tu contraseña.',
      };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailLower)) {
      return {
        success: false,
        message: 'El formato del correo institucional ingresado no es válido.',
      };
    }

    // 1. Super Administrador SaaS (Cuentas globales y maestras de la plataforma)
    if (
      emailLower.startsWith('superadmin@') ||
      emailLower.includes('superadmin') ||
      emailLower === 'admin@poscore.co' ||
      emailLower === 'admin@educoreos.com' ||
      emailLower === 'admin@educore.co' ||
      emailLower === 'admin@sectic.com'
    ) {
      const validSuperAdminPasswords = [
        'EduCore2026*',
        'SuperAdmin2026*',
        'Admin2026*',
        'PosCore2026*',
        '123456',
      ];

      if (!validSuperAdminPasswords.includes(pass) && pass.length < 6) {
        return {
          success: false,
          message: 'Contraseña incorrecta para el usuario Super Administrador.',
        };
      }

      const userObj: User = {
        id: '99999999-9999-9999-9999-999999999999',
        email: emailLower,
        primerNombre: 'Super',
        primerApellido: 'Administrador',
        role: 'SUPER_ADMIN',
        avatarUrl:
          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      };
      this.user.set(userObj);
      const tokenVal = TOKENS_BY_ROLE['SUPER_ADMIN'];
      this.token.set(tokenVal);
      localStorage.setItem('educore_user', JSON.stringify(userObj));
      localStorage.setItem('educore_token', tokenVal);
      this.router.navigate(['/dashboard']);
      return { success: true };
    }

    // 2. Localizar la Institución Educativa por el dominio o slug del correo
    const domainPart = emailLower.split('@')[1] || '';
    const todos = this.todosLosColegios();

    const colEncontrado = todos.find((c) => {
      const slugClean = c.slug.replace(/-/g, '');
      const contactDomain = (c.emailContacto || '').split('@')[1] || '';
      return (
        emailLower.includes(c.slug) ||
        emailLower.includes(slugClean) ||
        domainPart.includes(c.slug) ||
        domainPart.includes(slugClean) ||
        (contactDomain && domainPart === contactDomain) ||
        (c.emailContacto && emailLower === c.emailContacto.toLowerCase())
      );
    });

    if (!colEncontrado) {
      return {
        success: false,
        message: `No existe ninguna institución educativa registrada para el dominio '@${domainPart}'.`,
      };
    }

    // 3. Validación de Contraseña
    const validPasswords = ['EduCore2026*', 'Demo2026*', 'Colegio2026*', '123456'];
    if (!validPasswords.includes(pass)) {
      return {
        success: false,
        message: 'Correo institucional o contraseña incorrectos. Por favor intenta nuevamente.',
      };
    }

    // 4. Identificación del Rol
    let role: 'RECTOR' | 'DOCENTE' | 'TESORERO' | 'COORDINADOR' | 'ESTUDIANTE' = 'RECTOR';
    if (
      emailLower.startsWith('docente') ||
      emailLower.startsWith('diana') ||
      emailLower.includes('profesor')
    ) {
      role = 'DOCENTE';
    } else if (
      emailLower.startsWith('tesoreria') ||
      emailLower.startsWith('andres') ||
      emailLower.includes('contabilidad')
    ) {
      role = 'TESORERO';
    } else if (
      emailLower.startsWith('coordinacion') ||
      emailLower.startsWith('marta')
    ) {
      role = 'COORDINADOR';
    } else if (
      emailLower.startsWith('estudiante') ||
      emailLower.startsWith('felipe') ||
      emailLower.includes('estudiantes.')
    ) {
      role = 'ESTUDIANTE';
    } else if (
      emailLower.startsWith('rector') ||
      emailLower.startsWith('carlos') ||
      emailLower.startsWith('admin') ||
      emailLower.startsWith('contacto') ||
      emailLower.startsWith('info')
    ) {
      role = 'RECTOR';
    } else {
      // Usuario no reconocido para ese dominio
      return {
        success: false,
        message: `El usuario '${email}' no se encuentra registrado en ${colEncontrado.nombre}.`,
      };
    }

    this.loginDemo(role, colEncontrado);
    return { success: true };
  }

  logout() {
    this.user.set(null);
    this.token.set(null);
    localStorage.removeItem('educore_user');
    localStorage.removeItem('educore_token');
    localStorage.removeItem('educore_colegio_id');
    localStorage.removeItem('educore_colegio_slug');
    this.colegio.set(COLEGIOS_DEMO[0]);
    this.router.navigate(['/login']);
  }
}
