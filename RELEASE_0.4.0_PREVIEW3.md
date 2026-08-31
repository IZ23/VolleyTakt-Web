# VolleyTakt Live 0.4.0 Preview3

## Zweck
Dritte Stufe der Modularisierung. Nach dem Capture-Modul aus Preview2 werden Rally-Lebenszyklus, K1/K2/K3-Übergangskontext und die fachliche Entscheidung über automatische Punktaktionen aus dem zentralen App-Modul herausgelöst.

## Neu in der Architektur
- neues `js/scouting/rally.js`
- DOM-freier Rally-Controller
- Erzeugung und Sequenzierung von `rally_id`, `rally_no`, `rally_sequence` und `rally_event` im Rally-Modul
- K1/K2/K3- und Transition-Kontext im Rally-Modul
- automatische Gewinnerentscheidung für `=` sowie `#` bei Aufschlag/Angriff/Block als reine Fachfunktion
- `app.js` behält nur dünne Adapter und die asynchrone Orchestrierung von Eventpersistenz und Punktverarbeitung

## Bewusst noch nicht modularisiert
- Eventbau / `appendEvent`, `logOwn`, `logOpponent`
- eigentliche Score-Mutation und `award()`
- Sideout / Rotation / Satzlogik
- Undo / Reconstruction
- Touch-/Tastatur-Commandrouting
- Analyse und Analyse-UI
- Kamera-Service

## Kompatibilität
- Daten-Schema bleibt 5.
- Keine Migration erforderlich.
- Bestehende lokale Daten aus 0.3.2 sowie 0.4.0 Preview1/Preview2 bleiben erhalten.
- Keine beabsichtigte sichtbare UI- oder Funktionsänderung gegenüber Preview2.

## Bekannte, separat dokumentierte Punkte
Die während der Modularisierung gemeldeten UI-/Scoutingfehler werden im Fehlerprotokoll geführt und sind nicht Bestandteil dieser reinen Architektur-Preview. Insbesondere bleiben die zuletzt dokumentierten Punkte zum automatischen Aufschlagablauf, zur Statusmeldung der Feldausrichtung und zum Spielbibliothek-Löschen separat offen.

## Teststatus
Alle 24 mitgelieferten automatischen Regressionstests laufen erfolgreich.
