/**
 * Derived texture copies for the real-estate demo (CC0 Poly Haven sets in public/assets/textures/<id>/).
 * The 2K JPGs are the approved originals; the integrated GPU (Intel HD 530) gets 1K WebP copies next to them:
 *   <id>_diff_1k.webp (sRGB albedo) · <id>_nor_gl_1k.webp (OpenGL normal) · <id>_arm_1k.webp (R AO · G rough · B metal)
 * Run from BAHA_3D_SHOWCASE/:  node src/demos/real-estate/scripts/make-textures.mjs
 */
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve('public/assets/textures');
const SETS = ['sandstone_blocks_05', 'brown_planks_03', 'concrete_floor_02', 'leafy_grass'];
const MAPS = [
  ['diff', 86],
  ['nor_gl', 94],
  ['arm', 88],
];
const SIZE = 1024;

for (const id of SETS) {
  for (const [map, q] of MAPS) {
    const src = path.join(ROOT, id, `${id}_${map}_2k.jpg`);
    const dst = path.join(ROOT, id, `${id}_${map}_1k.webp`);
    if (!fs.existsSync(src)) throw new Error(`missing ${src}`);
    await sharp(src).resize(SIZE, SIZE, { kernel: 'lanczos3' }).webp({ quality: q, effort: 5 }).toFile(dst);
    console.log(`${dst}  ${(fs.statSync(dst).size / 1024).toFixed(0)} KB`);
  }
}
