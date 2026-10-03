from pathlib import Path
import fixed_topology

assert fixed_topology.BODY_FACE_COUNT == 13379
assert fixed_topology.TARGET_HEIGHT_M == 1.75

sample = """
v 0 0 0
v 1 0 0
v 1 1 0
v 0 1 0
g body
f 1 2 3 4
g helper-test
f 1 2 3
"""

v, f = fixed_topology.parse_obj(sample)
assert len(v) == 4
assert len(f) == 2, f

target = """
# basemesh hm08
0 0.1 0.2 -0.3
"""
m = fixed_topology.apply_sparse_target(v, target, 1.0)
assert abs(m[0][0] - 0.1) < 1e-9
assert abs(m[0][1] - 0.3) < 1e-9
assert abs(m[0][2] - 0.2) < 1e-9

html = Path("index.html").read_text(encoding="utf-8")
js = Path("app.js").read_text(encoding="utf-8")
assert "v0.3.0" in html
assert "1f508f6083b2f823dab15de924b3bde72e08d77c" in js
assert "BODY_FACE_COUNT = 13379" in js

print("OK")
