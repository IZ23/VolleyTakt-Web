# VolleyTakt Live 0.4.0 Preview1

## Zweck

Erster Schritt der geplanten modularen Architektur. Die Preview basiert funktional auf **0.3.2 Preview2-r7 rebuild3-fix2** und soll sich für Anwenderinnen und Anwender identisch verhalten.

## Änderungen

- zentraler Anwendungs-State in `js/app/state.js` ausgelagert
- State-Normalisierung aus dem bisherigen Hauptcontroller ausgelagert
- getrennte kompatible Bereinigung für lokale Speicherung und Archiv-Snapshots
- Stammdaten-Selektoren in `js/app/selectors.js` ausgelagert
- Persistenz-Orchestrierung in `js/app/persistence.js` ausgelagert
- gemeinsames Command-Vokabular in `js/app/commands.js` vorbereitet
- Service-Worker-Cache um die neuen Module erweitert
- Versionskennung auf **0.4.0 Preview1** angehoben
- bestehende Regressionstests auf die neue Versionskennung fortgeführt
- neue Architektur-/State-/Persistenztests ergänzt

## Bewusst unverändert

- Scouting-Fachlogik
- Rally-, Punkt-, Sideout- und Rotationslogik
- Undo und Reconstruction
- Wechsel und Libero
- Analyse
- Kameraadapter DJI/GoPro
- Storage-Implementierung und Datenschema
- Sync-Implementierung
- UI und responsive Layouts

## Datenkompatibilität

`CURRENT_DATA_SCHEMA = 5` bleibt unverändert. Für den Wechsel von 0.3.2 Preview2-r7 rebuild3-fix2 auf 0.4.0 Preview1 ist keine neue Datenmigration vorgesehen.
