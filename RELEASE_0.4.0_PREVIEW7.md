# VolleyTakt Live 0.4.0 Preview7

Architektur-Preview zur weiteren Modularisierung.

## Änderung
- neues DOM-freies Modul `js/scouting/history.js`
- Zustandsrekonstruktion aus dem Eventstrom aus `app.js` ausgelagert
- Undo-Gruppierung aus `app.js` ausgelagert
- Persistenz, CSV-I/O, Rendering und Session-Reload bleiben im App-Orchestrator

Keine beabsichtigte Änderung des sichtbaren Scouting-Verhaltens.
