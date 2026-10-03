"""AvatarEngine v0.3.0 — fixed-topology MakeHuman HM08 foundation.

The browser viewer loads the CC0 MakeHuman base.obj remotely.
This Python module provides the same parsing architecture for future local use.

Pinned upstream MakeHuman commit:
1f508f6083b2f823dab15de924b3bde72e08d77c
"""

from pathlib import Path

BODY_FACE_COUNT = 13379
TARGET_HEIGHT_M = 1.75

def parse_obj(text: str):
    vertices = []
    body_faces = []
    active_group = None
    face_counter = 0

    for raw in text.splitlines():
        line = raw.strip()
        if not line or line.startswith("#"):
            continue

        if line.startswith("v "):
            parts = line.split()
            vertices.append(tuple(float(x) for x in parts[1:4]))
            continue

        if line.startswith("g "):
            active_group = line[2:].strip()
            continue

        if line.startswith("f "):
            # Prefer explicit body group when present.
            # Fallback: upstream metadata documents the first 13,379 body faces.
            is_body = active_group == "body" or (
                active_group in (None, "") and face_counter < BODY_FACE_COUNT
            )

            if is_body:
                idx = []
                for token in line.split()[1:]:
                    vi = int(token.split("/")[0])
                    if vi < 0:
                        vi = len(vertices) + vi
                    else:
                        vi -= 1
                    idx.append(vi)

                # Preserve original vertex IDs, triangulate only for rendering.
                for i in range(1, len(idx)-1):
                    body_faces.append((idx[0], idx[i], idx[i+1]))

            face_counter += 1

    if not vertices:
        raise ValueError("No vertices parsed")
    if not body_faces:
        raise ValueError("No body faces parsed")

    return vertices, body_faces

def normalize_to_height(vertices, target_height=TARGET_HEIGHT_M):
    """Normalize whichever axis has the largest extent to target height."""
    mins = [min(v[i] for v in vertices) for i in range(3)]
    maxs = [max(v[i] for v in vertices) for i in range(3)]
    extents = [maxs[i]-mins[i] for i in range(3)]
    up = max(range(3), key=lambda i: extents[i])

    center = [(mins[i]+maxs[i])*0.5 for i in range(3)]
    scale = target_height / extents[up]

    out = []
    for v in vertices:
        q = [(v[i]-center[i])*scale for i in range(3)]
        # Rotate coordinates so viewer uses Y-up.
        if up == 0:
            x, y, z = q[1], q[0], q[2]
        elif up == 1:
            x, y, z = q[0], q[1], q[2]
        else:
            x, y, z = q[0], q[2], q[1]
        out.append((x, y + target_height/2, z))
    return out

def apply_sparse_target(vertices, target_text: str, weight=1.0):
    """Apply MakeHuman .target displacements while preserving vertex IDs.

    Target convention documented by MPFB:
    index x_offset z_offset y_offset, with Y sign-inverted.
    """
    out = [list(v) for v in vertices]

    for raw in target_text.splitlines():
        line = raw.strip()
        if not line or line.startswith("#") or line.startswith('"'):
            continue
        parts = line.split()
        if len(parts) != 4:
            continue

        i = int(parts[0])
        dx = float(parts[1])
        dz = float(parts[2])
        dy = -float(parts[3])

        if 0 <= i < len(out):
            out[i][0] += dx * weight
            out[i][1] += dy * weight
            out[i][2] += dz * weight

    return [tuple(v) for v in out]

if __name__ == "__main__":
    print("AvatarEngine v0.3.0 fixed-topology parser ready.")
    print("Expected visible HM08 body vertices: 13,380")
    print("Expected body faces: 13,379")
