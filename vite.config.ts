import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// BAHA 3D SHOWCASE — static frontend only (no backend). One host, 5 routes via react-router.
// Each demo route is a lazy chunk (see src/App.tsx), so no manual chunking is needed.
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5180,
    strictPort: true,
    // QC writes screenshots/traces under qc-evidence/ while the dev server runs — never reload the page for those.
    watch: { ignored: ['**/qc-evidence/**', '**/reference/**', '**/dist/**', '**/test-results/**'] },
  },
  preview: { host: true, port: 5181, strictPort: true },
  build: { target: 'es2022', chunkSizeWarningLimit: 1800 },
});
