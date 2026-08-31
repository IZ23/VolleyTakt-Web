# VolleyTakt Live 0.4.0 Preview5

## Zweck
Fünfte Stufe der Modularisierung. Nach Capture-, Rally- und Event-Modul wird die reine Punkt-/Satzstand-Transition aus dem zentralen App-Modul herausgelöst.

## Neu in der Architektur
- neues `js/scouting/scoring.js`
- DOM-freie Punkttransition mit neuem Punktestand, Aufschlagseite und Sideout-Erkennung
- reine Satzgewinnerprüfung für Zielpunktzahl plus Zwei-Punkte-Abstand
- reine Transition der Satzsiege
- `award()` bleibt Orchestrator für Eventpersistenz, Rotation, Rallyabschluss, Rendern und Satzende
- `finishSet()` behält Zeit-/UI-/Aufstellungsübergänge, delegiert aber die Satzsieg-Mutation

## Bewusst noch nicht modularisiert
- Rotation und Aufstellungsrotation
- vollständige Satz-/Match-Orchestrierung
- Undo / Reconstruction
- Touch-/Tastatur-Commandrouting
- Analyse und Analyse-UI
- Kamera-Service

## Kompatibilität
- Daten-Schema bleibt 5.
- Keine Migration erforderlich.
- Event-/CSV-Struktur bleibt unverändert.
- Keine beabsichtigte sichtbare UI- oder Funktionsänderung gegenüber Preview4.

## Bekannte, separat dokumentierte Punkte
Die während der Modularisierung protokollierten Fehler und ToDos bleiben separat offen und sind nicht Bestandteil dieser Architektur-Preview.
