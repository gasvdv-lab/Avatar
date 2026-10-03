import json
import unittest
from pathlib import Path

from body_base import build_base_body_spec
from body_mesh import build_preview_mesh

class BodyTests(unittest.TestCase):
    def test_spec(self):
        s=build_base_body_spec()
        self.assertEqual(s["gender_presentation"],"neutral")
        self.assertEqual(s["pose"],"A-pose")

    def test_mesh(self):
        m=build_preview_mesh(build_base_body_spec())
        self.assertGreater(len(m["vertices"]),500)
        self.assertGreater(len(m["triangles"]),900)

    def test_export_exists(self):
        p=Path("body_mesh.json")
        self.assertTrue(p.exists())
        d=json.loads(p.read_text(encoding="utf-8"))
        self.assertEqual(d["metadata"]["version"],"0.1.3")

    def test_web_root(self):
        for f in ["index.html","app.js","style.css"]:
            self.assertTrue(Path(f).exists(),f)

if __name__=="__main__":
    unittest.main()
