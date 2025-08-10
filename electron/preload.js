const { contextBridge } = require('electron');

// Determine backend URL from query first (packaged), then env vars
let backendURL;
try {
  const url = new URL(window.location.href);
  const explicit = url.searchParams.get('backendUrl');
  if (explicit) backendURL = decodeURIComponent(explicit);
  else {
    const backendPort = url.searchParams.get('backendPort');
    if (backendPort) backendURL = `http://127.0.0.1:${backendPort}/api`;
  }
} catch (_) {
  // ignore
}
if (!backendURL) {
  backendURL = process.env.REMOTE_BACKEND_URL || process.env.VITE_API_URL || 'http://localhost:3000/api';
}

contextBridge.exposeInMainWorld('electron', {
  env: {
    backendURL,
  },
});


