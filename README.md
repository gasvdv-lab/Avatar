# AvatarEngine

GitHub Pages-ready baseline.

## Test de app

Vaste testlink:

https://gasvdv-lab.github.io/Avatar/

Gebruik deze link na elke release om de actuele GitHub Pages-versie te testen.

## Publicatie

Deze repository gebruikt een GitHub Actions workflow om de site rechtstreeks
vanuit de repository-root naar GitHub Pages te publiceren.

Na upload/commit naar `main`:

1. Open tab `Actions`.
2. Wacht tot `Deploy to GitHub Pages` groen is.
3. Test de app via:

https://gasvdv-lab.github.io/Avatar/

## Structuur

Alle projectbestanden staan rechtstreeks in de root.

Enige technische uitzondering:
`.github/workflows/deploy.yml`

GitHub vereist die mapstructuur voor Actions-workflows.

## Vaste projectregel

De testlink `https://gasvdv-lab.github.io/Avatar/` moet voortaan in elke
relevante release-README blijven staan.
