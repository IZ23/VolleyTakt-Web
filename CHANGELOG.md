## 0.4.0 RC3

- Startansicht korrigiert: vor einem tatsächlich vorbereiteten Match/Satz wird nur eine Feldhälfte angezeigt.
- Detailliertes P1–P9-Feld nutzt auf allen Viewports drei gleich hohe Reihen; keine mobile Sondergeometrie.
- FE-TIME1: lokaler Timer zählt nach App-Schließen/Reload keine Abwesenheitszeit weiter; ein persistierter laufender Timer wird beim Laden pausiert.
- Vollständiger RC3-Build direkt aus 0.4.0 RC2.

## 0.4.0 RC2

- FE-UI10: Spontanscouting-Feldzellen im kompakten Touch-Landscape vereinfacht; Positionsnummer nur einmal, redundante Standard-Kürzel P1–P6 ausgeblendet und sekundäre Spielerinfos höhenabhängig reduziert. Positionsarrays und Desktopdarstellung bleiben unverändert.
- FE-SCOUT7: monotone Rally-Nummer über Undo/Neuzweig erneut validiert; persistierter High-Water-Zähler wird beim Laden robust normalisiert.
- Vollständiger RC2-Build direkt aus 0.4.0 RC1.

## 0.4.0 RC1

- Release-Kandidat auf Basis von 0.4.0 Preview19.
- Keine neuen Funktionen; Versions-, Cache- und Release-Kennungen auf RC1 eingefroren.
- Vorgesehen für abschließenden Praxis- und Regressionstest vor 0.4.0 final.

## 0.4.0 Preview15
- Schlüsselbasierte i18n-API eingeführt.
- Unsichere Substring-/Fragmentübersetzung entfernt; bekannte Kollisionsfälle explizit übersetzt.
- i18n-Regressionstests um reale Problemfälle erweitert.

## 0.4.0 Preview14
- Produktive Runtime auf kanonische JavaScript-Dateinamen konsolidiert.
- Historische r7r3f2-Dubletten entfernt; index.html, Service Worker und Module verwenden denselben Pfad.

## 0.4.0 Preview13
- Libero-Workflow als eigener Bedienmodus ohne WO/WOHIN.
- Doppel-Libero-Auswahl, Vorselektion des zuletzt verwendeten Liberos und Libero-zu-Libero-Tausch.
- Spontanscouting bietet Libero 1 und Libero 2.

## 0.4.0 Preview12
- Redo für vollständige Undo-Transaktionen; neuer Protokolleintrag verwirft Redo-Historie.
- DJI/GoPro-Adapter werden bei Bedarf dynamisch geladen.
- Kameraadapter blockieren die Service-Worker-Kerninstallation nicht mehr.
- Qualitätsbuttons, Legende und Detailbereiche als getrennte Layout-Blöcke stabilisiert.

## 0.4.0 Preview11
- Aufschlag =/# ohne verpflichtendes WO abgeschlossen.
- P7–P9 als WO-Dokumentationszonen für Annahme, Zuspiel und Angriff.
- WOHIN bei Zuspiel/Angriff auf eigener oder gegnerischer Feldseite; `target_side` gespeichert.
- Gemeinsame `transaction_id` für Scoutingaktion und automatische Folgeevents; Undo transaktionsweise.
- Feldorientierungsstatus und Sperrzustand im UI korrigiert.
# 0.4.0 Preview10

- Modularisierung Phase 9: Analyse-Datenlogik und Analyse-UI getrennt.
- Neues DOM-freies `js/analysis/domain.js` für Filterung, Rally-Aggregation und Basisstatistik.
- Neues `js/analysis/ui.js` für Analyse-Filter- und Ergebnis-Shells.
- App-Orchestrator liest UI-Zustand und delegiert Berechnung an die Analyse-Domain.
- Keine beabsichtigte fachliche Änderung der Analyseansichten oder Filter.

# 0.4.0 Preview7

- Undo-Gruppierung in DOM-freies History-Modul ausgelagert.
- Zustandsrekonstruktion aus Satzstart, Rally-Ergebnis, Rotation, Wechsel, Libero und Spielstandskorrektur ausgelagert.
- Legacy-Rotation ohne `lineup_after` wird über das gemeinsame Rotationsmodul rekonstruiert.
- Persistenz, CSV-I/O, Rendering und Session-Reload bleiben im App-Orchestrator.

# 0.4.0 Preview5

- Modularisierung Phase 5: neues DOM-freies `js/scouting/scoring.js`.
- Punktstand, Aufschlagwechsel und Sideout-Erkennung als reine Transition ausgelagert.
- Satzgewinnerprüfung und Satzsieg-Transition aus dem App-Orchestrator herausgelöst.
- Rotation, Satzwechsel-Orchestrierung, Undo/Reconstruction, Analyse und Kamera bewusst noch nicht modularisiert.
- Daten-Schema bleibt 5; keine Migration und keine beabsichtigte UI-/Funktionsänderung.

# 0.4.0 Preview4

- Modularisierung Phase 4: neues DOM-freies `js/scouting/events.js`.
- Persistierbarer Eventaufbau und aktionsspezifische Event-Normalisierung aus `app.js` ausgelagert.
- `appendEvent()`, Persistenz und Protokoll-Rendern bleiben als dünne Adapter im App-Orchestrator.
- Daten-Schema bleibt 5; keine Migration und keine beabsichtigte UI-/Funktionsänderung.

# 0.4.0 Preview3

- Modularisierung Phase 3: neues DOM-freies `js/scouting/rally.js`.
- Rally-ID/-Sequenz sowie K1/K2/K3-Transitionen aus `app.js` ausgelagert.
- Automatische Punktentscheidung als reine Rally-Domain-Funktion ausgelagert.
- Score-Mutation, Sideout, Rotation, Satzlogik und Eventpersistenz bewusst noch im App-Orchestrator.
- Daten-Schema bleibt 5; keine Migration und keine beabsichtigte UI-/Funktionsänderung.

# 0.4.0 Preview2
- Scouting-Capture WER → WAS → WIE → WO → WOHIN aus dem App-Monolithen in `js/scouting/scouting.js` ausgelagert.
- Scouting-Modul ist DOM-frei und erzeugt einen internen `ActionDraft`; Event-/Rally-/Scoring-Verarbeitung bleibt im Legacy-Orchestrator.
- Aufschlagtechnik, Zuspieldetails, Zonenvalidierung, direkter Gegneraufschlag und eigener Aufschlag-Preset im gemeinsamen Capture-Modul gebündelt.
- P1–P6 als WER und P1–P9 nur bei detaillierter Zonenwahl explizit abgesichert.
- Persistiertes Event- und Datenschema unverändert (Schema 5).
- Keine beabsichtigte UI-, Analyse-, Kamera-, Sync- oder Storage-Funktionsänderung.

# 0.4.0 Preview1
- Beginn der modularen Architektur ohne beabsichtigte Funktions- oder UI-Änderungen.
- State-Erzeugung, Normalisierung und Snapshot-Bereinigung ausgelagert.
- Stammdaten-Selektoren ausgelagert.
- Persistenz-Orchestrierung ausgelagert; Storage-/Sync-Implementierungen unverändert.
- Command-Vokabular als Vorbereitung für gemeinsame Touch-/Tastatursteuerung angelegt.
- Persistiertes Datenformat bleibt kompatibel zu 0.3.2 Preview2-r7 rebuild3-fix2.

## 0.3.2 Preview2-r7 rebuild3-fix2
- Eigene Technik-SVGs mit eindeutigem Standaufschlag von oben.
- Aufschlagvariante als optionale, analysierbare Zusatzinformation; alle Varianten sichtbar.
- Scouting2/3: DataVolley-Bedeutungen und Reihenfolge technikspezifisch korrigiert; Hilfe aktualisiert.

## 0.3.2 Preview2-r5
- Smartphone-Landscape-Modus, DataVolley-Bewertung ohne ++, einheitliche Symbole/Farben, kontextabhängige Bedienung und aktualisierte Hilfe.

# Changelog

## 0.3.2 Preview2-r5

- Kamerahilfe an die aktuelle modulare DJI-/GoPro-Implementierung angepasst.
- konkrete DJI-R-SDK-kompatible Modelle in Hilfe und Info-Hinweis ergänzt.
- konkrete Open-GoPro-kompatible HERO-Modelle ergänzt.
- nicht unterstützte DJI Action 2 / Osmo Action 3 ausdrücklich gekennzeichnet.
- Bedienung, Status-/Akkuanzeige, Verbindungsqualität und Diagnoseverhalten dokumentiert.

## 0.3.2 Preview2-r3

- `Neues Spiel` erzeugt sofort eine eigene stabile Match-ID.
- neues Spielobjekt wird unmittelbar lokal gespeichert/archiviert.
- Videozuordnung ist sofort vor vollständiger Spielkonfiguration möglich.
- `🎬 Video` direkt in jedem Spielbibliothekseintrag.
- Videos gespeicherter/unterbrochener/beendeter Spiele können ohne `Fortsetzen` gepflegt werden.
- Videoänderungen werden bei aktiver Nextcloud/WebDAV-Synchronisation wieder synchronisiert.

## 0.3.2 Preview2-r2

- Kameraauswahl auf Familiennamen vereinfacht: DJI Osmo Action / GoPro HERO.
- Info-Button mit kurzem Kompatibilitätshinweis ergänzt.
- ausführlichere Modellkompatibilität bleibt in Hilfe/Dokumentation.
- technische Kameraadapter unverändert.

# Changelog

## 0.3.2 Preview2-r1

- Kameraoberfläche kompakter und DJI/GoPro vereinheitlicht.
- Bluetooth-Diagnose nur nach fehlgeschlagenem Verbindungsversuch sichtbar.
- Diagnose verschwindet nach erfolgreicher Verbindung oder Reconnect.
- Akkusymbol mit Prozentwert in der Kameraansicht.
- GoPro-Hintergrundstatus auf konfigurierbare 10–15 s, Standard 12 s.
- DJI bleibt status-push-basiert; Anzeige wird im gleichen Rhythmus gedrosselt.
- Aufnahme-Stopp lässt die Bluetooth-Verbindung bestehen.
- Verbindungsqualität als abgeleitete Qualitätsanzeige statt RSSI gekennzeichnet.

## 0.3.2 Preview2

- Offline-first-Spielbibliothek: lokale und Cloud-Spiele werden über `matchId` zusammengeführt.
- Spiel laden, fortsetzen, prüfen und spielbezogen analysieren.
- Automatische lokale Speicherung und Nachsynchronisation bei Online-Rückkehr.
- Videospeicher lokal / Cloud / YouTube mit persistenter Spielzuordnung.
- Scouting↔Video-Timestamp-Abgleich je Video und Synchronisation der Video-Metadaten.
- DJI/GoPro: Verbindung bleibt nach Aufnahme-Stopp bestehen; Akku- und Verbindungsstatus vereinheitlicht.
- GitHub-Release-Updateprüfung mit Nutzerbestätigung, Backup und Datenmigration.
- Daten-Schema 4 für Match-/Video-Metadaten.
- Scouting-Fixes: WO, stabiler Bewertungsmodus, stabile Feldausrichtung.
- einfache Spielfelddarstellung auf exakt zwei Reihen korrigiert.
- interne Version `0.3.2 Preview2` in allen aktiven UI-/Cache-/Modulkennungen.

## 0.3.2 Preview1

- Neue Offline-first-Spielbibliothek aus lokalen und Cloud-Spielen.
- Spiele werden automatisch lokal archiviert; kein manueller Speichern-Button erforderlich.
- Bibliotheksanzeige mit Datum, beteiligten Teams, Status, Satz-/Punktestand sowie Cloud- und Geräte-Symbol.
- Unterbrochene Spiele können geladen und fortgesetzt werden.
- Gespeicherte Spiele können in einem Prüfmodus geöffnet und direkt für die Analyse ausgewählt werden.
- Nextcloud/WebDAV synchronisiert zusätzlich einen Spieleindex sowie nicht aktive lokale Spielstände nach Wiederherstellung der Online-Verbindung.
- Vorbereitung Analyse → Video: Videospeicher (lokal, Cloud, YouTube), persistente Videozuordnung zum Spiel und individueller Timestamp-Abgleich je Video.
- Video-Metadaten und Timestamp-Abgleich werden mit den Spiel-/Sessiondaten synchronisiert.
- PWA-/Service-Worker-Version und alle aktiven Modul-Cachekennungen auf 0.3.2 Preview1 angehoben.

## 0.3.1 Preview 2
- Neuer trainerorientierter Analysebereich: Übersicht, Rotation, K1/K2, First-Ball-Sideout, Aufschlag, Annahme, Zuspiel, Angriff Quelle→Ziel, Kontextketten und Gegner-Tendenzen.
- Analyse verwendet das gemeinsame Ereignismodell von einfachem und detailliertem Scouting; Detaildimensionen werden nur ausgewertet, wenn sie erfasst wurden.
- Angriffseffizienz: (Punkte − Fehler − direkt geblockt) / Angriffe.
- Zeitraum-A/B-Vergleich für die neuen Ansichten beibehalten.
- PWA-Cachekennung `0.3.1-p2c`.


### 0.3.1 Preview 1 – UI-Touch-Hotfix
- Technik- und Bewertungsbuttons im Scoutbereich vergrößert, insbesondere im detaillierten Profil.
- Bewertungslegende größer und zeilenweise dargestellt; Symbol und Bedeutung stehen in getrennten Spalten mit zusätzlichem Randabstand.
- PWA-Cachekennung auf `0.3.1-p1b` angehoben.
# Changelog – VolleyTakt Live

## 0.3.1 Preview 1
- Basis: korrigierte 0.3.0 Preview 9.
- Workflow um WOHIN erweitert.
- Eigenen Aufschlag mit P1 + Aufschlag vorausgewählt; Korrektur bleibt möglich.
- Detaillierte Aufschlagtechnik ergänzt.
- Basisbewertung auf = / - / 0 / + / # erweitert.
- Detaillierte Bewertung auf DataVolley-nahe = / - / ! / / / + / # umgestellt.
- Punktautomatik gemäß Techniksemantik: = Fehler; # automatisch nur bei Aufschlag/Angriff/Block.
- Einheitliches Datenmodell um serve_technique ergänzt.

# Changelog

## 0.3.0 Preview 9
- action_start_* wird beim ersten WER-Touch eingefroren; action_end_* beim Commit gespeichert.
- Detailliertes 9-Zonen-Feld P1–P9; P7–P9 nur für Aktions-/Zielorte.
- Zweites Zielfeld und getrennte target_zone für Richtungsanalysen.
- Zuspiel erweitert um FIVB Tempo 0–3, set_distance und Zuspiel-Zielzone.
- Bedienhilfe/Tour auf Preview-9-Modell erweitert.

# VolleyTakt Live 0.3.0 Preview 9

Basis: unveränderte 0.3.0 Preview 7.

- Neues Aktionsmodell `WER → WAS → WIE → WO`.
- Spieleridentität wird bei WER sofort als `player_id` eingefroren.
- Neue Felder `player_rotation_position`, `action_zone`, `target_zone`, `rally_phase`, `transition_no`.
- P1–P6 bleibt bis vor WO schnelle Spieler-Korrektur; in WO wird P1–P6 zur Aktionszone.
- Außen-/Innen-/Doppelrahmen und temporäre Aktionsanzeige ergänzt.
- Gegner-Angriff trennt Aktionszone und Zielzone.
- Bedienhilfe und Einführung auf Preview-8-Modell aktualisiert.
- CSV, Cache- und Modulkennungen auf Preview 8 aktualisiert.

# Changelog – VolleyTakt Live 0.3.0

Basis: VolleyTakt Live 0.2.4 Rev10. Der stabile 0.2.4-Zweig wird dadurch nicht ersetzt.

## Preview 2
- Modulares i18n-System in `js/i18n.js` und `js/locales/` eingeführt.
- Deutsch und Englisch für die komplette aktuelle Oberfläche bereitgestellt: Startbereich, Hauptansicht, Dialoge, Stammdaten, Match-/Kaderverwaltung, Einführung, Hilfe, Status- und Fehlermeldungen, Kamera-/Bluetooth-Hinweise, Cloud-Synchronisation und Analyse.
- Sprachwechsel unter Einstellungen wird sofort auf die laufende Oberfläche angewendet und lokal gespeichert.
- Interne Scoutingwerte, IDs und Eventwerte werden durch die Anzeigeübersetzung nicht verändert.
- „Bedienung & Hilfe“ auf breiten Ansichten als kompaktes 2-Spalten-Raster; auf schmalen Ansichten automatisch 1-spaltig.
- Versions-, Cache- und Modulkennungen auf `0.3.0 Preview 2` / `0.3.0-p2` vereinheitlicht.

## Preview 1
- Spontanes Scouting als erster 0.3.0-Prototyp: ohne Stammdatenpflicht, temporäre Match-/Spieler-IDs.
- Long-Touch auf Feldposition im spontanen Modus zum Setzen von Trikotnummer/Beschreibung.
- Erste Analyseansicht K1/K2 & Rotation mit Sideout-/Break-Quoten und Punkte-Differenz.
- Erste Spracheinstellung als Internationalisierungs-Scaffold.
- `TODO_0.3.0.md` mit weiterhin offenen Anforderungen ergänzt.

## Hinweis
Preview-Funktionen gelten nicht automatisch als endgültig abgenommen. Die 0.3.0-To-dos bleiben bis zur ausdrücklichen Abnahme in `TODO_0.3.0.md` erhalten. Stabiler WebApp-Entwicklungszweig ist parallel 0.2.4 Rev11.
- Preview 9 Korrektur: detaillierte Feldansicht fest am Netz ausgerichtet; Gegner oben spiegelbildlich P1/P6/P5 – P9/P8/P7 – P2/P3/P4, Wir unten P4/P3/P2 – P7/P8/P9 – P5/P6/P1.
- P7–P9 bleiben vor WER deaktiviert und dienen ausschließlich späteren Orts-/Zielangaben; die mittleren Zonen visualisieren die geteilte räumliche Zugehörigkeit zu den angrenzenden Grundpositionen.

- Hotfix Feldansicht: nur ein gemeinsames Netz zwischen Gegner/Wir; P7–P9 werden nach WER über selectedPlayerPos freigeschaltet; permanenter grauer Halbflächen-Schleier entfernt.

- 0.3.1 Preview 1 Korrektur p1d: gemeinsame responsive Scout-UI für einfach und detailliert; Profil unterscheidet nur Inhalt, nicht Touch-Zielgrößen oder Legendenlayout.

### 0.3.1 Preview 2 – Korrektur p2b
- Spiel-/Kaderarten verwenden im gesamten Spiel-Setup ausschließlich die zentrale Stammdatentabelle `master.matchTypes` mit stabiler ID.
- Keine automatische Anlage von Spielarten mehr durch Auswahlfelder, Spielanlage, Import oder Synchronisation.
- Manuelle Anlage prüft normalisiert auf Redundanz (Unicode-Normalisierung, Trim, Mehrfach-Leerzeichen, Groß-/Kleinschreibung).
- Bestehende Dubletten werden zusammengeführt; Spielkader, aktueller Zustand und Match-Archive werden auf die erhaltene ID migriert.
- Cloud-Merge normalisiert die Spielarten vor dem Zurückschreiben.
- Spontanes Scouting ist keine Spielart im regulären Auswahlfeld mehr.
- Reguläres und spontanes Scouting besitzen wieder eindeutig unterscheidbare Feldoptik.
- Bei ausgeschaltetem Gegner-Scouting wird der aktive Erfassungskontext auf das eigene Team zurückgesetzt.

### 0.3.1 Preview 2 – Korrektur p2c
- Satzvorbereitung arbeitet transaktional: vorhandene Aufstellung bleibt bis „Übernehmen“ unverändert.
- „Satz erneut vorbereiten“ zeigt die bereits gespeicherte Aufstellung vorausgewählt an.
- „Abbrechen“ verwirft alle Änderungen der laufenden Satzvorbereitung.
- Libero-Auswahl (bis zu zwei Libero-Spielerinnen pro Team/Satz) in die Startaufstellung aufgenommen.
- Libero-Auswahl wird satzbezogen gespeichert und im Satzstart-Ereignis mitgeführt.
- Im laufenden Satz werden bei Libero-Austausch vorrangig die für den Satz ausgewählten Liberos angeboten.
- Rückwärtskompatibilität für ältere Satzstart-Ereignisse ohne Libero-Felder erhalten.

### 0.3.1 Preview 2 – Korrektur p2d
- Persönliche Scout-Einstellung für Spielerinnen-Sortierung: Trikotnummer, Kürzel oder Vorname.
- Einheitliche Sortierung in Startaufstellung, Wechsel- und Libero-Auswahl.
- Satzvorbereitung fragt nur noch den Start-Libero ab; weitere Libero-Spielerinnen sind über den Spielkader bekannt.
- Alle im Spielkader als Libero gekennzeichneten Spielerinnen bleiben für spätere Libero-Austausche verfügbar.
- Bestehende ältere Satzdaten mit zwei Libero-Einträgen werden kompatibel gelesen und auf den Start-Libero reduziert.

### 0.3.1 Preview 2 – Korrektur p2e
- Scout-Einstellungen responsiv neu angeordnet.
- Checkbox-Gruppe und Spielerinnen-Sortierung besitzen einen klaren Abstand und überlappen nicht mehr.
- Breite Einstellungsbereiche zeigen die Gruppen nebeneinander; bei geringer verfügbarer Breite brechen sie automatisch untereinander um.
- Umbruch orientiert sich an der verfügbaren Breite des Einstellungsbereichs, nicht an einem einzelnen Gerätetyp.

## 0.3.1 Preview 2i
- Felddarstellungsschalter korrigiert: markierte Seite oben/unten steuert spiegelbildliche Einzelfelddarstellung und Netzposition.
- Bei Gegner-Scouting mit beiden Teams bleibt das Netz mittig; gilt für 6- und 9-Zonen-Ansicht.
- Links-/Rechts-Orientierung bleibt als TODO.


## 0.3.2 Preview2-r7 rebuild3-fix2
- Start-Gate auf kleinen/hohen und niedrigen Mobile-Viewports scrollbar und kompakt; Startbutton bleibt erreichbar.
- Felddarstellungs-Umschalter bindet die aktive Scoutseite korrekt an obere/untere Bildschirmhälfte; Aufschlagball folgt dem eigenen Feld.
- Detailliertes P1–P9-Feld erzwingt drei gleich hohe Positionsreihen; P7–P9 sind nicht mehr optisch verkleinert.
- Safe-Area/Viewport-Härtung gegen horizontales Überlaufen.
- Vollständiges ZIP; eindeutige fix2 Modul-/Cache-Version.


## 0.4.0 Preview10
- Touch-/Tastatur-Commandrouting weiter modularisiert.
- Neues DOM-freies Modul `js/app/input-routing.js` für Shortcut-Normalisierung, Shortcut→Command-Abbildung und Edge-Swipe-Erkennung.
- Konkrete DOM-Verkabelung und Ausführung der bestehenden Fachfunktionen bleiben im App-Adapter.
- Keine beabsichtigte Änderung an Scouting-, Punkt-, Rotations- oder Undo-Verhalten.
