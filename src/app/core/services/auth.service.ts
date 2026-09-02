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
    const saved = localStorage.getItem('educore_user');
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return {
      id: '71111111-1111-4111-8111-000000000001',
      email: 'rectoria@sanbartolome.edu.co',
      primerNombre: 'Carlos',
      primerApellido: 'Mendoza',
      role: 'RECTOR',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    };
  }

  private getInitialToken(): string | null {
    return localStorage.getItem('educore_token') || TOKENS_BY_ROLE['RECTOR'];
  }

  readonly user = signal<User | null>(this.getInitialUser());
  readonly currentUser = computed(() => this.user());
  readonly colegiosDisponibles = signal<Colegio[]>([]);
  readonly colegio = signal<Colegio>(COLEGIOS_DEMO[0]);
  readonly token = signal<string | null>(this.getInitialToken());

  readonly isAuthenticated = computed(() => !!this.user() && !!this.token());

  constructor(private readonly router: Router) {
    this.cargarColegios();
  }

  private cargarColegios() {
    const customColegiosRaw = localStorage.getItem('educore_colegios_custom');
    let lista = [...COLEGIOS_DEMO];
    if (customColegiosRaw) {
      try {
        const customColegios = JSON.parse(customColegiosRaw);
        if (Array.isArray(customColegios)) {
          lista = [...customColegios, ...COLEGIOS_DEMO];
        }
      } catch (e) {
        console.error('Error cargando colegios personalizados', e);
      }
    }
    this.colegiosDisponibles.set(lista);

    const savedColegioId = localStorage.getItem('educore_colegio_id');
    if (savedColegioId) {
      const found = lista.find((c) => c.id === savedColegioId);
      if (found) {
        this.colegio.set(found);
        return;
      }
    }
    this.colegio.set(lista[0]);
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

    const idGenerado = crypto?.randomUUID ? crypto.randomUUID() : 'col-' + Date.now();

    const colegioCreado: Colegio = {
      id: idGenerado,
      nombre: nuevoColegio.nombre || 'Nueva Institución Educativa',
      razonSocial: nuevoColegio.razonSocial || nuevoColegio.nombre,
      slug: slugGenerado,
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
    this.colegiosDisponibles.update(cols => [colegioCreado, ...cols]);
    this.setColegio(colegioCreado);

    // Actualizar rector si se proporcionó
    if (adminData) {
      this.user.set({
        id: 'usr-admin-' + Date.now(),
        email: adminData.email,
        primerNombre: adminData.nombre,
        primerApellido: adminData.apellido,
        role: 'RECTOR',
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

  loginDemo(role: 'RECTOR' | 'DOCENTE' | 'TESORERO' | 'COORDINADOR' | 'ESTUDIANTE', colegioIndex: number = 0) {
    const cols = this.colegiosDisponibles();
    const col = cols[colegioIndex] || cols[0] || COLEGIOS_DEMO[0];
    this.setColegio(col);

    let nombre = 'Carlos';
    let apellido = 'Mendoza';
    let email = `rectoria@${col.slug}.edu.co`;

    if (role === 'DOCENTE') {
      nombre = 'Diana';
      apellido = 'Gómez';
      email = `diana.gomez@${col.slug}.edu.co`;
    } else if (role === 'TESORERO') {
      nombre = 'Andrés';
      apellido = 'Salazar';
      email = `tesoreria@${col.slug}.edu.co`;
    } else if (role === 'COORDINADOR') {
      nombre = 'Marta';
      apellido = 'Rojas';
      email = `coordinacion@${col.slug}.edu.co`;
    } else if (role === 'ESTUDIANTE') {
      nombre = 'Felipe';
      apellido = 'García';
      email = `felipe.garcia@estudiantes.${col.slug}.edu.co`;
    }

    const userUuidMap: Record<string, string> = {
      RECTOR: '71111111-1111-4111-8111-000000000001',
      DOCENTE: '71111111-1111-4111-8111-000000000003',
      TESORERO: '71111111-1111-4111-8111-000000000004',
      COORDINADOR: '71111111-1111-4111-8111-000000000002',
      ESTUDIANTE: '11111111-1111-4111-8111-000000000001',
    };

    const userObj = {
      id: userUuidMap[role] || '71111111-1111-4111-8111-000000000001',
      email,
      primerNombre: nombre,
      primerApellido: apellido,
      role,
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    };

    this.user.set(userObj);
    const tokenVal = TOKENS_BY_ROLE[role] || TOKENS_BY_ROLE['RECTOR'];
    this.token.set(tokenVal);
    localStorage.setItem('educore_user', JSON.stringify(userObj));
    localStorage.setItem('educore_token', tokenVal);
    this.router.navigate(['/dashboard']);
  }

  logout() {
    this.user.set(null);
    this.token.set(null);
    localStorage.removeItem('educore_user');
    localStorage.removeItem('educore_token');
    this.router.navigate(['/login']);
  }
}
