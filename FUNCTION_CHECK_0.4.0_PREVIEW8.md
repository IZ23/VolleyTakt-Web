# VolleyTakt Live 0.4.0 Preview8 – Funktionsgegencheck

## Modularisierung
- Tastatur-Routing ist aus dem App-Orchestrator in `js/app/input-routing.js` ausgelagert.
- Shortcut-Normalisierung, Shortcut→Aktion und Aktion→Command sind DOM-frei testbar.
- Edge-Swipe-Erkennung für das Öffnen des Menüs ist als eigenständiger Router ausgelagert.
- Der App-Orchestrator führt die Commands weiterhin gegen die bestehenden Fachfunktionen aus.
- UI-Verhalten, Shortcuts und Swipe-Schwellwerte bleiben unverändert.

## Bewusst noch im App-Orchestrator
- konkrete DOM-Verkabelung der sichtbaren Buttons
- Dialog-/Drawer-Lebenszyklus
- Rendering und Statusmeldungen

## Version / PWA
- aktive Version: `0.4.0 Preview8`
- Service-Worker-ID: `0.4.0-preview8`
- `js/app/input-routing.js` ist Offline-Core-Asset.

## Prüfung
- vorhandene Regressionstests plus Preview8-Routing-/Integrationstest
- JavaScript-Syntax
- JSON-Manifeste
- ZIP-Integrität
