# RESEARCH — Fixed Topology v0.3.0

## Upstream

MakeHuman Community HM08 basemesh.

Pinned commit:
`1f508f6083b2f823dab15de924b3bde72e08d77c`

The OxiHuman provenance project independently records the same upstream
MakeHuman v1.3.0 commit and SHA-256 for `base.obj`:

`8e761e6624b8f54536409135d1636da63b32486a90d4897f84e121d144f6fb4c`

## Body subset

MakeHuman API metadata identifies:
- body faces: first 13,379 face records
- visible body vertex range: 0..13,379
- helper geometry beyond the body includes eyes, teeth, tongue, genital,
  tights, skirt, hair and rig joint helpers.

MPFB's hm08 metadata likewise defines the `BODY` selection group as `body`.

## Morph architecture

MakeHuman/MPFB `.target` files are sparse vertex displacement lists.
They depend on stable vertex IDs. This is precisely why fixed topology is
superior to our v0.2.0 marching-cubes body for character generation.

`fixed_topology.py` already includes a target parser foundation.
