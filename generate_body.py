"""
AvatarEngine v0.2.0
Research-based gender-neutral colony crew base body.

Method:
- Anthropometric reference proportions
- Anatomical volumes (ribcage, abdomen, pelvis, head, neck, shoulders)
- Tapered limb capsules
- Soft-union implicit surface
- Marching cubes -> one watertight mesh

This is intentionally a mannequin/body foundation, not a finished face.
"""

from pathlib import Path
import json
import numpy as np
from skimage.measure import marching_cubes

HEIGHT_M = 1.75

# Reference design measurements.
# These are not intended as population claims; they are our neutral game-body targets.
BODY_SPEC = {
    "height_m": 1.75,
    "head_height_m": 0.235,
    "shoulder_breadth_m": 0.420,
    "chest_breadth_m": 0.355,
    "waist_breadth_m": 0.285,
    "hip_breadth_m": 0.350,
    "knee_height_m": 0.465,
    "hand_length_m": 0.180,
    "foot_length_m": 0.250,
    "style": "gender-neutral semi-anime colony crew",
    "pose": "relaxed A-pose",
}

def generate(grid=(66, 112, 54)):
    nx, ny, nz = grid
    xs = np.linspace(-0.62, 0.62, nx)
    ys = np.linspace(0.00, 1.82, ny)
    zs = np.linspace(-0.30, 0.38, nz)
    X, Y, Z = np.meshgrid(xs, ys, zs, indexing="ij")
    P = np.stack([X, Y, Z], axis=-1)

    def ellipsoid(center, radii):
        c = np.asarray(center, dtype=float)
        r = np.asarray(radii, dtype=float)
        q = (P - c) / r
        return (np.linalg.norm(q, axis=-1) - 1.0) * float(np.min(r))

    def capsule(a, b, r0, r1):
        a = np.asarray(a, dtype=float)
        b = np.asarray(b, dtype=float)
        ba = b - a
        pa = P - a
        t = np.clip(np.sum(pa * ba, axis=-1) / np.dot(ba, ba), 0.0, 1.0)
        closest = a + t[..., None] * ba
        radius = r0 + (r1 - r0) * t
        return np.linalg.norm(P - closest, axis=-1) - radius

    def oriented_ellipsoid(center, radii, direction):
        center = np.asarray(center, dtype=float)
        d = np.asarray(direction, dtype=float)
        d /= np.linalg.norm(d)

        helper = np.array([0.0, 0.0, 1.0])
        if abs(np.dot(d, helper)) > 0.95:
            helper = np.array([1.0, 0.0, 0.0])

        xaxis = np.cross(d, helper)
        xaxis /= np.linalg.norm(xaxis)
        zaxis = np.cross(xaxis, d)
        zaxis /= np.linalg.norm(zaxis)

        rel = P - center
        qx = np.sum(rel * xaxis, axis=-1) / radii[0]
        qy = np.sum(rel * d, axis=-1) / radii[1]
        qz = np.sum(rel * zaxis, axis=-1) / radii[2]
        return (np.sqrt(qx*qx + qy*qy + qz*qz) - 1.0) * min(radii)

    def smooth_union(a, b, k=0.040):
        h = np.maximum(k - np.abs(a - b), 0.0) / k
        return np.minimum(a, b) - h*h*k*0.25

    field = np.full((nx, ny, nz), 10.0, dtype=np.float32)
    parts = []

    # Torso: three overlapping anatomical masses rather than one cylinder.
    parts += [
        ellipsoid((0.0, 1.270,  0.010), (0.205, 0.255, 0.145)),  # rib cage
        ellipsoid((0.0, 1.080, -0.005), (0.158, 0.200, 0.115)),  # abdomen
        ellipsoid((0.0, 0.920, -0.005), (0.190, 0.160, 0.130)),  # pelvis
        capsule((0.0, 1.420, 0.0), (0.0, 1.550, 0.0), 0.078, 0.068), # neck
    ]

    # Head: cranium + lower face. Slightly enlarged for semi-anime styling.
    parts += [
        ellipsoid((0.0, 1.675, 0.005), (0.112, 0.145, 0.118)),
        ellipsoid((0.0, 1.595, 0.020), (0.092, 0.085, 0.095)),
    ]

    for side in (-1, 1):
        # Arms: deltoid + tapered upper arm + tapered forearm + hand.
        shoulder = np.array([side * 0.215, 1.430, 0.000])
        elbow    = np.array([side * 0.390, 1.160, 0.010])
        wrist    = np.array([side * 0.500, 0.910, 0.015])
        hand     = np.array([side * 0.550, 0.810, 0.030])

        parts += [
            ellipsoid(shoulder, (0.105, 0.105, 0.105)),
            capsule(shoulder, elbow, 0.078, 0.055),
            capsule(elbow, wrist, 0.058, 0.041),
            oriented_ellipsoid(hand, (0.045, 0.105, 0.032), hand - wrist),
        ]

        # Legs: hip transition + thigh + knee/calf shaping + ankle + foot.
        hip   = np.array([side * 0.105, 0.900, 0.000])
        knee  = np.array([side * 0.105, 0.485, 0.015])
        calf  = np.array([side * 0.100, 0.280, 0.000])
        ankle = np.array([side * 0.095, 0.110, 0.005])

        parts += [
            ellipsoid(hip, (0.110, 0.110, 0.110)),
            capsule(hip, knee, 0.112, 0.068),
            capsule(knee, calf, 0.068, 0.080),
            capsule(calf, ankle, 0.080, 0.045),
            oriented_ellipsoid(
                (side * 0.095, 0.065, 0.100),
                (0.058, 0.130, 0.045),
                (0.0, 0.0, 1.0)
            ),
        ]

    for part in parts:
        field = smooth_union(field, part, 0.040)

    spacing = (xs[1]-xs[0], ys[1]-ys[0], zs[1]-zs[0])
    vertices, faces, _, _ = marching_cubes(field, level=0.0, spacing=spacing)

    vertices[:, 0] += xs[0]
    vertices[:, 1] += ys[0]
    vertices[:, 2] += zs[0]

    # Scale exact total height to 1.75 m.
    ymin, ymax = vertices[:,1].min(), vertices[:,1].max()
    vertices[:,1] = (vertices[:,1] - ymin) * (HEIGHT_M / (ymax-ymin))

    # Put feet at y=0.
    vertices[:,1] -= vertices[:,1].min()

    return vertices.astype(np.float32), faces.astype(np.int32)

def export_json(path="body_mesh.json"):
    vertices, faces = generate()
    payload = {
        "version": "0.2.0",
        "method": "anatomical implicit surface + marching cubes",
        "body_spec": BODY_SPEC,
        "vertices": np.round(vertices, 6).tolist(),
        "triangles": faces.tolist(),
    }
    Path(path).write_text(json.dumps(payload, separators=(",", ":")), encoding="utf-8")
    return payload

if __name__ == "__main__":
    data = export_json()
    print("AvatarEngine v0.2.0")
    print("Vertices:", len(data["vertices"]))
    print("Triangles:", len(data["triangles"]))
    print("Height:", BODY_SPEC["height_m"], "m")
