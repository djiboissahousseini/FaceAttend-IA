const API = 'http://localhost:8000';

export const logger = {
  info: (message: string, source: string = 'FRONTEND') => {
    sendToBackend(message, 'INFO', source);
    console.log(`[${source}] ${message}`);
  },
  error: (message: string, source: string = 'FRONTEND') => {
    sendToBackend(message, 'ERROR', source);
    console.error(`[${source}] ${message}`);
  },
  warn: (message: string, source: string = 'FRONTEND') => {
    sendToBackend(message, 'WARN', source);
    console.warn(`[${source}] ${message}`);
  }
};

async function sendToBackend(message: string, level: string, source: string) {
  try {
    await fetch(`${API}/api/logs/client`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, level, source })
    });
  } catch (e) {
    // Fail silently to avoid infinite loops
  }
}
