# VolleyTakt Live 0.4.0 Preview2

## Zweck
Zweite Stufe der Modularisierung. Die fachliche Scouting-Erfassung WER → WAS → WIE → WO → WOHIN wurde aus dem zentralen App-Modul herausgelöst.

## Neu in der Architektur
- neues `js/scouting/scouting.js`
- DOM-freie Capture-Engine
- interner `ActionDraft` als Grenze zur bestehenden Rally-/Event-/Scoring-Verarbeitung
- zentrale Zonenvalidierung für kompakte und detaillierte Erfassung
- Aufschlagtechnik und Zuspieldetails im gemeinsamen Capture-Modul
- direkter Gegneraufschlag und eigener Aufschlag-Preset im selben Modul

## Bewusst noch nicht modularisiert
- Rally-ID / K1-K2-K3
- Eventbau `logOwn` / `logOpponent`
- automatische Punktlogik
- Sideout / Rotation / Satzlogik
- Undo / Reconstruction
- Touch-/Tastatur-Commandrouting
- Analyse und Analyse-UI
- Kamera-Service

## Kompatibilität
- Daten-Schema bleibt 5.
- Keine Migration erforderlich.
- Bestehende lokale Daten aus 0.3.2 und 0.4.0 Preview1 bleiben erhalten.
- Keine beabsichtigte sichtbare UI- oder Funktionsänderung.

## Teststatus
Alle 22 mitgelieferten automatischen Regressionstests laufen erfolgreich.
