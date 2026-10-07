# VolleyTakt Live 0.4.2 RC3

Release-Kanal: preview  
Datenschema: 6

## Änderungen gegenüber RC2

- `REPORT-I18N1`: Reportsprache kann im Dialog „Report erzeugen“ unabhängig von der UI-Sprache auf Deutsch oder English gesetzt werden; die Auswahl gilt für Team-, persönlichen Spielerinnen- und Trainerreports einschließlich PDF/Druck, Text und PNG.
- `UI-I18N1`: Deutsch/Englisch-Umschaltung vervollständigt. Neue RC2/RC3-Texte in Einstellungen, Navigation, Analyse, Reports und VolleyVideo-Worker sind lokalisiert; englische Volleyballbegriffe wurden fachlich vereinheitlicht.
- `UI-ANALYSIS-LABEL1`: lesbare Analysebezeichnungen im Dashboard statt interner Schlüssel wie `priorityA`/`priorityB`.
- `UI-I18N1` Nachkorrektur: Reportauswahl und alle vier Reportvarianten werden einschließlich dynamischer Texte und Exportausgaben in der gewählten Sprache erzeugt.
- `UI-SETTINGS2`: konsequentes responsives 2×X-Kachelraster; alle Einstellungsbereiche als klar gerahmte Kacheln und Navigationskacheln ohne Pfeilsymbole.
- Alle Einstellungsbereiche sind gleich breit als Kacheln ausgeführt; Kacheln derselben Rasterzeile werden gleich hoch dargestellt.
- Sprache und Scouting bleiben Formular-Kacheln; Cloud & Synchronisation, Videoschnitt, Bedienung und About sind Navigationskacheln.
- App-Update ist eine gleichwertige Aktionskachel; Plattform & Funktionen eine Informationskachel.
- Unter 860 px fällt das Raster automatisch auf eine Spalte zurück.
- Keine Änderung am Datenschema (weiterhin Schema 6).

## Release-Metadaten

- Version: `0.4.2 RC3`
- Version-ID: `0.4.2-rc3`
- Lizenz: PolyForm Perimeter License 1.0.1

## Prüfung

Automatisierte Regressionstests werden für RC3 ausgeführt. Reale Browser-/Geräteprüfungen werden nur als verifiziert markiert, wenn sie tatsächlich durchgeführt wurden.
