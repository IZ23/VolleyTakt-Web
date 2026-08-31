# VolleyTakt Live 0.4.0 Preview4

## Zweck
Vierte Stufe der Modularisierung. Nach Capture-Engine und Rally-Controller wird der Aufbau persistierbarer Scouting-Events aus `app.js` herausgelöst.

## Neu in der Architektur
- neues `js/scouting/events.js`
- DOM-freier Event-Builder für Zeitfelder, Match-/Score-Snapshot und allgemeine Eventfelder
- zentrale Normalisierung aktionsspezifischer Felder für eigene und gegnerische Spieleraktionen
- `appendEvent()` bleibt als dünner Adapter für Kamera-Snapshot, CSV-Persistenz, State-Persistenz und Protokoll-Rendern
- `logOwn()` und `logOpponent()` orchestrieren nur noch Spielerauflösung, Rally-Kontext und den Event-Builder

## Bewusst noch nicht modularisiert
- eigentliche Score-Mutation und `award()`
- Sideout / Rotation / Satzlogik
- Undo / Reconstruction
- Touch-/Tastatur-Commandrouting
- Analyse und Analyse-UI
- Kamera-Service

## Kompatibilität
- Daten-Schema bleibt 5.
- Keine Migration erforderlich.
- Event-/CSV-Struktur bleibt unverändert.
- Keine beabsichtigte sichtbare UI- oder Funktionsänderung gegenüber Preview3.

## Bekannte, separat dokumentierte Punkte
Die während der Modularisierung protokollierten Fehler und ToDos bleiben separat offen und sind nicht Bestandteil dieser Architektur-Preview.
