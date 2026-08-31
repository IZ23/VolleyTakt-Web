# VolleyTakt Live 0.4.0 Preview6 – Funktionsgegencheck

## Ziel
Funktionsneutrale Modularisierung von Rotation sowie Satz-/Match-Zustandsübergängen.

## Geprüft
- Rotation vor/zurück für P1–P6
- Rotationsindex inklusive Rollover
- eigene und gegnerische Satzaufstellung
- Libero-Liste weiterhin auf die bisherige Anzahl begrenzt
- Reset für Folgesatz
- Match-Endzustand
- Quick-Scout-Satzvorbereitung
- tatsächlich geladener Einstieg `app.r7r3f2.js` nutzt das neue Modul
- Service Worker cached das neue Modul
- Versionskennungen Preview6
- bestehende Regressionstests
