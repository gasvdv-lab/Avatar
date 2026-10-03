# AvatarEngine v0.1.3 — GitHub 3D Body Viewer

## Test de app

**Vaste live link:**

https://gasvdv-lab.github.io/Avatar/

Deze link moet in elke relevante toekomstige release behouden blijven.

## Wat is nieuw

De GitHub Pages-site toont nu de eerste echte interactieve 3D-versie van de
genderneutrale base body.

- WebGL 3D-rendering
- touch-rotatie
- pinch-zoom
- Front / 3/4 / Side / Back / Reset
- smooth semi-anime basis
- A-pose
- Python blijft de bron van de geometrie
- gegenereerde `body_mesh.json` wordt rechtstreeks door GitHub Pages geladen

## GitHub-structuur

Alle projectbestanden staan rechtstreeks in de repository-root.

De enige technische uitzondering blijft:

`.github/workflows/deploy.yml`

GitHub vereist die locatie voor Actions-workflows.

## Upload

Upload/vervang alle bestanden uit deze ZIP in de root van:

`gasvdv-lab/Avatar`

Commit naar `main`.

Daarna test je via:

https://gasvdv-lab.github.io/Avatar/

## Huidige status

Dit is nog een preview-mesh. De volgende fase is visuele body refinement:
schouders, torso, heupen, benen, handen en voeten beoordelen op de echte viewer.
