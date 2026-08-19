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

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  readonly user = signal<User | null>({
    id: 'usr-rector-001',
    email: 'rectoria@sanbartolome.edu.co',
    primerNombre: 'Carlos',
    primerApellido: 'Mendoza',
    role: 'RECTOR',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  });

  readonly currentUser = computed(() => this.user());
  readonly colegiosDisponibles = signal<Colegio[]>([]);
  readonly colegio = signal<Colegio>(COLEGIOS_DEMO[0]);
  readonly token = signal<string | null>('demo-jwt-token-educoreos-2026');

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

    this.user.set({
      id: `usr-${role.toLowerCase()}-01`,
      email,
      primerNombre: nombre,
      primerApellido: apellido,
      role,
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    });

    this.token.set('demo-jwt-token-educoreos-2026');
    this.router.navigate(['/dashboard']);
  }

  logout() {
    this.user.set(null);
    this.token.set(null);
    localStorage.removeItem('educore_token');
    this.router.navigate(['/login']);
  }
}
