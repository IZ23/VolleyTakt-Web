# VolleyTakt Live 0.4.0 Preview1 – Funktionscheck

Basis: **0.3.2 Preview2-r7 rebuild3-fix2**

Ziel dieser Preview ist ausschließlich der erste modulare Architekturschnitt. Es sind keine bewussten Änderungen an Scouting, UI, Analyse, Kamera, Sync oder persistiertem Datenformat enthalten.

## Neue Architekturgrenzen

- `js/app/state.js`
  - Default-State
  - Normalisierung geladener Zustände
  - Bereinigung für lokale State-Speicherung
  - Bereinigung für Match-Snapshots
- `js/app/selectors.js`
  - reine Stammdaten-Selektoren für Spielerinnen, Teams, Saisons und Spielarten
- `js/app/persistence.js`
  - Orchestrierung von State-/Event-/Master-Speicherung und Matcharchiv
  - Storage- und Sync-Implementierungen bleiben unverändert
- `js/app/commands.js`
  - gemeinsames Command-Vokabular als Vorbereitung für spätere Touch-/Tastatur-Vereinheitlichung

## Kompatibilitätsregeln

- `CURRENT_DATA_SCHEMA` bleibt **5**.
- Das persistierte Eventformat bleibt unverändert.
- Bestehende Spiele aus 0.3.2 Preview2-r7 rebuild3-fix2 müssen ohne Migration weiter lesbar sein.
- `cameraRecording` wird bei normaler State-Speicherung wie in fix2 beibehalten, aber bei Archiv-Snapshots weiterhin auf `false` gesetzt.
- Scouting-, Rally-, Punkt-, Rotations-, Undo-/Reconstruct-, Wechsel-/Libero-, Analyse- und Kameralogik verbleiben in Preview1 funktional im bisherigen Controller.

## Regressionstests

Alle mitgelieferten Tests laufen erfolgreich, einschließlich der bisherigen fix2-Regressionsprüfungen und der neuen Tests:

- `tests/preview040p1-architecture-test.mjs`
- `tests/preview040p1-persistence-test.mjs`

Die bestehenden versionsbezogenen Regressionstests wurden lediglich auf die neue Preview-/Cache-Kennung angepasst; ihre fachlichen Prüfungen bleiben erhalten.

## Manuelle Abnahme empfohlen

Vor Beginn von 0.4.0 Preview2 zusätzlich auf den realen Zielgeräten prüfen:

1. Start / Wiederaufnahme eines bestehenden Spiels
2. WER → WAS → WIE → WO → WOHIN, kompakt und detailliert
3. eigener und gegnerischer Aufschlag, inklusive direktem Gegneraufschlag
4. Punkt, Sideout und Rotation
5. Undo nach Rally und Rotation
6. Wechsel und Libero
7. Reload/Wiederaufnahme
8. Analyseansichten
9. Kamera verbinden, Aufnahme starten/stoppen
10. Smartphone- und Tablet-Querformat
11. Offline-Start nach einmaligem Online-Laden
