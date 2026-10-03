"""AvatarEngine v0.1.3."""

from body_base import build_base_body_spec
from body_mesh import build_preview_mesh

def main():
    spec=build_base_body_spec()
    mesh=build_preview_mesh(spec)
    print("AvatarEngine v0.1.3")
    print(f"Body: {spec['id']}")
    print(f"Vertices: {len(mesh['vertices'])}")
    print(f"Triangles: {len(mesh['triangles'])}")
    print("GitHub 3D Body Viewer data ready.")

if __name__=="__main__":
    main()
