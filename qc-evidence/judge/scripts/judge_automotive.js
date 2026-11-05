async (page) => {
  const DEMO = 'automotive';
  const OUT = 'C:/Users/Baha Group/Desktop/repWeb/BAHA_3D_SHOWCASE/qc-evidence/judge/shots/' + DEMO + '-';
  const shot = async (n) => page.screenshot({ path: OUT + n + '.jpg', type: 'jpeg', quality: 80 });
  const st = () => page.evaluate(() => window.__baha3d.getState());
  const errs = [];
  page.on('console', m => { if (m.type() === 'error') errs.push(m.text().slice(0, 300)); });
  page.on('pageerror', e => errs.push('PAGEERR ' + e.message));
  page.on('requestfailed', r => errs.push('REQFAIL ' + r.url()));
  await page.setViewportSize({ width: 1440, height: 900 });
  const t0 = Date.now();
  await page.goto('http://localhost:5199/' + DEMO);
  await page.waitForFunction(() => window.__baha3d && window.__baha3d.getState().ready, null, { timeout: 90000 });
  const tReady = Date.now() - t0;
  await page.waitForTimeout(2000);
  const gpu = await page.evaluate(() => { const c = document.createElement('canvas').getContext('webgl2'); const e = c && c.getExtension('WEBGL_debug_renderer_info'); return e ? c.getParameter(e.UNMASKED_RENDERER_WEBGL) : 'n/a'; });
  const dpr = await page.evaluate(() => devicePixelRatio);
  const res = { tReady, gpu, dpr, steps: {} };
  // idle fps sample
  const f0 = await st(); await page.waitForTimeout(3000); const f1 = await st();
  res.fpsIdle = { before: f0.fps, after: f1.fps };
  // ---- scroll forward
  const poses = {};
  for (const p of [0, 0.25, 0.5, 0.75, 1]) {
    await page.evaluate(p => window.__baha3d.scrollTo(p), p); await page.waitForTimeout(2200);
    const s = await st(); poses['f' + p] = { cam: s.camera, scroll: s.scroll, extra: s.extra };
    await shot('scroll-fwd-' + Math.round(p * 100));
  }
  for (const p of [0.75, 0.5, 0.25, 0]) {
    await page.evaluate(p => window.__baha3d.scrollTo(p), p); await page.waitForTimeout(2200);
    const s = await st(); poses['b' + p] = { cam: s.camera, scroll: s.scroll, extra: s.extra };
    await shot('scroll-back-' + Math.round(p * 100));
  }
  res.poses = poses;
  // jitter: 0 -> 1 -> 0.3 quickly, sample camera every 50ms
  const samples = [];
  await page.evaluate(() => window.__baha3d.scrollTo(1)); await page.waitForTimeout(120);
  await page.evaluate(() => window.__baha3d.scrollTo(0.3));
  for (let i = 0; i < 40; i++) { const s = await st(); samples.push([+s.scroll.smooth.toFixed(3), s.camera.position.map(v => +v.toFixed(2))]); await page.waitForTimeout(50); }
  res.jitter = samples;
  await shot('jitter-settled-30');
  // also real wheel jitter
  await page.evaluate(() => window.__baha3d.scrollTo(0)); await page.waitForTimeout(1500);
  await page.mouse.move(720, 450);
  for (let i = 0; i < 15; i++) { await page.mouse.wheel(0, 900); await page.waitForTimeout(16); }
  for (let i = 0; i < 10; i++) { await page.mouse.wheel(0, -900); await page.waitForTimeout(16); }
  const wj = []; for (let i = 0; i < 30; i++) { const s = await st(); wj.push(+s.scroll.smooth.toFixed(3)); await page.waitForTimeout(60); }
  res.wheelJitter = wj;
  // ---- orbit at 0%
  await page.evaluate(() => window.__baha3d.scrollTo(0)); await page.waitForTimeout(2000);
  await page.evaluate(() => window.__baha3d.resetView()); await page.waitForTimeout(1500);
  const drag = async (dx, dy) => { await page.mouse.move(720, 450); await page.mouse.down(); const n = 20; for (let i = 1; i <= n; i++) { await page.mouse.move(720 + dx * i / n, 450 + dy * i / n); await page.waitForTimeout(16); } await page.mouse.up(); await page.waitForTimeout(1500); };
  // calibrate
  await drag(300, 0); const c1 = await st(); res.calib = { dx300: c1.orbit };
  await page.evaluate(() => window.__baha3d.resetView()); await page.waitForTimeout(1500);
  const per = Math.abs(c1.orbit.yawTotal) / 300 || 0.01; // rad per px
  const q = Math.round((Math.PI / 2) / per);
  res.orbitPxPer90 = q;
  await shot('orbit-front');
  await drag(q, 0); res.steps.right = (await st()).orbit; await shot('orbit-right');
  await drag(q, 0); res.steps.back = (await st()).orbit; await shot('orbit-back');
  await drag(q, 0); res.steps.left = (await st()).orbit; await shot('orbit-left');
  await drag(q, 0); res.steps.full = (await st()).orbit; await shot('orbit-full360');
  await page.evaluate(() => window.__baha3d.resetView()); await page.waitForTimeout(1500);
  await drag(Math.round(q / 2), -400); res.steps.high = (await st()).orbit; await shot('orbit-high');
  await page.evaluate(() => window.__baha3d.resetView()); await page.waitForTimeout(1500);
  await drag(Math.round(-q / 2), 400); res.steps.low = (await st()).orbit; await shot('orbit-low');
  await page.evaluate(() => window.__baha3d.resetView()); await page.waitForTimeout(1800);
  res.afterReset = (await st()).orbit; res.afterResetCam = (await st()).camera;
  // orbit during scroll at 50/75
  for (const p of [0.5, 0.75]) {
    await page.evaluate(p => window.__baha3d.scrollTo(p), p); await page.waitForTimeout(2200);
    await drag(q, 0); await shot('orbit-at' + Math.round(p * 100) + '-right');
    await drag(q, 0); await shot('orbit-at' + Math.round(p * 100) + '-back');
    await page.evaluate(() => window.__baha3d.resetView()); await page.waitForTimeout(1500);
  }
  await page.evaluate(() => window.__baha3d.scrollTo(0)); await page.waitForTimeout(2200);
  // ---- variants
  const v = []; const cnt = (await st()).variant.count;
  for (let i = 0; i < cnt; i++) { await page.evaluate(i => window.__baha3d.setVariant(i), i); await page.waitForTimeout(1200); v.push(await page.evaluate(() => window.__baha3d.material('primary'))); await shot('variant-' + i); }
  res.variants = v;
  await page.evaluate(() => window.__baha3d.setVariant(0)); await page.waitForTimeout(800);
  // ---- hover grid scan
  const hits = [];
  for (let y = 200; y <= 750; y += 50) for (let x = 300; x <= 1140; x += 60) {
    await page.mouse.move(x, y); await page.waitForTimeout(25);
  }
  // targeted hover: find points with hover id
  const found = {};
  for (let y = 250; y <= 750; y += 40) for (let x = 360; x <= 1100; x += 40) {
    await page.mouse.move(x, y); await page.waitForTimeout(60);
    const s = await st(); if (s.hover.id && !found[s.hover.id]) found[s.hover.id] = [x, y];
  }
  res.hoverIds = found;
  let k = 0;
  for (const [id, [x, y]] of Object.entries(found).slice(0, 4)) {
    await page.mouse.move(x, y); await page.waitForTimeout(900);
    const s = await st(); hits.push({ id, hv: s.hover, rim: (await page.evaluate(() => window.__baha3d.material('primary')))?.rim });
    await shot('hover-' + (k++) + '-' + String(id).replace(/[^a-z0-9]/gi, '_'));
  }
  await page.mouse.move(5, 5); await page.waitForTimeout(1200);
  hits.push({ off: (await st()).hover });
  res.hover = hits;
  await shot('hover-off');
  // ---- viewports
  for (const [w, h] of [[1920, 1080], [1440, 900], [390, 844]]) {
    await page.setViewportSize({ width: w, height: h }); await page.waitForTimeout(1200);
    for (const p of [0, 0.25, 0.5, 0.75, 1]) {
      await page.evaluate(p => window.__baha3d.scrollTo(p), p); await page.waitForTimeout(2000);
      await shot(w + 'x' + h + '-' + Math.round(p * 100));
    }
    res['overflow' + w] = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
  }
  await page.setViewportSize({ width: 1440, height: 900 });
  // scroll fps
  await page.evaluate(() => window.__baha3d.scrollTo(0)); await page.waitForTimeout(1500);
  const sf0 = await st();
  for (let i = 0; i < 40; i++) { await page.mouse.wheel(0, 120); await page.waitForTimeout(50); }
  const sf1 = await st(); res.fpsScroll = { before: sf0.fps, after: sf1.fps };
  res.errs = errs; res.bridgeErrors = (await st()).errors;
  return JSON.stringify(res);
}
