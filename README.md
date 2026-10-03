# AvatarEngine v0.2.0 — Anatomy Research Body

## Test de app

https://gasvdv-lab.github.io/Avatar/

Deze vaste link moet in elke relevante toekomstige release behouden blijven.

## Waarom een reset?

De v0.1.x-body was opgebouwd uit losse lofts/ringen en zag daardoor uit als
een primitieve mannequin. v0.2.0 gebruikt een andere methode:

1. anatomische hoofdvolumes
2. ribbenkast, abdomen en bekken als aparte organische volumes
3. echte schouder/deltoid-overgang
4. taps toelopende bovenarmen en onderarmen
5. dij, knie, kuit en enkel als verschillende vormen
6. één impliciet oppervlak
7. marching cubes maakt daar één gesloten triangle mesh van

Python is dus opnieuw de bron van de body.

## Ontwerpmaat

Referentie:
- lengte: 1.75 m
- hoofdhoogte: 0.235 m
- schouderbreedte: 0.420 m
- borstbreedte: 0.355 m
- taillebreedte: 0.285 m
- heupbreedte: 0.350 m
- kniehoogte: 0.465 m
- handlengte: 0.180 m
- voetlengte: 0.250 m

Dit zijn onze ontwerpwaarden voor een genderneutrale colony-crew mannequin,
geen claim dat dit universele menselijke gemiddelden zijn.

## Python

`generate_body.py` genereert de body opnieuw.

Dependencies:

```text
numpy
scikit-image
```

## Internetonderzoek

De richting is gebaseerd op:
- NASA Human Integration Design Handbook / anthropometrie
- MakeHuman/MPFB basemesh-principes
- MakeHuman morph-target architectuur

De volgende grote stap is een echte vaste-topologie basemesh met morph targets.
