// Configuration dynamique de l'API
// Détecte automatiquement l'adresse du serveur (IP ou localhost)
export const API_URL =
  typeof window !== 'undefined'
    ? `${window.location.protocol}//${window.location.hostname}:8000`
    : 'http://localhost:8000';

// Utile pour afficher l'adresse aux étudiants si nécessaire
export const NETWORK_IP = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
