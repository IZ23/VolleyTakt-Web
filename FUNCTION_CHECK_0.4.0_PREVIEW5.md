# VolleyTakt Live 0.4.0 Preview5 – Funktionsgegencheck

## Architektur
- `js/scouting/scoring.js` ist DOM- und Storage-frei.
- Punktstand-/Aufschlag-/Sideout-Transition wird außerhalb von `app.js` berechnet.
- Satzgewinnerprüfung verwendet weiterhin Zielpunktzahl und Zwei-Punkte-Abstand.
- Satzsieg-Transition wird außerhalb von `app.js` berechnet.
- Rotation, Eventpersistenz, Rallyabschluss und Satzwechsel bleiben im App-Orchestrator.

## Kompatibilität
- Daten-Schema 5 unverändert.
- Keine Datenmigration.
- Keine Änderung an CSV-/Eventfeldern.
- Keine beabsichtigte UI-/Funktionsänderung.

## Automatisierte Prüfungen
- bestehende Regressionstests
- Preview5 Scoring-Domain-Test
- Preview5 Integrations-/Offline-Core-Test
- JavaScript-Syntax aller aktiven Module
- JSON-Manifeste
- ZIP-Integrität
