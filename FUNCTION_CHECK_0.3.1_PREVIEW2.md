# Funktionsgegencheck – VolleyTakt Live 0.3.1 Preview 2

## Neue Analyseebene

- Spiel-/Satzübersicht mit Rallyquote, K1 Sideout, K2 Breakpoint und First-Ball-Sideout.
- Rotations-Dashboard R1–R6 mit K1/K2, First Ball, Annahme und Angriff.
- K1/Sideout nach Annahmequalität.
- Aufschlaganalyse nach Spielerin, Technik und Zielzone inklusive Fehler, Ass, Breakpoint und gegnerischer Annahme.
- Annahmeanalyse mit positiver/perfekter Annahme, Fehler, anschließendem Sideout und First Ball.
- Zuspielverteilung nach Aktionszone, Zielzone, Tempo und Distanz mit Folgeangriff.
- Angriff Quelle → Ziel nach Spielerin inklusive Punktquote, Fehler, geblockt und Effizienz.
- Kontextketten Annahme → Zuspiel → Angriff → Rally-Ergebnis.
- Gegner-Tendenzen für Angriff, Aufschlagziel und Zuspielwege.
- Zeitraum-A/B-Vergleich bleibt erhalten.
- Einfaches und detailliertes Scouting verwenden weiterhin dasselbe Ereignismodell; fehlende Detailwerte bleiben leer.

## Regression

- Preview 2 Analyse: 14/14
- Preview 1 Kern: 17/17
- Preview 8 Rally-/Eingabemodell: 10/10
- Preview 9 erweiterte Erfassung: 11/11
- Preview 9 Feldorientierung: 7/7
- DJI-Protokoll: OK
- GoPro BLE: OK
- i18n: OK

Cachekennung: `0.3.1-p2c`.

## Korrektur p2b
- Zentrale Spielart-ID statt Namensliste im Spiel-Setup: OK
- Keine automatische Spielart-Anlage: OK
- Normalisierte Redundanzprüfung bei manueller Anlage: OK
- Deduplizierung nach Import und Sync: OK
- Referenzmigration für Spielkader/State/Archive: OK
- Getrennte reguläre/spontane Feldoptik: OK
- Gegner-Scouting aus -> eigener Erfassungskontext: OK
- Korrekturtest: 11/11

## Korrektur p2c – Startaufstellung / Libero
- vorhandene Startaufstellung wird beim erneuten Vorbereiten vorausgewählt
- Abbrechen verändert den bisherigen Spielzustand nicht
- Satzvorbereitung nutzt temporären Draft und committed erst nach Abschluss
- Libero 1/2 pro Satz auswählbar und gespeichert
- Libero kann nicht gleichzeitig in Start-I–VI stehen
- ältere Satzstart-Ereignisse ohne Libero-Felder bleiben lesbar
- Regressionstest: `tests/preview031p2-lineup-libero-test.mjs` (10/10)
