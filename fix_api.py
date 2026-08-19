import sys
content = open('src/app/core/services/api.service.ts').read()

patch_method = """
  patch<T>(endpoint: string, body: any): Observable<T> {
    return this.http.patch<T>(`${this.apiUrl}/${endpoint}`, body, { headers: this.getHeaders() });
  }
"""
content = content.replace("  put<T>(endpoint: string, body: any): Observable<T> {", patch_method + "\n  put<T>(endpoint: string, body: any): Observable<T> {")

with open('src/app/core/services/api.service.ts', 'w') as f:
    f.write(content)
