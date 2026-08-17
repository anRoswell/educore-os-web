import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private readonly baseUrl = 'http://localhost:3000/api/v1';

  constructor(private readonly http: HttpClient) { }

  getPdfUrl(path: string): string {
    const clean = path.startsWith('/') ? path.substring(1) : path;
    return `${this.baseUrl}/pdf/${clean}`;
  }

  getBaseUrl(): string {
    return this.baseUrl;
  }

  private buildUrl(endpoint: string): string {
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.substring(1) : endpoint;
    return `${this.baseUrl}/${cleanEndpoint}`;
  }

  get<T>(endpoint: string, params?: Record<string, any>): Observable<T> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach((key) => {
        if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
          httpParams = httpParams.set(key, params[key].toString());
        }
      });
    }
    return this.http.get<T>(this.buildUrl(endpoint), { params: httpParams });
  }

  post<T>(endpoint: string, body: any): Observable<T> {
    return this.http.post<T>(this.buildUrl(endpoint), body);
  }

  put<T>(endpoint: string, body: any): Observable<T> {
    return this.http.put<T>(this.buildUrl(endpoint), body);
  }

  delete<T>(endpoint: string): Observable<T> {
    return this.http.delete<T>(this.buildUrl(endpoint));
  }

  getBlob(endpoint: string): Observable<Blob> {
    return this.http.get(this.buildUrl(endpoint), { responseType: 'blob' });
  }

  uploadFile<T>(file: File, modulo: string = 'documental', origen: string = 'web'): Observable<T> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('modulo', modulo);
    formData.append('categoria', modulo);
    formData.append('origen', origen);
    return this.http.post<T>(this.buildUrl('storage/upload'), formData);
  }
}

