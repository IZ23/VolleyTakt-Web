# VolleyTakt Live 0.4.0 Preview6

Preview6 setzt die schrittweise Modularisierung auf Basis von Preview5 fort.

## Modularisierung
- neues DOM-freies Modul `js/scouting/match-flow.js`
- Rotation von Aufstellungen und Rotationsindex als reine Transition
- Übernahme von Satzaufstellung und Libero-Zustand als reine Transition
- Übergang zum Folgesatz und Match-Endzustand aus `app.js` herausgelöst
- Quick-Scout-Satzvorbereitung nutzt denselben Zustandsübergang

Eventpersistenz, Dialogführung, Livezeit, Rendering, Undo/Reconstruction und UI-Routing verbleiben bewusst im App-Orchestrator. Es sind keine sichtbaren Funktionsänderungen beabsichtigt.
