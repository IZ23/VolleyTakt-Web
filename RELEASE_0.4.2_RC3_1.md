# VolleyTakt Live 0.4.2 RC3_1

Release-Kanal: preview  
Datenschema: 6

## Schwerpunkt

RC3_1 konsolidiert die Mehrsprachigkeit vor der geplanten 0.4.2 final. Sichtbare Texte werden in modularen Sprachdomänen gepflegt und über semantische Schlüssel ausgegeben, statt neue deutsche/englische Textliterale direkt in View-Code einzubauen.

## Änderungen gegenüber RC3

- `UI-I18N2`: zentrale modulare Sprachdomänen für UI, Shell, Match, Analyse, Reports, Stammdatenformulare, Kamera, Synchronisation und Volleyball-Fachbegriffe.
- DE/EN-Kataloge werden automatisch auf identische Schlüssel geprüft.
- Setup-/Stammdatenformulare, Kamera-/Browserhinweise und Cloud-/Sync-Konfiguration wurden weiter von hart codierten sichtbaren Texten bereinigt.
- Techniknamen und detaillierte Qualitätsbeschreibungen werden über zentrale Volleyball-Sprachschlüssel dargestellt.
- Stabile interne Scoutingwerte bleiben unverändert, damit bestehende Matchdaten, CSV-Dateien, Cloudstände und Analysecode kompatibel bleiben.
- Report-Sprache bleibt unabhängig von der UI-Sprache wählbar (`REPORT-I18N1`).
- Service Worker nimmt alle modularen Locale-Dateien in den Offline-Kerncache auf.
- Keine Änderung am Datenschema.

## Release-Metadaten

- Version: `0.4.2 RC3_1`
- Version-ID: `0.4.2-rc3_1`
- Lizenz: PolyForm Perimeter License 1.0.1
- Copyright: © 2026 Ingo Zech

## Prüfung

Die GitHub-Prüfkette enthält Syntax-/JSON-/PHP-Checks, die bisherigen Scouting-/Analyse-/Sync-/Report-Regressionen sowie zusätzliche modulare i18n-Prüfungen. Reale Browser-/Geräteprüfungen werden nicht durch automatisierte Tests ersetzt.

## REPORT-I18N1a

- `REPORT-I18N1a`: dynamische Texte des persönlichen Spielerinnenreports sind vollständig an die separat gewählte Reportsprache gebunden; gemischte deutsch/englische Reportinhalte werden durch einen eigenen Regressionstest verhindert.
