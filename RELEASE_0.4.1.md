# VolleyTakt Live 0.4.1 – Releasebeschreibung

## Überblick

0.4.1 bündelt den gesamten RC6-Entwicklungsstand zu einem stabilen Release. Der Schwerpunkt liegt auf einer belastbaren Live-Scouting-Bedienung, tieferer volleyballspezifischer Analyse, verlässlicher lokaler/Cloud-Datenhaltung sowie druck- und teilbaren Reports.

## Wichtigste Änderungen

### Scouting
- WER/WAS/WIE können in beliebiger Reihenfolge gewählt werden.
- WOHIN-Zielzonen verwenden die festgelegte spiegelbildliche Feldgeometrie.
- Satz-/Seitenlogik wurde stabilisiert.
- Aktionsabbruch, Undo-/Rally-Fluss und Qualitätsdarstellung wurden gehärtet.

### Spielbibliothek und Synchronisation
- Das aktuelle Spiel wird im Menü „Spiel“ vor der Bibliothek angezeigt.
- Spielmetadaten einschließlich Matchdatum können gezielt bearbeitet werden.
- Neuere Cloud-Versionen werden erkannt.
- Nutzer können bewusst „Cloud übernehmen“ oder „Lokal behalten“ wählen.
- WebDAV-Relay enthält Rate-Limit- und Diagnose-Schutzmechanismen ohne Logging von Zugangsdaten.

### Video und Timestamps
- Manuell zugeordnetes Video nutzt den lokalen Scouting-Timer.
- Timestamp-Editor unterstützt Bearbeitung, Einfügen, Sortierung und größere Datenmengen.
- WER/WOHIN und Rally-Ergebnis werden im Nachbearbeitungsdialog semantisch konsistent behandelt.

### Analyse
- K1/Sideout, K2/Break und K3/Transition
- First-Ball-Sideout
- Rotationen
- Annahme, Zuspiel, Angriff, Aufschlag, Block/Abwehr
- Spielerinnen- und Gegnerkontext
- Aktionsketten und Zielzonen
- A/B-Vergleiche und Confidence-/Datenbasis-Hinweise
- datenbasierte Interpretationen ohne unzulässige Kausalitätsaussagen

### Reports
- Spielerinnenreport: kompakte, erklärende Ein-Seiten-Ausgabe
- Trainer-Kurzreport: auf eine A4-Seite optimiert
- Trainer-Detailreport: auf zwei A4-Seiten strukturiert
- deutsches Zahlenformat, einheitliche Kachelästhetik und stabilisierte Druckumbrüche
- PDF/Druck, Text kopieren und PNG speichern
- „Teilen“ nur auf mobilen/touch-basierten Plattformen mit nativer Web-Share-Unterstützung sichtbar

### PWA / Mobile
- Querformat-orientierte PWA
- mobile Landscape-Härtungen
- Vollbild-/Protokollzugang
- Orientation-Fallbacks und Overlays

## Daten und Kompatibilität

- Datenschema: **6**
- bestehende ältere Daten werden über die vorhandene Migration 5 → 6 behandelt
- vor Migration wird ein Backupmechanismus verwendet
- lokale Daten bleiben bei normalen Updates erhalten

## Ticketstatus

Mit 0.4.1 wurden die im RC6-Zyklus sicher umgesetzten Punkte geschlossen. Offene Roadmap-Punkte sind in `TODO.md` und `tickets.json` dokumentiert.

## Lizenz

PolyForm Perimeter License 1.0.1  
© 2026 Ingo Zech
