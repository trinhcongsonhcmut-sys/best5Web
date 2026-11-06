"""Probe Blender 5.2 API surface + assets (no render). Usage:
  blender -b --factory-startup --python probe.py -- <showcase_root>
"""
import bpy, sys, os, math
root = sys.argv[sys.argv.index('--') + 1]
print('VERSION', bpy.app.version_string)
glb = os.path.join(root, 'public/assets/models/CarConcept.baha.glb')
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=glb)
objs = list(bpy.data.objects)
print('OBJECTS', len(objs))
for o in objs:
    if o.name.startswith('HIT_'):
        continue
    print('OBJ', repr(o.name), o.type, 'parent=', o.parent.name if o.parent else None, 'mats=', [s.material.name for s in o.material_slots if s.material][:4])
print('MATERIALS', sorted(m.name for m in bpy.data.materials))
# HDRI stats
for name in ['evening_road_01_2k.hdr', 'evening_road_01_puresky_2k.hdr']:
    img = bpy.data.images.load(os.path.join(root, 'public/assets/hdri', name))
    w, h = img.size
    px = list(img.pixels[:])
    best = (0, 0)
    tot = 0.0
    for i in range(0, len(px), 4):
        L = 0.2126 * px[i] + 0.7152 * px[i + 1] + 0.0722 * px[i + 2]
        tot += L
        if L > best[0]:
            best = (L, i // 4)
    idx = best[1]
    x, y = idx % w, idx // w
    print('HDRI', name, w, h, 'max', round(best[0], 1), 'at u=%.4f v=%.4f' % ((x + 0.5) / w, (y + 0.5) / h), 'meanL', round(tot / (w * h), 4))
s = bpy.context.scene
print('VIEW_TRANSFORMS', [i.identifier for i in s.view_settings.bl_rna.properties['view_transform'].enum_items])
print('CYCLES DENOISERS', [i.identifier for i in s.cycles.bl_rna.properties['denoiser'].enum_items])
print('HAS compositing_node_group', hasattr(s, 'compositing_node_group'), 'node_tree', hasattr(s, 'node_tree'))
