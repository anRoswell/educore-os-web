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
  readonly colegio = signal<Colegio>(COLEGIOS_DEMO[0]);
  readonly token = signal<string | null>('demo-jwt-token-educoreos-2026');

  readonly isAuthenticated = computed(() => !!this.user() && !!this.token());
  readonly colegiosDisponibles = signal<Colegio[]>(COLEGIOS_DEMO);

  constructor(private readonly router: Router) {
    const savedColegioId = localStorage.getItem('educore_colegio_id');
    if (savedColegioId) {
      const found = COLEGIOS_DEMO.find((c) => c.id === savedColegioId);
      if (found) this.colegio.set(found);
    }
  }

  setColegio(colegio: Colegio) {
    this.colegio.set(colegio);
    localStorage.setItem('educore_colegio_id', colegio.id);
    localStorage.setItem('educore_colegio_slug', colegio.slug);
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

  loginDemo(role: 'RECTOR' | 'DOCENTE' | 'TESORERO' | 'COORDINADOR', colegioIndex: number = 0) {
    const col = COLEGIOS_DEMO[colegioIndex] || COLEGIOS_DEMO[0];
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
