// Configuration dynamique de l'API
// - Sur PC local (localhost) → backend direct sur port 8000
// - Sur mobile via tunnel → remplacer TUNNEL_BACKEND_URL par l'URL du tunnel actif
const TUNNEL_BACKEND_URL = 'http://10.142.14.9:8000';

export const API_URL =
  typeof window !== 'undefined' && window.location.hostname === 'localhost'
    ? 'http://localhost:8000'
    : TUNNEL_BACKEND_URL;

export const NETWORK_IP = '10.142.14.9';
