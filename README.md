# AvatarEngine v0.3.0 — Fixed Topology Human Base

## Test de app

**Vaste live link:**

https://gasvdv-lab.github.io/Avatar/

Deze link blijft in elke relevante release staan.

## Grote wijziging

v0.3.0 gebruikt niet langer onze zelfgemaakte marching-cubes/mannequin als primaire basis.

De live viewer laadt de officiële **MakeHuman HM08 basemesh** vanuit een
vastgepinde upstream commit:

`1f508f6083b2f823dab15de924b3bde72e08d77c`

Bronbestand:

`makehuman/data/3dobjs/base.obj`

De upstream core asset is door het MakeHuman-project als CC0 vrijgegeven.

## Waarom dit beter is

HM08 heeft vaste topologie:
- dezelfde vertex-ID's voor elk lichaam
- dezelfde face-topologie
- geschikt voor MakeHuman `.target` morphs
- geschikt voor clothing helpers en rigs
- bewezen menselijke anatomische topology

In deze release tonen we alleen de officiële `body`-faces. Helpergeometrie,
ogen, tanden, skirt/tights helpers en joints worden niet gerenderd.

## Browserarchitectuur

De GitHub Pages-viewer:
1. downloadt `base.obj`
2. parseert de originele vertices
3. behoudt de oorspronkelijke vertex-indexen
4. selecteert alleen de body-topologie
5. trianguleert quads uitsluitend voor WebGL-rendering
6. schaalt het zichtbare lichaam naar 1.75 m
7. toont het op Android

## Python

`fixed_topology.py` bevat dezelfde OBJ-parserarchitectuur en alvast een
`apply_sparse_target()` voor MakeHuman `.target` bestanden.

Dat is belangrijk: vanaf hier hoeft Python geen nieuw lichaam te verzinnen.
Python kan een bestaande professionele body gericht vervormen.

## Volgende stap

v0.3.1:
- neutral colony-crew morph preset
- schouder/heup-verhouding
- lichaamslengte
- semi-anime proportion target
- onderzoek welke MakeHuman targets we direct kunnen hergebruiken
