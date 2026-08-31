# VolleyTakt Live 0.4.0 Preview7 – Funktionsgegencheck

## Ziel
Funktionsneutrale Modularisierung von Undo und Zustandsrekonstruktion.

## Geprüft
- Undo-Gruppierung über `event_group`
- Rückwärtskompatibler Undo-Fall Punkt + Side-out-Rotation
- Zustandsrekonstruktion aus Satzstart, Rally-Ergebnissen, Rotation, Wechsel und Spielstandskorrektur
- Rekonstruktion offener Rally-ID, Rally-Nr. und Rally-Sequenz
- Rekonstruktion von Libero-/Aufstellungszuständen
- Legacy-Rotation ohne gespeichertes `lineup_after`
- `app.r7r3f2.js` delegiert Rekonstruktion und Undo-Gruppierung an `js/scouting/history.js`
- Persistenz, CSV-Schreiben, Rendering und Reload-Orchestrierung verbleiben im App-Adapter
- Service Worker cached das neue Modul
- Versionskennungen Preview7
- bestehende Regressionstests
