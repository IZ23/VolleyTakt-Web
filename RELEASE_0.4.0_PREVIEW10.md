# VolleyTakt Live 0.4.0 Preview10

Architektur-Preview: Kamera-/Kamera-Service-Trennung und Abschluss der Kern-Modularisierung von 0.4.0.

- neues DOM-freies Service-Modul `js/camera/service.js`
- Auswahl und Lebenszyklus der DJI-/GoPro-Adapter aus dem App-Orchestrator ausgelagert
- Verbindungs-Telemetrie, Batterie-/Statusdaten und Qualitätsbewertung im Kamera-Service gebündelt
- Start/Stop der Kameraaufnahme über den Service gekapselt
- Kamera-UI, Benutzerfeedback und Livezeit-Verknüpfung bleiben im App-Adapter
- keine beabsichtigten fachlichen Änderungen an Scouting, Analyse oder Kamerabedienung
- Kern-Modularisierung 0.4.0 nach State, Persistence, Scouting, Rally, Events, Scoring, Match-Flow, History, Input-Routing, Analyse und Kamera abgeschlossen
