# AvatarEngine v0.4.0 — Future Astronaut Suit

## Test de app

**Vaste live link:**

https://gasvdv-lab.github.io/Avatar/

## Dit is nu echte 3D-kleding

De vorige blue T-shirt poging gebruikte alleen kleur/shaderlogica.
Dat is niet wat we willen.

v0.4.0 maakt daarom aparte 3D-meshlagen bovenop de HM08-body:

- blauwe pressure/utility undersuit
- witte torso armor
- witte schouderpanelen
- donkere forearm guards
- echte 3D handschoenlaag
- knie/scheenbescherming
- boots
- borstplaat
- utility belt
- twee zijpouches
- life-support backpack
- oranje buckle/accent

De kleding wordt opgebouwd uit echte HM08 body-triangles die naar buiten worden
geoffset langs de surface normals. Daardoor is de kleding fysiek een aparte
3D-surface en niet enkel een andere kleur van de huid.

## Waarom dit nuttig is

Deze aanpak laat ons direct in GitHub Pages echte outfitvolumes testen zonder
Blender op Android.

Later kunnen we de prototype-lagen vervangen door volwaardige kledingmeshes
met eigen topology, naden, dikte, materials en rigging.

## Upload

Upload/vervang alle bestanden in de root van:

`gasvdv-lab/Avatar`

Commit naar `main`.

Daarna moet bovenaan staan:

`v0.4.0 · Future Astronaut Suit`

## Vaste testlink

https://gasvdv-lab.github.io/Avatar/
