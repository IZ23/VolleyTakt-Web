# Funktionscheck 0.4.0 final

## Final-Gates

- Versionskennung in App, HTML, Manifest, Update-Manifest und Service Worker auf `0.4.0` vereinheitlicht
- Update-Kanal auf `stable` gesetzt
- Datenschema unverändert 5
- FE-SCOUT10-Regression: terminale `#`-Bewertung im Spontanscouting ohne vorher gesetztes Aufschlagrecht bleibt wirksam
- Copyright und PolyForm-Perimeter-Hinweis in Einstellungen → About und Hilfe → About & Lizenzen vorhanden
- In-App-Hilfe deckt Spielvorbereitung, Scouting, Rally/Punkte, Sätze, Wechsel/Libero, Bewertung, Tastatur, Kamera, Synchronisation, Datenverwaltung, Analyse und Einstellungen ab
- Analyse-Hilfe deckt Spiel-/Satzübersicht, Rotation, K1/Sideout, First-Ball-Sideout, K2/Breakpoint, Aufschlag, Annahme, Zuspiel, Angriff, Spielerinnenwirkung, Kontextketten, Gegner-Tendenzen, Technik/Qualität, Rallys, A/B-Vergleich, gespeicherte Ergebnisse und Druck/PDF ab
- Auslieferungspaket enthält keine Preview-/RC-Releasehistorie und keine Testdateien

## Finalisierung gegenüber RC10

Keine fachliche Änderung an Scouting- oder Persistenzlogik. Finalisiert wurden Versionierung, Stable-Kanal, Release-/Funktionsdokumentation und Paketbereinigung.

## Automatisierte Final-Prüfung

- JavaScript-Syntax aller Runtime-Module und des Service Workers: erfolgreich
- Manifest und Update-Manifest: valides JSON
- FE-SCOUT10 / terminale Punktlogik: erfolgreich
- PWA-/Service-Worker-Assetprüfung: erfolgreich
- Analyse-Regression und Analysefilter: erfolgreich
- RC7 UI-/Analyse-Regression: erfolgreich
- RC8 Timer-/Spielbibliothek-Regression: erfolgreich
- alle im Service Worker referenzierten lokalen Assets vorhanden
