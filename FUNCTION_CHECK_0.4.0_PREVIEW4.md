# Funktionstest – VolleyTakt Live 0.4.0 Preview4

Basis: vollständiges ZIP von 0.4.0 Preview3. Ziel ist ausschließlich die vierte Stufe der Modularisierung.

## Architektur
- [x] `js/scouting/scouting.js` bleibt Capture-Engine.
- [x] `js/scouting/rally.js` bleibt Rally-/Transition-Controller.
- [x] `js/scouting/events.js` ist DOM-freier Event-Builder.
- [x] Event-Zeitfelder werden zentral normalisiert.
- [x] allgemeine Match-/Score-/Player-Eventfelder werden zentral aufgebaut.
- [x] eigene und gegnerische Aktions-Extras werden über dieselbe Fachfunktion normalisiert.
- [x] Event-Modul enthält keinen DOM-, Storage-, CSV-, Sync-, Kamera- oder Renderzugriff.
- [x] `appendEvent()` behält nur Persistenz-/Render-Orchestrierung.

## Unverändert
- [x] Datenschema 5.
- [x] Event-/CSV-Feldnamen.
- [x] Score-/Sideout-/Rotationslogik.
- [x] Satzlogik.
- [x] Undo/Reconstruction.
- [x] Analyse, Kamera, Storage, Sync und UI.
