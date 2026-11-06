"""
AXIOM GT — minimal golden-hour test scene for Blender 5.2 / Cycles CPU, driven ONLY by the scene contract that
automotive-flagship/tools/make-contract.mjs generates from the realtime code.

  blender -b --factory-startup --python automotive-flagship/blender/build_scene.py -- \
      --root <BAHA_3D_SHOWCASE> --pose 0 --mode preview --variant pearl --res 960x540 --spp 32 --out renders/preview/x

modes
  preview : car + road + shoulder + shrubs + ground-projected HDRI dome + world HDRI (sun capped) + sun lamp
  mask    : car only, Workbench, transparent film -> silhouette PNG; IoU vs contract/mask-rt-<pose>.png is printed
  bake    : top-down orthographic shadow-catcher render of the road under the car (sun shadow + sky AO) -> alpha PNG
  hero    : preview look at hero resolution with an optional camera override (--cam JSON) and DOF

Every render appends a line to automotive-flagship/renders/render-log.csv (wall time, px*spp/s).
Axes: three (x, y, z) -> Blender (x, -z, y). Node matrices: M_b = C*M_t*C^-1, camera: M_b = C*M_t.
"""
import bpy, sys, os, json, math, time, argparse, re
import numpy as np
from mathutils import Matrix, Vector

argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
ap = argparse.ArgumentParser()
ap.add_argument('--root', required=True)
ap.add_argument('--contract', default='automotive-flagship/contract/scene-contract.json')
ap.add_argument('--pose', type=float, default=0.0)
ap.add_argument('--mode', choices=['preview', 'mask', 'bake', 'hero'], default='preview')
ap.add_argument('--variant', default='pearl')
ap.add_argument('--res', default='960x540')
ap.add_argument('--spp', type=int, default=32)
ap.add_argument('--out', required=True, help='output path without extension')
ap.add_argument('--label', default='')
ap.add_argument('--cam', default='', help='JSON camera override in three coords: {pos,target,fov|mm,fstop,focus}')
ap.add_argument('--bake', default='{}', help='JSON bake rect in three coords: {cx, cz, size}')
ap.add_argument('--exposure', type=float, default=None, help='view exposure multiplier (default: contract tone.exposure)')
ap.add_argument('--glare', type=float, default=0.0, help='hero comp: glare amount on highlights (0 = off)')
ap.add_argument('--vignette', type=float, default=0.0)
ap.add_argument('--save-blend', default='')
ap.add_argument('--lights-on', type=float, default=-1, help='override tail-light amount 0..1')
args = ap.parse_args(argv)

ROOT = os.path.abspath(args.root)
P = lambda *a: os.path.join(ROOT, *a)
C = json.load(open(P(args.contract), encoding='utf-8'))
pose = min(C['poses'], key=lambda q: abs(q['p'] - args.pose))
W, H = (int(x) for x in args.res.split('x'))
VARIANTS = {'pearl': 0, 'carmine': 1, 'graphite': 2, 'bronze': 3}
FIN = C['finishes'][VARIANTS.get(args.variant, 0)]
T0 = time.time()

CM = Matrix(((1, 0, 0, 0), (0, 0, -1, 0), (0, 1, 0, 0), (0, 0, 0, 1)))
CMi = CM.inverted()


def m3(e):  # three column-major elements -> Matrix
    return Matrix([[e[0], e[4], e[8], e[12]], [e[1], e[5], e[9], e[13]], [e[2], e[6], e[10], e[14]], [e[3], e[7], e[11], e[15]]])


def v3(v):
    return Vector((v[0], -v[2], v[1]))


def srgb(h):
    h = h.lstrip('#')
    c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return [x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4 for x in c] + [1.0]


def sanitize(n):
    n = re.sub(r'\.\d{3}$', '', n)
    return re.sub(r'[\[\]\.:/]', '', re.sub(r'\s', '_', n)).lower()


bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
log = lambda *a: print('[build]', *a, flush=True)

# ───────────── car ─────────────
before = set(bpy.data.objects)
bpy.ops.import_scene.gltf(filepath=P('public', C['carAsset'].lstrip('/')))
car = [o for o in bpy.data.objects if o not in before]
for o in [o for o in car if o.name.startswith('HIT_')]:
    bpy.data.objects.remove(o, do_unlink=True)
car = [o for o in bpy.data.objects if o not in before]
bpy.context.view_layer.update()
nodes = {k.lower(): v for k, v in pose['nodes'].items()}
fr = C['carFrame']
root_t = Matrix.Translation(Vector(fr['offset'])) @ Matrix.Rotation(fr['rotY'], 4, 'Y')
root_b = CM @ root_t @ CMi
targets, unmatched = {}, []
for o in car:
    k = sanitize(o.name)
    if k in nodes:
        targets[o] = CM @ m3(nodes[k]['m']) @ CMi
    else:
        targets[o] = root_b @ o.matrix_world
        if o.type == 'MESH':
            unmatched.append(o.name)
for o in car:
    o.parent = None
for o, m in targets.items():
    o.matrix_world = m
log('car objects', len(car), 'matched', len(car) - len(unmatched), 'unmatched meshes', unmatched)

# ───────────── materials (Principled, values from the contract finishes) ─────────────
def principled(name, color=(0.5, 0.5, 0.5, 1), metal=0.0, rough=0.5, coat=0.0, coat_rough=0.03, **kw):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = color
    b.inputs['Metallic'].default_value = metal
    b.inputs['Roughness'].default_value = rough
    b.inputs['Coat Weight'].default_value = coat
    b.inputs['Coat Roughness'].default_value = coat_rough
    for k, v in kw.items():
        b.inputs[k].default_value = v
    return m


def glass_mat():
    m = bpy.data.materials.new('BAHA Glass')
    m.use_nodes = True
    nt = m.node_tree
    nt.nodes.clear()
    out = nt.nodes.new('ShaderNodeOutputMaterial')
    tr = nt.nodes.new('ShaderNodeBsdfTransparent')
    tr.inputs['Color'].default_value = (0.42, 0.43, 0.44, 1)
    gl = nt.nodes.new('ShaderNodeBsdfGlossy')
    gl.inputs['Roughness'].default_value = 0.02
    fr_ = nt.nodes.new('ShaderNodeFresnel')
    fr_.inputs['IOR'].default_value = 1.52
    mix = nt.nodes.new('ShaderNodeMixShader')
    nt.links.new(fr_.outputs[0], mix.inputs[0])
    nt.links.new(tr.outputs[0], mix.inputs[1])
    nt.links.new(gl.outputs[0], mix.inputs[2])
    nt.links.new(mix.outputs[0], out.inputs['Surface'])
    return m


anim = pose['anim']
rear_amt = anim['rear'] if args.lights_on < 0 else args.lights_on
MATS = {
    'paint1': principled('BAHA Paint', srgb(FIN['color']), FIN['metalness'], FIN['roughness'], FIN['clearcoat'], FIN['clearcoatRoughness']),
    'paint2': principled('BAHA Accent', srgb(FIN['accent']), FIN['accentMetal'], FIN['accentRough'], 1.0, 0.04),
    'glass': glass_mat(),
    'headlight': principled('BAHA Headlight', srgb('#0d0f12'), 0, 0.25, **{'Emission Color': srgb('#e9f1ff'), 'Emission Strength': 0.8 + anim['glow'] * 2.0}),
    'brakelight': principled('BAHA Taillight', srgb('#1c0204'), 0, 0.3, **{'Emission Color': srgb('#ff0a12'), 'Emission Strength': 0.5 + rear_amt * 3.4}),
    'signallight': principled('BAHA Signal', srgb('#1a0f04'), 0, 0.3, **{'Emission Color': srgb('#ff8a1c'), 'Emission Strength': 0.25}),
    'rim1': principled('BAHA Rim gunmetal', srgb('#3b3d42'), 1.0, 0.3),
    'rim2': principled('BAHA Rim lip', srgb('#b9bbbe'), 1.0, 0.16),
    'brake': principled('BAHA Caliper', srgb('#c2361c'), 0.25, 0.36),
    'disc': principled('BAHA Disc', srgb('#4d4f53'), 1.0, 0.42),
    'interior 3': principled('BAHA Leather', srgb(FIN['interior']), 0, 0.55),
    'material_2': principled('BAHA Liner', srgb('#232427'), 0, 0.62),
}
plate = principled('BAHA Plate', rough=0.45)
pn = plate.node_tree.nodes
ti = pn.new('ShaderNodeTexImage')
ti.image = bpy.data.images.load(P('automotive-flagship/contract/plate.png'))
plate.node_tree.links.new(ti.outputs['Color'], pn['Principled BSDF'].inputs['Base Color'])
MATS['license'] = plate


def key_of(mname):
    n = re.sub(r'\.\d{3}$', '', mname).lower()
    if n.startswith('paint 1'):
        return 'paint1'
    if n.startswith('paint 2'):
        return 'paint2'
    if n.startswith('interior 3'):
        return 'interior 3'
    return n


tyres = set()
for o in car:
    for s in getattr(o, 'material_slots', []):
        if not s.material:
            continue
        k = key_of(s.material.name)
        if k in MATS:
            s.material = MATS[k]
        elif k in ('tireside', 'tiretread'):
            tyres.add(s.material)
for m in tyres:  # rubber: keep the (logo-cleaned) textures, physical rubber gloss
    b = m.node_tree.nodes.get('Principled BSDF')
    if b:
        for l in list(b.inputs['Roughness'].links):
            m.node_tree.links.remove(l)
        b.inputs['Roughness'].default_value = 0.82
        b.inputs['Specular IOR Level'].default_value = 0.35

# ───────────── world: the realtime light grade (contract.grade) applied in numpy, in panorama pixel space ─────────────
# identical to World.tsx GRADE_FRAG: sign patch -> sample at fract(u + uOff) -> saturation -> gain -> (IBL) cap + band
hdri_path = P('public', C['world']['hdri'].lstrip('/'))
img = bpy.data.images.load(hdri_path)
G = C['grade']
sun_b = v3(C['sun']).normalized()
iw, ih = img.size
px = np.empty(iw * ih * 4, dtype=np.float32)
img.pixels.foreach_get(px)
src = px.reshape(ih, iw, 4)[:, :, :3].copy()  # row 0 = bottom (v = 0), same as three's flipY HDR texture
us = (np.arange(iw) + 0.5) / iw
vs = (np.arange(ih) + 0.5) / ih
cu = np.where((us > G['sign']['u'][0]) & (us < G['sign']['u'][1]))[0]
rv = np.where((vs > G['sign']['v'][0]) & (vs < G['sign']['v'][1]))[0]
src[np.ix_(rv, cu)] = src[np.ix_(rv, cu - int(round(G['sign']['shift'] * iw)))]
L = src @ np.array([0.2126, 0.7152, 0.0722], dtype=np.float32)
graded = np.maximum(L[..., None] + (src - L[..., None]) * G['saturation'], 0) * np.array(G['gain'], dtype=np.float32)
out = np.roll(graded, -int(round(C['world']['uOff'] * iw)), axis=1)  # out(u) = graded(fract(u + uOff))
lat = (vs - 0.5) * math.pi
dOm = (2 * math.pi / iw) * (math.pi / ih) * np.cos(lat)[:, None]
E = (np.clip(graded - G['cap'], 0, None) * dOm[:, :, None]).sum(axis=(0, 1))  # W/m^2 normal to the sun
lumE = float(0.2126 * E[0] + 0.7152 * E[1] + 0.0722 * E[2])
sun_col = (E / max(lumE, 1e-6)).tolist()
az = (us - 0.5) * 2 * math.pi
sxz = np.array([C['sun'][0], C['sun'][2]]); sxz /= np.linalg.norm(sxz)
toward = np.cos(az) * sxz[0] + np.sin(az) * sxz[1]
t = np.clip((toward + 0.3) / 1.2, 0, 1); t = t * t * (3 - 2 * t)
hb = G['horizon']
band = hb['amount'] * np.exp(-((lat - hb['elev']) / hb['width']) ** 2)[:, None] * (0.45 + 0.55 * t)[None, :]
ibl = np.minimum(out, G['cap']) + band[..., None] * np.array(hb['color'], dtype=np.float32)
log('graded sun above cap %.1f: E=%s lum=%.4f col=%s' % (G['cap'], np.round(E, 4).tolist(), lumE, np.round(sun_col, 3).tolist()))


def np_image(name, arr):
    """float array -> EXR in renders/cache (Cycles does not pick up pixels set on a generated image in -b) -> image"""
    im = bpy.data.images.new(name, arr.shape[1], arr.shape[0], alpha=False, float_buffer=True)
    im.colorspace_settings.name = 'Non-Color'  # else save() sRGB-encodes the EXR (verified: 10.0 -> 2.70)
    rgba = np.concatenate([arr, np.ones(arr.shape[:2] + (1,), dtype=np.float32)], axis=2)
    im.pixels.foreach_set(rgba.astype(np.float32).ravel())
    path = P('automotive-flagship/renders/cache/%s.exr' % name)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    im.filepath_raw = path
    im.file_format = 'OPEN_EXR'
    im.save()
    bpy.data.images.remove(im)
    out = bpy.data.images.load(path, check_existing=False)
    out.colorspace_settings.name = 'Non-Color'  # raw scene-linear data, round trip verified exact
    return out


IMG_DOME, IMG_IBL = np_image('graded_dome', out), np_image('graded_ibl', ibl)


def env_chain(nt, coord_kind, image):
    tc = nt.nodes.new('ShaderNodeTexCoord')
    env = nt.nodes.new('ShaderNodeTexEnvironment')
    env.image = image
    nt.links.new(tc.outputs[coord_kind], env.inputs['Vector'])
    return env.outputs['Color']


world = bpy.data.worlds.new('Golden hour')
scene.world = world
world.use_nodes = True
wn = world.node_tree
wn.nodes.clear()
bg = wn.nodes.new('ShaderNodeBackground')
wout = wn.nodes.new('ShaderNodeOutputWorld')
wn.links.new(env_chain(wn, 'Generated', IMG_IBL), bg.inputs['Color'])
wn.links.new(bg.outputs[0], wout.inputs['Surface'])

sun = bpy.data.objects.new('Sun', bpy.data.lights.new('Sun', 'SUN'))
scene.collection.objects.link(sun)
sun.data.energy = lumE
sun.data.color = [max(0.0, c) for c in sun_col[:3]]
sun.data.angle = math.radians(0.75)
sun.rotation_euler = sun_b.to_track_quat('Z', 'Y').to_euler()

env_objs = []
if args.mode in ('preview', 'hero', 'bake'):
    # ground-projected HDRI dome = three GroundedSkybox (camera-visible only; lighting comes from the world)
    h, R = C['world']['skyHeight'], C['world']['skyRadius']
    bpy.ops.mesh.primitive_uv_sphere_add(segments=192, ring_count=96, radius=R, location=(0, 0, h - 0.06))
    dome = bpy.context.active_object
    dome.name = 'Dome'
    y1 = -h * 1.5
    for v in dome.data.vertices:
        z = v.co.z
        if z < 0:
            f = (-h / z) if z < y1 else (1 - z * z / (3 * y1 * y1))
            v.co *= f
    dm = bpy.data.materials.new('Dome')
    dm.use_nodes = True
    dnt = dm.node_tree
    dnt.nodes.clear()
    em = dnt.nodes.new('ShaderNodeEmission')
    dout = dnt.nodes.new('ShaderNodeOutputMaterial')
    dnt.links.new(env_chain(dnt, 'Object', IMG_DOME), em.inputs['Color'])
    dnt.links.new(em.outputs[0], dout.inputs['Surface'])
    dome.data.materials.append(dm)
    for a in ('visible_diffuse', 'visible_glossy', 'visible_transmission', 'visible_volume_scatter', 'visible_shadow'):
        setattr(dome, a, False)
    env_objs.append(dome)

    # asphalt road (CC0 asphalt_02): plane len x (w + 0.6), centre line at three z = ROAD.z
    rd = C['road']
    bpy.ops.mesh.primitive_plane_add(size=1, location=(0, -rd['z'], 0))
    road = bpy.context.active_object
    road.name = 'Road'
    road.scale = (rd['len'], rd['w'] + 0.6, 1)
    rm = bpy.data.materials.new('Asphalt')
    rm.use_nodes = True
    rnt = rm.node_tree
    rb = rnt.nodes['Principled BSDF']
    tc = rnt.nodes.new('ShaderNodeTexCoord')
    mp = rnt.nodes.new('ShaderNodeMapping')
    mp.inputs['Scale'].default_value = (rd['len'] / rd['tile'], (rd['w'] + 0.6) / rd['tile'], 1)
    rnt.links.new(tc.outputs['UV'], mp.inputs['Vector'])
    tex = {}
    for k, cs in (('diff', 'sRGB'), ('nor_gl', 'Non-Color'), ('arm', 'Non-Color')):
        t = rnt.nodes.new('ShaderNodeTexImage')
        t.image = bpy.data.images.load(P('public/assets/textures/asphalt_02/asphalt_02_%s_2k.jpg' % k))
        t.image.colorspace_settings.name = cs
        rnt.links.new(mp.outputs['Vector'], t.inputs['Vector'])
        tex[k] = t
    # edge line + dusty shoulder (same smoothsteps as the realtime road shader), on |local y| in metres
    sep = rnt.nodes.new('ShaderNodeSeparateXYZ')
    rnt.links.new(tc.outputs['Object'], sep.inputs['Vector'])
    ab = rnt.nodes.new('ShaderNodeMath'); ab.operation = 'ABSOLUTE'
    rnt.links.new(sep.outputs['Y'], ab.inputs[0])
    sc = rnt.nodes.new('ShaderNodeMath'); sc.operation = 'MULTIPLY'; sc.inputs[1].default_value = rd['w'] + 0.6
    rnt.links.new(ab.outputs[0], sc.inputs[0])
    half = rd['w'] / 2

    def band(a, b):
        n = rnt.nodes.new('ShaderNodeMapRange'); n.interpolation_type = 'SMOOTHSTEP'
        n.inputs['From Min'].default_value = a; n.inputs['From Max'].default_value = b
        rnt.links.new(sc.outputs[0], n.inputs['Value'])
        return n.outputs['Result']
    l_in, l_out = band(half - 0.52, half - 0.47), band(half - 0.37, half - 0.32)
    line = rnt.nodes.new('ShaderNodeMath'); line.operation = 'SUBTRACT'
    rnt.links.new(l_in, line.inputs[0]); rnt.links.new(l_out, line.inputs[1])
    tint = rnt.nodes.new('ShaderNodeMix'); tint.data_type = 'RGBA'; tint.blend_type = 'MULTIPLY'
    tint.inputs['Factor'].default_value = 1.0
    tint.inputs['B'].default_value = (0.62, 0.62, 0.64, 1)  # asphalt a touch darker than the raw scan (sunset road)
    rnt.links.new(tex['diff'].outputs['Color'], tint.inputs['A'])
    m1 = rnt.nodes.new('ShaderNodeMix'); m1.data_type = 'RGBA'
    lf = rnt.nodes.new('ShaderNodeMath'); lf.operation = 'MULTIPLY'; lf.inputs[1].default_value = 0.55
    rnt.links.new(line.outputs[0], lf.inputs[0])
    rnt.links.new(lf.outputs[0], m1.inputs['Factor'])
    rnt.links.new(tint.outputs['Result'], m1.inputs['A'])
    m1.inputs['B'].default_value = srgb('#9e9484')
    m2 = rnt.nodes.new('ShaderNodeMix'); m2.data_type = 'RGBA'
    sh = band(half - 0.25, half + 0.05)
    shf = rnt.nodes.new('ShaderNodeMath'); shf.operation = 'MULTIPLY'; shf.inputs[1].default_value = 0.85
    rnt.links.new(sh, shf.inputs[0])
    rnt.links.new(shf.outputs[0], m2.inputs['Factor'])
    rnt.links.new(m1.outputs['Result'], m2.inputs['A'])
    m2.inputs['B'].default_value = srgb(C['ground']['color'])
    rnt.links.new(m2.outputs['Result'], rb.inputs['Base Color'])
    sp = rnt.nodes.new('ShaderNodeSeparateColor')
    rnt.links.new(tex['arm'].outputs['Color'], sp.inputs['Color'])
    rnt.links.new(sp.outputs['Green'], rb.inputs['Roughness'])
    nm = rnt.nodes.new('ShaderNodeNormalMap')
    nm.inputs['Strength'].default_value = 0.9
    rnt.links.new(tex['nor_gl'].outputs['Color'], nm.inputs['Color'])
    rnt.links.new(nm.outputs['Normal'], rb.inputs['Normal'])
    road.data.materials.append(rm)
    env_objs.append(road)

    # dusty shoulder disc, alpha-faded into the projected photo ground like the realtime Ground()
    gd = C['ground']
    bpy.ops.mesh.primitive_circle_add(vertices=96, radius=gd['radius'], fill_type='NGON', location=(0, 0, -0.015))
    gnd = bpy.context.active_object
    gnd.name = 'Shoulder'
    gm = bpy.data.materials.new('Shoulder')
    gm.use_nodes = True
    gnt = gm.node_tree
    gb = gnt.nodes['Principled BSDF']
    gb.inputs['Roughness'].default_value = 1.0
    nz = gnt.nodes.new('ShaderNodeTexNoise')
    nz.inputs['Scale'].default_value = 60.0
    nz.inputs['Detail'].default_value = 8.0
    cr = gnt.nodes.new('ShaderNodeMapRange')
    cr.inputs['From Min'].default_value = 0.3; cr.inputs['From Max'].default_value = 0.7
    cr.inputs['To Min'].default_value = 0.78; cr.inputs['To Max'].default_value = 1.05
    gnt.links.new(nz.outputs['Fac'], cr.inputs['Value'])
    gmul = gnt.nodes.new('ShaderNodeMix'); gmul.data_type = 'RGBA'; gmul.blend_type = 'MULTIPLY'
    gmul.inputs['A'].default_value = srgb(gd['color'])
    gnt.links.new(cr.outputs['Result'], gmul.inputs['Factor'])
    gmul.inputs['B'].default_value = (0.7, 0.66, 0.6, 1)
    gnt.links.new(gmul.outputs['Result'], gb.inputs['Base Color'])
    gtc = gnt.nodes.new('ShaderNodeTexCoord')
    gs = gnt.nodes.new('ShaderNodeMapping'); gs.inputs['Scale'].default_value = (0.6, 1.0, 1.0)
    gnt.links.new(gtc.outputs['Object'], gs.inputs['Vector'])
    gl_ = gnt.nodes.new('ShaderNodeVectorMath'); gl_.operation = 'LENGTH'
    gnt.links.new(gs.outputs['Vector'], gl_.inputs[0])
    ga = gnt.nodes.new('ShaderNodeMapRange'); ga.interpolation_type = 'SMOOTHSTEP'
    ga.inputs['From Min'].default_value = gd['fade'][0]; ga.inputs['From Max'].default_value = gd['fade'][1]
    ga.inputs['To Min'].default_value = 1.0; ga.inputs['To Max'].default_value = 0.0
    gnt.links.new(gl_.outputs['Value'], ga.inputs['Value'])
    gnt.links.new(ga.outputs['Result'], gb.inputs['Alpha'])
    gnd.data.materials.append(gm)
    env_objs.append(gnd)

    # CC0 shrubs, exact instance matrices of the realtime InstancedMeshes
    for s in C.get('shrubs', []):
        b4 = set(bpy.data.objects)
        bpy.ops.import_scene.gltf(filepath=P('public', s['url'].lstrip('/')))
        new = [o for o in bpy.data.objects if o not in b4]
        bpy.context.view_layer.update()
        src = next(o for o in new if o.type == 'MESH')
        me = src.data.copy()
        me.transform(src.matrix_world)
        xs = [v.co for v in me.vertices]
        mn = Vector((min(c.x for c in xs), min(c.y for c in xs), min(c.z for c in xs)))
        mx = Vector((max(c.x for c in xs), max(c.y for c in xs), max(c.z for c in xs)))
        me.transform(Matrix.Translation(Vector((-(mn.x + mx.x) / 2, -(mn.y + mx.y) / 2, -mn.z))))
        for o in new:
            bpy.data.objects.remove(o, do_unlink=True)
        for i, e in enumerate(s['matrices']):
            ob = bpy.data.objects.new('shrub_%s_%d' % (os.path.basename(s['url'])[:8], i), me)
            scene.collection.objects.link(ob)
            ob.matrix_world = CM @ m3(e) @ CMi
            env_objs.append(ob)

# ───────────── camera ─────────────
cam = bpy.data.objects.new('Camera', bpy.data.cameras.new('Camera'))
scene.collection.objects.link(cam)
scene.camera = cam
cd = cam.data
cd.clip_start, cd.clip_end = 0.05, 1500
cam_over = json.loads(args.cam) if args.cam else None
if cam_over:
    pos, tgt = v3(cam_over['pos']), v3(cam_over['target'])
    cam.matrix_world = Matrix.Translation(pos) @ (tgt - pos).to_track_quat('-Z', 'Y').to_matrix().to_4x4()
    if 'mm' in cam_over:
        cd.sensor_fit = 'HORIZONTAL'
        cd.sensor_width = 36
        cd.lens = cam_over['mm']
    else:
        cd.sensor_fit = 'VERTICAL'
        cd.angle_y = math.radians(cam_over['fov'])
    if cam_over.get('fstop'):
        cd.dof.use_dof = True
        cd.dof.aperture_fstop = cam_over['fstop']
        cd.dof.focus_distance = (v3(cam_over.get('focus', cam_over['target'])) - pos).length
else:
    cam.matrix_world = CM @ m3(pose['camera']['matrixWorld'])
    cd.sensor_fit = 'VERTICAL'
    cd.angle_y = math.radians(pose['camera']['fov'])

# ───────────── render settings ─────────────
r = scene.render
r.resolution_x, r.resolution_y, r.resolution_percentage = W, H, 100
r.film_transparent = False
cy = scene.cycles
if args.mode == 'mask':
    r.engine = 'BLENDER_WORKBENCH'
    r.film_transparent = True
    scene.display.render_aa = 'OFF'
    spp = 1
else:
    r.engine = 'CYCLES'
    cy.device = 'CPU'
    cy.samples = args.spp
    cy.use_adaptive_sampling = True
    cy.adaptive_threshold = 0.02
    cy.use_denoising = True
    cy.denoiser = 'OPENIMAGEDENOISE'
    cy.denoising_input_passes = 'RGB_ALBEDO_NORMAL'
    cy.use_light_tree = True
    cy.max_bounces = 12
    cy.diffuse_bounces, cy.glossy_bounces, cy.transmission_bounces = 3, 4, 8
    cy.transparent_max_bounces = 16
    cy.caustics_reflective = cy.caustics_refractive = False
    cy.blur_glossy = 0.5
    cy.sample_clamp_indirect = 8.0
    spp = args.spp
    vs = scene.view_settings
    try:
        vs.view_transform = 'Khronos PBR Neutral'
    except TypeError:
        vs.view_transform = 'AgX'
        log('Khronos PBR Neutral missing -> AgX')
    vs.look = 'None'
    expo = args.exposure if args.exposure is not None else C['tone']['exposure']
    vs.exposure = math.log2(expo)

if args.mode == 'bake':
    # top-down ortho over the shadow footprint; car only casts (never seen), road + shoulder = shadow catchers
    bk = dict(C.get('shadowBake') or {'cx': 0.75, 'cz': 4.4, 'size': 12.0})
    bk.update(json.loads(args.bake))
    for o in env_objs:
        o.hide_render = o.name.startswith(('Dome', 'shrub'))
    for o in (road, gnd):
        o.is_shadow_catcher = True
    for o in car:
        o.visible_camera = False
    cam.matrix_world = Matrix.Translation(v3([bk['cx'], 20, bk['cz']]))  # looking straight down (-Z)
    cd.type = 'ORTHO'
    cd.ortho_scale = bk['size']
    cd.sensor_fit = 'AUTO'
    r.film_transparent = True
    cy.use_denoising = True
    scene.view_settings.view_transform = 'Standard'
    scene.view_settings.exposure = 0
if args.mode == 'mask':
    for o in env_objs:
        o.hide_render = True

os.makedirs(os.path.dirname(P(args.out)), exist_ok=True)
t_setup = time.time() - T0
t1 = time.time()
bpy.ops.render.render(write_still=False)
t_render = time.time() - t1
res = bpy.data.images['Render Result']
ims = r.image_settings
if args.mode in ('mask', 'bake'):
    ims.file_format, ims.color_mode, ims.color_depth = 'PNG', 'RGBA', '16' if args.mode == 'bake' else '8'
    res.save_render(P(args.out + '.png'))
else:
    ims.file_format, ims.color_mode, ims.color_depth = 'PNG', 'RGB', '16'
    res.save_render(P(args.out + '.png'))
    ims.file_format, ims.quality = 'JPEG', 92
    ims.color_depth = '8'
    res.save_render(P(args.out + '.jpg'))
log('render %.1fs (setup %.1fs) -> %s' % (t_render, t_setup, args.out))

iou = ''
if args.mode == 'mask':
    a = bpy.data.images.load(P(args.out + '.png'))
    A = np.empty(W * H * 4, dtype=np.float32)
    a.pixels.foreach_get(A)
    A = A.reshape(H, W, 4)[::-1, :, 3] > 0.5
    rt = bpy.data.images.load(P('automotive-flagship/contract/mask-rt-%04d.png' % round(pose['p'] * 1000)))
    B = np.empty(rt.size[0] * rt.size[1] * 4, dtype=np.float32)
    rt.pixels.foreach_get(B)
    B = B.reshape(rt.size[1], rt.size[0], 4)[::-1, :, 0] > 0.5
    inter, uni = np.logical_and(A, B).sum(), np.logical_or(A, B).sum()
    iou = '%.4f' % (inter / max(uni, 1))
    # diff visual: white = both, red = Blender only, cyan = realtime only
    d = np.zeros((H, W, 4), dtype=np.float32)
    d[..., 3] = 1
    d[A & B] = (1, 1, 1, 1)
    d[A & ~B] = (1, 0.15, 0.1, 1)
    d[~A & B] = (0.1, 0.9, 1, 1)
    di = bpy.data.images.new('diff', W, H)
    di.pixels.foreach_set(d[::-1].ravel())
    di.filepath_raw = P(args.out + '-diff.png')
    di.file_format = 'PNG'
    di.save()
    log('IoU pose %.3f = %s  (blender %d px, realtime %d px)' % (pose['p'], iou, A.sum(), B.sum()))

# hero comp: highlight glare (threshold -> wide blur -> add) + vignette, on the display-referred result
if args.mode == 'hero' and (args.glare > 0 or args.vignette > 0):
    jp = bpy.data.images.load(P(args.out + '.png'))
    jp.colorspace_settings.name = 'Non-Color'  # operate on the display-referred values as written
    X = np.empty(W * H * 4, dtype=np.float32)
    jp.pixels.foreach_get(X)
    X = X.reshape(H, W, 4)
    rgb = X[..., :3]
    if args.glare > 0:
        lum = rgb @ np.array([0.2126, 0.7152, 0.0722], dtype=np.float32)
        hi = rgb * np.clip((lum - 0.82) / 0.18, 0, 1)[..., None]
        acc = np.zeros_like(hi)
        k = hi.copy()
        for rad in (4, 12, 32):  # separable box blurs ~ gaussian, 3 octaves
            b = k
            for _ in range(3):
                b = np.cumsum(np.pad(b, ((0, 0), (rad, rad), (0, 0)), mode='edge'), axis=1)
                b = (b[:, 2 * rad:] - np.pad(b, ((0, 0), (1, 0), (0, 0)))[:, :-2 * rad - 1]) / (2 * rad + 1)
                b = np.cumsum(np.pad(b, ((rad, rad), (0, 0), (0, 0)), mode='edge'), axis=0)
                b = (b[2 * rad:] - np.pad(b, ((1, 0), (0, 0), (0, 0)))[:-2 * rad - 1]) / (2 * rad + 1)
            acc += b
        rgb = 1 - (1 - rgb) * (1 - np.clip(acc * args.glare, 0, 1))  # screen
    if args.vignette > 0:
        yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
        d2 = ((xx / W - 0.5) * 1.0) ** 2 + ((yy / H - 0.5) * (H / W)) ** 2
        rgb = rgb * (1 - args.vignette * np.clip(d2 / 0.32, 0, 1) ** 1.5)[..., None]
    X[..., :3] = np.clip(rgb, 0, 1)
    jp.pixels.foreach_set(X.ravel())
    jp.filepath_raw = P(args.out + '-comp.png')
    jp.file_format = 'PNG'
    jp.save()
    jp.filepath_raw = P(args.out + '-comp.jpg')
    jp.file_format = 'JPEG'
    jp.save()
    log('comp -> %s-comp.png' % args.out)

if args.save_blend:
    bpy.ops.wm.save_as_mainfile(filepath=P(args.save_blend))

logp = P('automotive-flagship/renders/render-log.csv')
os.makedirs(os.path.dirname(logp), exist_ok=True)
new = not os.path.exists(logp)
with open(logp, 'a', encoding='utf-8') as f:
    if new:
        f.write('date,mode,label,pose,variant,width,height,spp,render_s,setup_s,px_spp_per_s,iou,out\n')
    rate = W * H * spp / max(t_render, 1e-3)
    f.write('%s,%s,%s,%.3f,%s,%d,%d,%d,%.1f,%.1f,%.0f,%s,%s\n' % (
        time.strftime('%Y-%m-%d %H:%M:%S'), args.mode, args.label, pose['p'], args.variant, W, H, spp, t_render, t_setup, rate, iou, args.out))
log('done in %.1fs' % (time.time() - T0))
