# TESTING — v0.1.3.1

## Vaste testlink

https://gasvdv-lab.github.io/Avatar/

## Android test

1. Upload release naar `main`.
2. Wacht tot GitHub Pages opnieuw gebouwd is.
3. Open de vaste testlink.
4. Controleer dat bovenaan `v0.1.3.1` staat.
5. Controleer dat de status niet op `3D body laden...` blijft staan.
6. De status moet het aantal vertices en triangles tonen.
7. Test Front, 3/4, Side, Back en Reset.
8. Sleep over de body om te draaien.
9. Test pinch-zoom.

## Belangrijk

De viewer gebruikt geen `fetch()` meer voor de body-mesh.
