# Research notes — Base Body v0.2.0

## NASA

NASA's Human Integration Design Handbook behandelt antropometrische maten zoals
acromial height, bideltoid breadth, chest breadth, hip breadth, knee height,
sitting height en shoulder-elbow length. NASA benadrukt ook dat ontwerpwaarden
afhangen van taak, houding, mobiliteit en kleding/uitrusting.

Voor AvatarEngine gebruiken we dit als ontwerpmethode: landmarks en functionele
maten eerst, artistieke stylisatie daarna.

## MakeHuman / MPFB

MakeHuman gebruikt één basemesh met vaste topologie. De zichtbare hm08-body
heeft 13.380 genummerde bodyvertices; helpergeometrie loopt verder tot 19.158
vertices.

Vormvarianten worden niet gemaakt door nieuwe primitieve onderdelen toe te
voegen. Morph targets verplaatsen bestaande vertices terwijl de topologie
gelijk blijft. Dat is uiteindelijk ook de gewenste architectuur voor
AvatarEngine.

De core graphical assets van MakeHuman, waaronder de basemesh en targets,
worden door het MakeHuman-project als CC0-assets gepubliceerd.

## v0.2.0 keuze

Deze release gebruikt nog niet de hm08-basemesh zelf. Hij gebruikt een
research-based Python implicit-body generator om onmiddellijk een veel
organischer prototype op GitHub Pages te kunnen testen.

De volgende architectuurstap kan de CC0 MakeHuman-basemesh rechtstreeks als
vaste topologie gebruiken en Python morph targets laten toepassen.
