import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// BAHA 3D SHOWCASE — static frontend only (no backend). One host, 5 routes via react-router.
// Each demo route is a lazy chunk (see src/App.tsx), so no manual chunking is needed.
// Public hostname served through the Cloudflare Tunnel (ingress → http://localhost:5180).
const TUNNEL_HOSTS = ['nhap-5website.bahagroup.vn'];

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5180,
    strictPort: true,
    allowedHosts: TUNNEL_HOSTS,
    // QC writes screenshots/traces under qc-evidence/ while the dev server runs — never reload the page for those.
    watch: { ignored: ['**/qc-evidence/**', '**/reference/**', '**/dist/**', '**/test-results/**'] },
  },
  preview: { host: true, port: 5181, strictPort: true, allowedHosts: TUNNEL_HOSTS },
  build: { target: 'es2022', chunkSizeWarningLimit: 1800 },
});
