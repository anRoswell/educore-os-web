const localApiOrigin = 'http://localhost:3001';

export function getApiOrigin(): string {
  if (
    typeof window !== 'undefined' &&
    /^(localhost|127\.0\.0\.1)$/.test(window.location.hostname)
  ) {
    return localApiOrigin;
  }

  return '';
}

export function getApiBaseUrl(): string {
  return `${getApiOrigin()}/api/v1`;
}

export function resolveApiResourceUrl(path: string): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${getApiOrigin()}${cleanPath}`;
}
