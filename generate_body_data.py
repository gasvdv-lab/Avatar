"""Regenerate body_mesh.json from the Python body generator."""

import json
from body_base import build_base_body_spec
from body_mesh import build_preview_mesh

spec=build_base_body_spec()
mesh=build_preview_mesh(spec)

payload={
    "spec":{
        "id":spec["id"],
        "style":spec["style"],
        "pose":spec["pose"],
        "height_m":spec["height_m"],
        "build":spec["build"],
        "gender_presentation":spec["gender_presentation"],
    },
    **mesh
}

with open("body_mesh.json","w",encoding="utf-8") as f:
    json.dump(payload,f,separators=(",",":"))

print("body_mesh.json generated")
