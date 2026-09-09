# VolleyTakt Live 0.4.1

VolleyTakt Live ist die browserbasierte, offline-first Scouting-Anwendung des VolleyTakt-Projekts.

## Funktionen

- Live-Scouting mit WER → WAS → WIE → WO → WOHIN
- freie Auswahlreihenfolge für WER/WAS/WIE bei unveränderter gespeicherter Semantik
- 5:1-orientierte Rotations-/Aufstellungsunterstützung, Satzwechsel und Seitenlogik
- Spielbibliothek mit lokalem Speicher und optionaler Cloud-Synchronisation
- Nextcloud/WebDAV-Synchronisation mit Konflikterkennung und bewusster Cloud-/Lokal-Entscheidung
- Videozuordnung und nachträgliche Timestamp-Bearbeitung
- modulare BLE-Kameraanbindung für unterstützte DJI-Osmo-Action- und GoPro-HERO-Modelle
- integrierte Analyse für K1/K2/K3, Sideout, First Ball, Aufschlag, Annahme, Zuspiel, Angriff, Block/Abwehr, Rotationen, Spielerinnen, Gegner, Zielzonen und Aktionsketten
- A/B-Vergleiche und datenbasierte Hinweise
- Spielerinnenreport sowie Trainer-Kurz- und Trainer-Detailreport
- PDF/Druck, Text- und PNG-Ausgabe; mobile Teilen-Funktion nur bei passender Plattformunterstützung
- responsive Browser-/PWA-Oberfläche mit mobilem Landscape-Fokus
- deutsche und englische Oberfläche
- Offline-Nutzung über Service Worker/PWA

## Version

**VolleyTakt Live 0.4.1**

- Release-Kanal: `stable`
- Datenschema: `6`
- Lizenz: PolyForm Perimeter License 1.0.1
- Copyright: © 2026 Ingo Zech

VolleyTakt ist **quelloffen / source available**, aber nicht als OSI-Open-Source-Projekt lizenziert.

## Installation auf einem Webspace

Für die Installation ist das separate Web-Space-ZIP vorgesehen. Dessen Inhalt direkt in das Zielverzeichnis des Webservers entpacken. Für Nextcloud/WebDAV muss PHP für `sync/nextcloud.php` verfügbar sein.

Nach einem Update empfiehlt sich ein vollständiges Neuladen der WebApp; als PWA kann je nach Browser zusätzlich ein Service-Worker-Refresh erforderlich sein.

## Entwicklung und Tests

Das GitHub-Paket enthält zusätzlich die Test- und Release-Dateien.

```bash
./tests/run_checks.sh
```

Die Prüfkette deckt unter anderem ab:

- JavaScript-/JSON-/PHP-Grundprüfungen
- i18n-Coverage
- WER/WAS/WIE-Permutationen
- Timestamp-Editor
- Cloud-Konfliktlogik
- Datenschema-Migration 5 → 6
- Analyse-/Report-Regressionen
- WebDAV-Relay-Sicherheitsprüfungen
- Service-Worker-Dateien und statische Imports
- finale Versionskonsistenz

## Tickets

- `TODO.md` – offene Tickets
- `tickets.json` – maschinenlesbare Gesamtübersicht
- `CLOSED_TICKETS.md` – abgeschlossene Tickets

## Rechtlicher Hinweis

© 2026 Ingo Zech. Nutzung gemäß PolyForm Perimeter License 1.0.1.

VolleyTakt wurde teilweise mit Unterstützung von KI-Werkzeugen entwickelt.
