\
"""Procedural preview mesh generator for the neutral colony body."""

from math import cos, sin, tau, radians, sqrt

def _normalize(v):
    x, y, z = v
    l = sqrt(x*x + y*y + z*z) or 1.0
    return (x/l, y/l, z/l)

def _ring_y(center, rx, rz, segments):
    cx, cy, cz = center
    return [
        (cx + rx*cos(tau*i/segments), cy, cz + rz*sin(tau*i/segments))
        for i in range(segments)
    ]

def _append_loft(vertices, triangles, rings, cap_start=True, cap_end=True):
    if len(rings) < 2:
        return

    idx_rings = []
    for ring in rings:
        base = len(vertices)
        vertices.extend(ring)
        idx_rings.append(list(range(base, base + len(ring))))

    n = len(rings[0])
    for a, b in zip(idx_rings[:-1], idx_rings[1:]):
        for i in range(n):
            j = (i + 1) % n
            triangles.append((a[i], b[i], b[j]))
            triangles.append((a[i], b[j], a[j]))

    if cap_start:
        center = tuple(sum(p[k] for p in rings[0])/n for k in range(3))
        ci = len(vertices)
        vertices.append(center)
        r = idx_rings[0]
        for i in range(n):
            j=(i+1)%n
            triangles.append((ci, r[j], r[i]))

    if cap_end:
        center = tuple(sum(p[k] for p in rings[-1])/n for k in range(3))
        ci = len(vertices)
        vertices.append(center)
        r = idx_rings[-1]
        for i in range(n):
            j=(i+1)%n
            triangles.append((ci, r[i], r[j]))

def _torso(spec, segments=28):
    p=spec["proportions"]; h=spec["height_m"]
    profile = [
        (0.465*h, p["hip_width_m"]*0.41, 0.095),
        (0.50*h,  p["hip_width_m"]*0.50, 0.112),
        (0.545*h, p["hip_width_m"]*0.47, 0.108),
        (0.585*h, p["waist_width_m"]*0.53, 0.099),
        (0.625*h, p["waist_width_m"]*0.50, 0.096),
        (0.665*h, p["chest_width_m"]*0.46, 0.111),
        (0.705*h, p["chest_width_m"]*0.50, 0.130),
        (0.742*h, p["chest_width_m"]*0.49, 0.128),
        (0.775*h, p["shoulder_width_m"]*0.43, 0.112),
        (0.798*h, 0.090, 0.079),
    ]
    return [_ring_y((0,y,0), rx, rz, segments) for y,rx,rz in profile]

def _head(spec, segments=28):
    h=spec["height_m"]
    profile = [
        (0.798*h, 0.065, 0.061),
        (0.820*h, 0.074, 0.070),
        (0.845*h, 0.082, 0.080),
        (0.875*h, 0.094, 0.101),
        (0.910*h, 0.101, 0.108),
        (0.945*h, 0.096, 0.101),
        (0.974*h, 0.078, 0.079),
        (0.992*h, 0.046, 0.042),
    ]
    return [_ring_y((0,y,0), rx, rz, segments) for y,rx,rz in profile]

def _arm(spec, side, segments=18):
    p=spec["proportions"]; h=spec["height_m"]
    shoulder=(side*p["shoulder_width_m"]*0.50, 0.765*h, 0.0)
    angle=radians(p["a_pose_arm_angle_deg"])
    ux=side*sin(angle); uy=-cos(angle)
    total=p["arm_length_ratio"]*h
    upper=total*p["upper_arm_ratio"]
    fore=total*p["forearm_ratio"]

    pts=[
        (*shoulder, 0.080,0.071),
        (shoulder[0]+ux*upper*.25, shoulder[1]+uy*upper*.25, 0, 0.076,0.068),
        (shoulder[0]+ux*upper*.55, shoulder[1]+uy*upper*.55, 0, 0.067,0.060),
        (shoulder[0]+ux*upper, shoulder[1]+uy*upper, 0, 0.054,0.050),
        (shoulder[0]+ux*(upper+fore*.35), shoulder[1]+uy*(upper+fore*.35), 0, 0.062,0.050),
        (shoulder[0]+ux*(upper+fore*.70), shoulder[1]+uy*(upper+fore*.70), 0, 0.055,0.046),
        (shoulder[0]+ux*(upper+fore), shoulder[1]+uy*(upper+fore), 0, 0.041,0.038),
    ]

    dx,dy,_=_normalize((ux,uy,0))
    bx=(dy,-dx,0)
    bz=(0,0,1)
    rings=[]
    for cx,cy,cz,r1,r2 in pts:
        ring=[]
        for i in range(segments):
            a=tau*i/segments
            ring.append((
                cx+bx[0]*r1*cos(a)+bz[0]*r2*sin(a),
                cy+bx[1]*r1*cos(a)+bz[1]*r2*sin(a),
                cz+bx[2]*r1*cos(a)+bz[2]*r2*sin(a),
            ))
        rings.append(ring)
    return rings

def _hand(spec, side, segments=16):
    p=spec["proportions"]; h=spec["height_m"]
    shoulder_x=side*p["shoulder_width_m"]*.50
    shoulder_y=.765*h
    angle=radians(p["a_pose_arm_angle_deg"])
    ux=side*sin(angle); uy=-cos(angle)
    total=p["arm_length_ratio"]*h
    wx=shoulder_x+ux*total
    wy=shoulder_y+uy*total
    L=p["hand_length_m"]

    dx,dy,_=_normalize((ux,uy,0))
    bx=(dy,-dx,0); bz=(0,0,1)
    rings=[]
    for t,r1,r2 in [
        (0.00,.041,.038),
        (.22,.048,.030),
        (.48,.051,.028),
        (.72,.045,.025),
        (1.00,.025,.019),
    ]:
        cx=wx+ux*L*t; cy=wy+uy*L*t
        ring=[]
        for i in range(segments):
            a=tau*i/segments
            ring.append((
                cx+bx[0]*r1*cos(a)+bz[0]*r2*sin(a),
                cy+bx[1]*r1*cos(a)+bz[1]*r2*sin(a),
                bx[2]*r1*cos(a)+bz[2]*r2*sin(a),
            ))
        rings.append(ring)
    return rings

def _leg(spec, side, segments=20):
    p=spec["proportions"]; h=spec["height_m"]
    x0=side*p["hip_width_m"]*.34
    profile=[
        (.505*h, x0,       .107,.096),
        (.455*h, x0*.99,   .104,.092),
        (.405*h, x0*.97,   .097,.087),
        (.350*h, x0*.94,   .084,.077),
        (.292*h, x0*.90,   .066,.061),
        (.255*h, x0*.88,   .071,.063),
        (.215*h, x0*.86,   .079,.068),
        (.170*h, x0*.83,   .071,.061),
        (.125*h, x0*.81,   .058,.052),
        (.075*h, x0*.79,   .044,.041),
    ]
    return [_ring_y((x,y,0),rx,rz,segments) for y,x,rx,rz in profile]

def _foot(spec, side, segments=16):
    p=spec["proportions"]; h=spec["height_m"]
    x=side*p["hip_width_m"]*.27
    L=p["foot_length_m"]
    rings=[]
    profile=[
        (.073*h, 0.000, .045,.040),
        (.055*h, .035,  .050,.039),
        (.043*h, .080,  .056,.036),
        (.034*h, .135,  .058,.032),
        (.029*h, L*.75, .050,.027),
        (.026*h, L,     .033,.021),
    ]
    for y,z,rx,ry in profile:
        ring=[]
        for i in range(segments):
            a=tau*i/segments
            ring.append((x+rx*cos(a), y+ry*sin(a), z))
        rings.append(ring)
    return rings

def build_preview_mesh(spec):
    vertices=[]; triangles=[]
    _append_loft(vertices,triangles,_torso(spec))
    _append_loft(vertices,triangles,_head(spec))
    for side in (-1,1):
        _append_loft(vertices,triangles,_arm(spec,side))
        _append_loft(vertices,triangles,_hand(spec,side))
        _append_loft(vertices,triangles,_leg(spec,side))
        _append_loft(vertices,triangles,_foot(spec,side))
    return {
        "vertices": vertices,
        "triangles": triangles,
        "metadata": {
            "version":"0.1.3",
            "body":"colony_base_neutral_v013",
            "production_topology": False,
            "style": spec["style"],
            "pose": spec["pose"],
        }
    }
