# VolleyTakt Live 0.4.0 Preview10 – Funktionsgegencheck

## Modularisierung
- Kameraadapter-Lebenszyklus liegt in `js/camera/service.js`.
- DJI/GoPro-Auswahl und Adaptererzeugung erfolgen außerhalb des App-Orchestrators.
- Verbindungsstatus, Reconnect-Zähler, Statusfehler, Batterie und Verbindungsqualität werden im Service geführt.
- Aufnahme Start/Stop wird über den Service delegiert.
- DOM-Rendering, Statusmeldungen und die Kopplung an den VolleyTakt-Livezeit-Zustand bleiben bewusst im App-Adapter.

## Architekturstand 0.4.0
Die wesentlichen fachlichen Verantwortlichkeiten sind nun getrennt:
- App-State / Selektoren / Persistenz
- Scouting-Capture
- Rally-Lifecycle
- Eventaufbau
- Scoring
- Rotation / Satz- und Match-Flow
- Undo / Zustandsrekonstruktion
- Touch-/Tastatur-Routing
- Analyse-Domain / Analyse-UI-Hilfen
- Kamera-Service / Hardwareadapter

## Verhalten
- Keine beabsichtigte Änderung der Bedienlogik.
- Bekannte Scouting-/Undo-/UI-ToDos bleiben unverändert offen und werden erst nach erfolgreicher Modularisierung bearbeitet.

## Automatisierte Prüfungen
- 38 Regressionstests
- JavaScript-Syntax aller aktiven Module
- JSON-Manifeste
- Offline-Core-Cache enthält Kamera-Service
- Versionskonsistenz 0.4.0 Preview10
- ZIP-Integrität
