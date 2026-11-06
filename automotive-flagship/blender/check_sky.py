"""Expected display colour of sky pixels (graded dome EXR -> Khronos PBR Neutral -> sRGB) vs both renders."""
import bpy, sys, json, math, os
import numpy as np
from mathutils import Matrix, Vector
root = sys.argv[sys.argv.index('--') + 1]
P = lambda *a: os.path.join(root, *a)
C = json.load(open(P('automotive-flagship/contract/scene-contract.json')))
pose = C['poses'][0]
CM = Matrix(((1, 0, 0, 0), (0, 0, -1, 0), (0, 1, 0, 0), (0, 0, 0, 1)))
e = pose['camera']['matrixWorld']
M = CM @ Matrix([[e[0], e[4], e[8], e[12]], [e[1], e[5], e[9], e[13]], [e[2], e[6], e[10], e[14]], [e[3], e[7], e[11], e[15]]])
img = bpy.data.images.load(P('automotive-flagship/renders/cache/graded_dome.exr'))
W, H = img.size
px = np.empty(W * H * 4, np.float32); img.pixels.foreach_get(px); px = px.reshape(H, W, 4)
def neutral(c):
    c = np.array(c, dtype=np.float64)
    start, desat = 0.8 - 0.04, 0.15
    x = c.min(); off = x - 6.25 * x * x if x < 0.08 else 0.04
    c = c - off
    peak = c.max()
    if peak < start: return c
    d = 1 - start; newPeak = 1 - d * d / (peak + d - start)
    c = c * (newPeak / peak)
    g = 1 - 1 / (desat * (peak - newPeak) + 1)
    return c * (1 - g) + newPeak * g
srgb = lambda c: [255 * (12.92 * v if v <= 0.0031308 else 1.055 * v ** (1 / 2.4) - 0.055) for v in np.clip(c, 0, 1)]
fov = math.radians(pose['camera']['fov']); Wr, Hr = 960, 540
th = math.tan(fov / 2)
for (x, y) in [(480, 50), (200, 160), (700, 230)]:
    d = Vector(((2 * (x + 0.5) / Wr - 1) * th * Wr / Hr, (1 - 2 * (y + 0.5) / Hr) * th, -1))
    dw = (M.to_3x3() @ d).normalized()
    o = M.translation
    # ray to dome sphere centred (0,0,h-0.06) radius R (upper hemisphere = sphere)
    c0 = Vector((0, 0, C['world']['skyHeight'] - 0.06)); R = C['world']['skyRadius']
    oc = o - c0; b = oc.dot(dw); t = -b + math.sqrt(b * b - (oc.dot(oc) - R * R))
    q = (o + dw * t - c0).normalized()
    u = 0.5 - math.atan2(q.y, q.x) / (2 * math.pi); v = math.asin(q.z) / math.pi + 0.5
    rad = px[int(v * H), int(u * W) % W, :3]
    print('PIX', x, y, 'radiance', np.round(rad, 3).tolist(), 'expected sRGB', [round(c) for c in srgb(neutral(rad))])
