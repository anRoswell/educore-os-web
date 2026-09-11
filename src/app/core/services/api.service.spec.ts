import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ApiService } from './api.service';

describe('ApiService', () => {
  let service: ApiService;
  let httpMock: HttpTestingController;
  const baseUrl = '/api/v1';

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ApiService],
    });

    service = TestBed.inject(ApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('1. Debe instanciarse el servicio correctamente', () => {
    expect(service).toBeTruthy();
    expect(service.getBaseUrl()).toBe(baseUrl);
  });

  it('2. Debe construir URLs correctamente con getPdfUrl', () => {
    expect(service.getPdfUrl('boletin/123/periodo/1')).toBe(`${baseUrl}/pdf/boletin/123/periodo/1`);
    expect(service.getPdfUrl('/boletin/123/periodo/1')).toBe(
      `${baseUrl}/pdf/boletin/123/periodo/1`,
    );
  });

  it('3. Debe realizar peticiones GET con y sin parámetros query', () => {
    const mockData = [{ id: '1', nombre: 'Periodo 1' }];

    // Sin params
    service.get<any[]>('academico/periodos').subscribe((data) => {
      expect(data).toEqual(mockData);
    });

    const req1 = httpMock.expectOne(`${baseUrl}/academico/periodos`);
    expect(req1.request.method).toBe('GET');
    req1.flush(mockData);

    // Con params
    service
      .get<any[]>('matriculas/estudiantes', { search: 'Carlos', gradoId: 'g1', empty: null })
      .subscribe((data) => {
        expect(data).toEqual(mockData);
      });

    const req2 = httpMock.expectOne(`${baseUrl}/matriculas/estudiantes?search=Carlos&gradoId=g1`);
    expect(req2.request.method).toBe('GET');
    expect(req2.request.params.get('search')).toBe('Carlos');
    expect(req2.request.params.get('gradoId')).toBe('g1');
    expect(req2.request.params.has('empty')).toBe(false);
    req2.flush(mockData);
  });

  it('4. Debe realizar peticiones POST, PUT y PATCH con payload correcto', () => {
    const payload = { nombre: 'Grado 10', nivelId: 'niv-1' };
    const responseData = { id: 'gr-10', ...payload };

    // POST
    service.post('academico/grados', payload).subscribe((res) => {
      expect(res).toEqual(responseData);
    });
    const reqPost = httpMock.expectOne(`${baseUrl}/academico/grados`);
    expect(reqPost.request.method).toBe('POST');
    expect(reqPost.request.body).toEqual(payload);
    reqPost.flush(responseData);

    // PUT
    service.put('academico/grados/gr-10', payload).subscribe((res) => {
      expect(res).toEqual(responseData);
    });
    const reqPut = httpMock.expectOne(`${baseUrl}/academico/grados/gr-10`);
    expect(reqPut.request.method).toBe('PUT');
    expect(reqPut.request.body).toEqual(payload);
    reqPut.flush(responseData);

    // PATCH
    service.patch('academico/grados/gr-10', { nombre: 'Grado 10 Mod' }).subscribe((res) => {
      expect(res).toEqual({ id: 'gr-10', nombre: 'Grado 10 Mod' });
    });
    const reqPatch = httpMock.expectOne(`${baseUrl}/academico/grados/gr-10`);
    expect(reqPatch.request.method).toBe('PATCH');
    reqPatch.flush({ id: 'gr-10', nombre: 'Grado 10 Mod' });
  });

  it('5. Debe realizar peticiones DELETE correctamente', () => {
    service.delete('academico/grados/gr-10').subscribe((res) => {
      expect(res).toEqual({ success: true });
    });

    const req = httpMock.expectOne(`${baseUrl}/academico/grados/gr-10`);
    expect(req.request.method).toBe('DELETE');
    req.flush({ success: true });
  });

  it('6. Debe solicitar archivos Blob con getBlob y postBlob', () => {
    const mockBlob = new Blob(['%PDF-1.4 Mock PDF Content'], { type: 'application/pdf' });

    service.getBlob('academico/boletin/pdf').subscribe((blob) => {
      expect(blob).toBeTruthy();
      expect(blob.type).toBe('application/pdf');
    });

    const reqBlob = httpMock.expectOne(`${baseUrl}/academico/boletin/pdf`);
    expect(reqBlob.request.responseType).toBe('blob');
    reqBlob.flush(mockBlob);

    service.postBlob('academico/cierre-ano', { anio: 2026 }).subscribe((blob) => {
      expect(blob).toBeTruthy();
    });

    const reqPostBlob = httpMock.expectOne(`${baseUrl}/academico/cierre-ano`);
    expect(reqPostBlob.request.method).toBe('POST');
    expect(reqPostBlob.request.responseType).toBe('blob');
    reqPostBlob.flush(mockBlob);
  });

  it('7. Debe subir archivos usando FormData con uploadFile', () => {
    const file = new File(['dummy content'], 'documento.pdf', { type: 'application/pdf' });

    service.uploadFile(file, 'matriculas', 'web').subscribe((res) => {
      expect(res).toEqual({ url: 'http://storage/documento.pdf' });
    });

    const req = httpMock.expectOne(`${baseUrl}/storage/upload`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body instanceof FormData).toBe(true);
    req.flush({ url: 'http://storage/documento.pdf' });
  });
});
