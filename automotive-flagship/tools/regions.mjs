// mean sRGB of named regions in images:  node regions.mjs img1 img2 ...  (regions in 960x540 space, scaled)
import sharp from 'sharp';
const R = { 'sky-top': [100, 20, 760, 60], 'sky-mid': [100, 150, 300, 40], horizon: [600, 235, 300, 15], road: [50, 420, 300, 60], 'road-glare': [800, 400, 150, 100], door: [330, 290, 60, 30] };
for (const f of process.argv.slice(2)) {
  const { data, info } = await sharp(f).removeAlpha().raw({ depth: 'uchar' }).toBuffer({ resolveWithObject: true });
  const k = info.width / 960;
  const row = [];
  for (const [n, [x, y, w, h]] of Object.entries(R)) {
    const s = [0, 0, 0];
    let c = 0;
    for (let j = Math.round(y * k); j < Math.round((y + h) * k); j++) for (let i = Math.round(x * k); i < Math.round((x + w) * k); i++) {
      const o = (j * info.width + i) * 3;
      s[0] += data[o]; s[1] += data[o + 1]; s[2] += data[o + 2]; c++;
    }
    row.push(`${n}=${s.map((v) => Math.round(v / c)).join(',')}`);
  }
  console.log(f.split('/').pop().padEnd(28), row.join('  '));
}
