# VolleyTakt Live 0.4.2 – Releasebeschreibung

## Überblick

VolleyTakt Live 0.4.2 führt den 0.4.2-RC-Zweig zu einem stabilen Release zusammen. Schwerpunkte sind die erweiterte Analyse mit aktionsbezogenem Videozugriff, persönliche Spielerinnenreports, eine aufgabenorientierte Navigation, ein konsolidiertes modulares Deutsch/Englisch-Sprachsystem sowie die optionale Anbindung des VolleyVideo-Workers für physischen Videoschnitt.

## Wichtigste Änderungen

### Analyse & Reports
- Aktionslisten über den gewählten Analysezeitraum mit Gruppierung nach Aktionswirkung und direktem Video-Drilldown.
- Virtuelle Aktionsplaylists und JSON/CSV-Schnittlistenexport.
- Persönlicher Spielerinnenreport zusätzlich zum Team-Spielerinnenreport sowie Trainer-Kurz- und Trainer-Detailreport.
- Reportsprache Deutsch/English unabhängig von der UI-Sprache auswählbar.
- Lesbare Analyseansichten statt interner Bezeichner wie `priorityA`/`priorityB`.

### Video & optionaler VolleyVideo-Worker
- Wiedergabequelle und Verarbeitungsquelle eines Spielvideos sind getrennt modelliert.
- YouTube bleibt als Wiedergabequelle vollständig nutzbar.
- Optionaler privater VolleyVideo-Worker über API v1; ohne Worker bleiben Analyse, Filter, Playlist und Schnittlistenexport vollständig nutzbar.
- Serverneutrales `VideoCutManifest` 1.1 mit `selectionContext`, globalem Vor-/Nachlauf und sicherem Dateinamen.
- Worker-Capabilities, Jobstatus, Fortschritt und MP4-Ergebnisdownload.
- Worker-Adresse und API-Token bleiben lokale Gerätekonfiguration und werden nicht in Matchdaten, Cloud-Sync oder Schnittlisten übernommen.

### Bedienung & Navigation
- Aufgabenorientierte Hauptnavigation: Spiel, Vorbereitung, Analyse, Daten, Hilfe, Einstellungen.
- Einheitliche Zurück-Navigation für Unteransichten.
- Schnellstart/Ersteinführung setzt Spontan-Scouting bewusst an die erste Stelle.
- Einstellungsseite als responsives 2×X-Kachelraster; auf schmalen Ansichten automatisch einspaltig.

### Mehrsprachigkeit
- Modulares Sprachsystem mit zentralen semantischen Schlüsseln für Deutsch und Englisch.
- Volleyball-Fachbegriffe werden in der Oberfläche fachlich lokalisiert, während stabile interne Datenwerte rückwärtskompatibel bleiben.
- UI- und Reportsprache sind voneinander unabhängig.
- Automatische Tests prüfen Schlüsselparität, Reporttexte und Übersetzungsregressionen.

### Scouting, Daten & Synchronisation
- Aktionsqualität/-wirkung und Rally-Ergebnis im Eventmodell expliziter getrennt, bestehende Felder bleiben kompatibel.
- K3/Transition im Live-Scouting aus Gegner-Angriff → eigener Block/Abwehr expliziter erfasst.
- WebDAV-423-Locks robuster behandelt.
- Gelöschte synchronisierte Spiele werden inklusive zugehörigem Sessionordner bereinigt, ohne externe Videos zu löschen.
- Migrationsbackup blockiert den App-Start bei knapper Browser-Quota nicht mehr unkontrolliert.

## Daten und Kompatibilität

- Datenschema: **6**
- keine neue Schema-Migration gegenüber 0.4.1 erforderlich
- bestehende `storageType`/`reference`-Videozuordnungen bleiben kompatibel
- bestehende Match-, Scouting- und Cloud-Daten werden nicht in neue Sprachwerte umgeschrieben

## Verifikation

Die vollständige im Repository enthaltene Testkette wird mit `bash tests/run_checks.sh` ausgeführt. Sie umfasst unter anderem Scouting, Analyse, Reports, i18n, Cloud/WebDAV, Migration, Video/Worker, Navigation sowie statische Syntax- und Shadowing-Prüfungen. Reale Geräte-/Browserprüfungen werden nur dort als verifiziert betrachtet, wo sie tatsächlich durchgeführt wurden; offene Verifikations- und Roadmap-Punkte bleiben in `TODO.md` und `tickets.json` dokumentiert.

## Lizenz

PolyForm Perimeter License 1.0.1  
© 2026 Ingo Zech. Nutzung gemäß PolyForm Perimeter License 1.0.1.

VolleyTakt wurde teilweise mit Unterstützung von KI-Werkzeugen entwickelt.
