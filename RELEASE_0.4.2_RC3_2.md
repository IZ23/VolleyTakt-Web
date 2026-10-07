# VolleyTakt Live 0.4.2 RC3_2

Release-Kanal: preview  
Datenschema: 6

## Schwerpunkt

RC3_2 ist ein gezielter Stabilitätsstand vor 0.4.2 final. Er behebt `UI-I18N2`: lokale Variablen mit den Namen `t` bzw. `tr` konnten die importierten i18n-Helfer überschreiben. Sichtbar wurde dies insbesondere durch eine leere Teamansicht trotz erfolgreich synchronisierter Teams.

## Änderungen gegenüber RC3_1

- `drawTeams()` und `editTeam()` verwenden eindeutige Teamvariablen (`teamRow`, `teamRecord`).
- Rotations-/Aufstellungsübergänge verwenden sprechende Variablennamen statt `t`.
- Protokollzeilen verwenden `rowEl` statt `tr`.
- Analyse-Callbacks verwenden sprechende Aktionsnamen statt `t`.
- Filter-Callbacks für Teams verwenden `teamRow`.
- Neuer Import-Shadowing-Audit sucht in allen JavaScript-Modulen nach lokalen Bindings, die importierte Namen erneut verwenden.
- JavaScript-Syntaxprüfung bleibt Bestandteil der vollständigen Regressionstestkette.
- Datenschema bleibt 6; bestehende lokale und Cloud-Daten werden nicht migriert oder verändert.

## Verifikation

Automatisiert geprüft werden insbesondere Team-Rendering-Pfade, Import-/Variablen-Shadowing, i18n-Kataloge, Reports, Scouting, Analyse, Synchronisation, Migration, Navigation und Video-Worker-Integration. Eine reale Browser-/Geräteprüfung wird dadurch nicht behauptet.

## Release-Metadaten

- Version: `0.4.2 RC3_2`
- Version-ID: `0.4.2-rc3_2`
- Lizenz: PolyForm Perimeter License 1.0.1
- Copyright: © 2026 Ingo Zech
