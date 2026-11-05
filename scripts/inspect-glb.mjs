// Compact GLB structure report: node tree (name, translation, mesh, tris), materials, variants, bounds.
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { getBounds } from '@gltf-transform/functions';
const file = process.argv[2];
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const doc = await io.read(file);
const root = doc.getRoot();
const tris = (mesh) => mesh ? mesh.listPrimitives().reduce((s, p) => s + ((p.getIndices()?.getCount() ?? p.getAttribute('POSITION').getCount()) / 3), 0) : 0;
const r = (a) => a.map((v) => Math.round(v * 1000) / 1000);
function walk(n, d) {
  const m = n.getMesh();
  const mats = m ? [...new Set(m.listPrimitives().map((p) => p.getMaterial()?.getName()))].join('/') : '';
  console.log(`${'  '.repeat(d)}${n.getName() || '(node)'} t=${r(n.getTranslation())}${m ? ` mesh=${m.getName()} tris=${tris(m)} mats=${mats}` : ''}`);
  for (const c of n.listChildren()) walk(c, d + 1);
}
for (const s of root.listScenes()) { const b = getBounds(s); console.log('SCENE', s.getName(), 'bounds min', r(b.min), 'max', r(b.max)); s.listChildren().forEach((n) => walk(n, 1)); }
console.log('TOTAL tris', root.listMeshes().reduce((s, m) => s + tris(m), 0));
console.log('MATERIALS:', root.listMaterials().map((m) => m.getName()).join(', '));
const vext = root.listExtensionsUsed().find((e) => e.extensionName === 'KHR_materials_variants');
if (vext) console.log('VARIANTS:', vext.listVariants().map((v) => v.getName()).join(', '));
console.log('TEXTURES:', root.listTextures().map((t) => `${t.getName() || t.getURI()} ${t.getSize()?.join('x')}`).join(' | '));
