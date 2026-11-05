import { defineConfig, devices } from '@playwright/test';

// Real-GPU Chrome (D3D11) like the BAHA CMS project. Headless/SwiftShader FPS numbers are NOT comparable —
// every QC report must state the GPU/browser condition used.
const GPU = ['--enable-gpu', '--ignore-gpu-blocklist', '--use-angle=d3d11'];

// Parallel builders: give each agent its own port + id so runs never share a server / output folder.
//   QC_MODE=dev  → runs `vite` (no tsc gate, unaffected by other demos' half-edited files). FPS in dev is NOT final.
//   QC_MODE=preview (default) → `npm run build` + `vite preview` = production numbers used for the final QC_REPORT.
const PORT = Number(process.env.QC_PORT ?? 5181);
const MODE = process.env.QC_MODE ?? 'preview';
const ID = process.env.QC_ID ? `-${process.env.QC_ID}` : '';

export default defineConfig({
  testDir: 'tests/qc',
  timeout: 180_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  outputDir: `qc-evidence/artifacts${ID}`,
  reporter: [['list'], ['json', { outputFile: `qc-evidence/results${ID}.json` }]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    channel: 'chrome',
    launchOptions: { args: GPU },
    viewport: { width: 1440, height: 900 },
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    actionTimeout: 15_000,
  },
  projects: [
    { name: 'desktop', testIgnore: /mobile\.spec/ },
    { name: 'mobile', testMatch: /mobile\.spec/, use: { ...devices['iPhone 13'], browserName: 'chromium', channel: 'chrome', launchOptions: { args: GPU } } },
  ],
  webServer: {
    command: MODE === 'dev' ? `npx vite --port ${PORT} --strictPort` : `npm run build && npx vite preview --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: true,
    timeout: 240_000,
    stdout: 'pipe',
    stderr: 'pipe',
  },
});
