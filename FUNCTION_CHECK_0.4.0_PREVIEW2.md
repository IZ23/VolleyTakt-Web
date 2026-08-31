# Funktionstest – VolleyTakt Live 0.4.0 Preview2

Basis: 0.4.0 Preview1. Ziel dieser Preview ist ausschließlich die zweite Stufe der Modularisierung.

## Architektur
- [x] `js/scouting/scouting.js` ist das gemeinsame DOM-freie Capture-Modul.
- [x] WER → WAS → WIE → Details → WO → WOHIN wird im Scouting-Modul geführt.
- [x] Das Modul erzeugt einen internen `ActionDraft`.
- [x] Rally-Erzeugung, Eventbau, automatische Punkte, Rotation und Persistenz bleiben außerhalb.
- [x] `app.js` enthält nur noch dünne UI-/Legacy-Adapter für die ausgelagerten Capture-Schritte.
- [x] Scouting-Modul enthält keinen DOM-, Render-, Storage-, Sync- oder Scoring-Zugriff.

## Fachliche Regression
- [x] WER nur P1–P6; P7–P9 als WER abgewiesen.
- [x] Detailliertes WO erlaubt P1–P9.
- [x] Kompaktes WO erlaubt nur P1–P6.
- [x] WOHIN verwendet die fachlich richtige Feldseite.
- [x] Gegnerischer Angriff verlangt weiterhin eine Zielzone.
- [x] Direkter Gegneraufschlag ohne WER bleibt möglich.
- [x] Aufschlag `=` erzeugt einen vollständigen ActionDraft ohne Aktionszone; die Punktlogik bleibt außerhalb.
- [x] Eigener Aufschlag setzt weiterhin WER=P1 und WAS=Aufschlag voraus.
- [x] Detailliertes Zuspiel führt über Tempo und Passweite/-richtung zu WO und WOHIN.
- [x] Startzeit und eingefrorenes Qualitätsprofil werden in den ActionDraft übernommen.

## Unverändert
- [x] Datenschema 5.
- [x] Event-/CSV-Struktur.
- [x] Rally-ID und K1/K2/K3-Verarbeitung.
- [x] automatische Punkt-/Sideout-/Rotationslogik.
- [x] Undo/Reconstruction.
- [x] Analyse.
- [x] Kamera.
- [x] Storage und Sync.
- [x] UI und responsive CSS.
- [x] Touch-/Tastatur-Routing (Vereinheitlichung folgt in einer späteren Preview).

## Automatische Tests
22 mitgelieferte `.mjs`-Tests erfolgreich, darunter:
- alle bestehenden 0.3.2-Regressionstests,
- Preview1 State/Persistence,
- `preview040p2-scouting-engine-test.mjs`,
- `preview040p2-integration-test.mjs`.

## Manueller Browser-Fokus
Zusätzlich im Browser prüfen:
1. eigenes detailliertes Scouting: P4 → Angriff → + → WO P8 → WOHIN Gegner P1,
2. kompaktes Scouting: keine P7–P9-Zonen,
3. gegnerischer Aufschlag direkt ohne WER, insbesondere `=`,
4. eigener Aufschlag-Preset P1/Aufschlag,
5. detailliertes Zuspiel mit Tempo + Distanz,
6. Wechsel/Libero als Regression, da `selectPosition()` weiterhin zuerst den Wechselmodus priorisiert,
7. Undo nach einer vollständigen Rally,
8. gleiche Bedienung per Touch und Tastatur wie Preview1.
