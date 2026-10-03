# AvatarEngine v0.1.3.1 — Inline Viewer Fix

## Test de app

**Vaste live link:**

https://gasvdv-lab.github.io/Avatar/

## Wat is opgelost

De vorige viewer laadde de mesh via `fetch("body_mesh.json")`.
Op Android/GitHub Pages bleef de pagina daardoor hangen op `3D body laden...`.

In v0.1.3.1 zit alles wat nodig is om de body te tonen rechtstreeks in
`index.html`:

- mesh vertices
- triangles
- WebGL renderer
- styling
- touch controls

Er is geen aparte netwerkrequest meer nodig om de 3D-body te laden.

## Upload

Vervang/upload de bestanden uit deze ZIP in de root van:

`gasvdv-lab/Avatar`

Commit naar `main`.

Test daarna via:

https://gasvdv-lab.github.io/Avatar/

## Controle

Bovenaan moet staan:

`v0.1.3.1 · Inline Body Viewer Fix`

Daarmee zie je meteen of GitHub Pages de nieuwe versie serveert.
