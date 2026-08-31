# Funktionstest – VolleyTakt Live 0.4.0 Preview3

Basis: vollständiges ZIP von 0.4.0 Preview2. Ziel dieser Preview ist ausschließlich die dritte Stufe der Modularisierung.

## Architektur
- [x] `js/scouting/scouting.js` bleibt DOM-freie WER→WAS→WIE→WO→WOHIN-Capture-Engine.
- [x] `js/scouting/rally.js` ist DOM-freier Rally-/Transition-Controller.
- [x] Rally-ID, Rally-Nr. und Rally-Sequenz werden im Rally-Modul geführt.
- [x] K1/K2/K3 und `transition_no` werden im Rally-Modul ermittelt.
- [x] Automatische Gewinnerentscheidung (`=` bzw. `#` bei terminalen Techniken) ist eine reine Funktion im Rally-Modul.
- [x] Rally-Modul enthält keinen DOM-, Render-, Storage-, Sync-, CSV- oder Kamera-Zugriff.
- [x] Eventpersistenz, Score-Mutation, Rotation, Sideout und Satzlogik bleiben im App-Orchestrator.

## Fachliche Regression
- [x] Start bei gegnerischem Aufschlag erzeugt K1.
- [x] Start bei eigenem Aufschlag erzeugt K2.
- [x] Wechsel Gegner→Wir innerhalb einer laufenden Rally erhöht Transition und führt ab der zweiten Transition zu K3.
- [x] `=` gibt der Gegenseite den automatischen Punkt.
- [x] `#` beendet Aufschlag, Angriff und Block zugunsten der handelnden Seite.
- [x] `#` bei Annahme, Abwehr und Zuspiel beendet die Rally nicht automatisch.
- [x] `closeActiveRally()` setzt ausschließlich den Rally-Laufzustand zurück.

## Unverändert
- [x] Datenschema 5.
- [x] Event-/CSV-Struktur.
- [x] Score-/Sideout-/Rotationslogik.
- [x] Satzlogik.
- [x] Undo/Reconstruction.
- [x] Analyse.
- [x] Kamera.
- [x] Storage und Sync.
- [x] UI und responsive CSS.

## Manueller Browser-Fokus
Wie Preview2, zusätzlich besonders Rallyübergänge über mehrere Aktionen und ein Rallyende nach manueller sowie automatischer Punktvergabe prüfen.

## Automatische Tests
- [x] 24 mitgelieferte `.mjs`-Tests erfolgreich.
- [x] JavaScript-Syntax der aktiven Kernmodule geprüft.
- [x] Manifest- und Update-JSON gültig.
- [x] Preview3 Rally-Engine- und Integrationsregression erfolgreich.
