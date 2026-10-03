import json
from pathlib import Path

data=json.loads(Path("body_mesh.json").read_text(encoding="utf-8"))
assert data["version"]=="0.2.0"
assert len(data["vertices"]) > 5000
assert len(data["triangles"]) > 10000
ys=[v[1] for v in data["vertices"]]
height=max(ys)-min(ys)
assert abs(height-1.75) < 0.002, height
assert Path("index.html").exists()
print("OK")
print("vertices:",len(data["vertices"]))
print("triangles:",len(data["triangles"]))
print("height:",height)
