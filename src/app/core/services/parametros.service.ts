import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Parametro {
  id: string;
  grupo: string;
  codigo: string;
  nombre: string;
  valor?: string;
  descripcion?: string;
  orden: number;
  activo: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ParametrosService {
  private readonly API_URL = 'http://localhost:3001/api/v1/parametros'; // Assuming standard proxy or interceptor appends base URL

  constructor(private http: HttpClient) {}

  obtenerPorGrupo(grupo: string): Observable<Parametro[]> {
    return this.http.get<Parametro[]>(this.API_URL, {
      params: { grupo }
    });
  }

  obtenerPorCodigo(grupo: string, codigo: string): Observable<Parametro> {
    return this.http.get<Parametro>(`${this.API_URL}/${grupo}/${codigo}`);
  }
}
