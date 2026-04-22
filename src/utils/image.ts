import { API_URL } from '../config';

export const getPhotoUrl = (url: string | null | undefined): string | null => {
  if (!url) return null;

  // Si l'URL commence par http
  if (url.startsWith('http')) {
    // Si l'URL contient localhost mais que l'API_URL n'est pas localhost (ex: on est sur mobile via IP)
    // On remplace la portion http://localhost:8000 par l'API_URL réelle (10.142.x.x)
    if (url.includes('localhost') && !API_URL.includes('localhost')) {
      return url.replace(/http:\/\/localhost:\d+/, API_URL);
    }
    return url;
  }

  // Si c'est un chemin relatif (/uploads/...), on ajoute l'API_URL
  const separator = url.startsWith('/') ? '' : '/';
  return `${API_URL}${separator}${url}`;
};
