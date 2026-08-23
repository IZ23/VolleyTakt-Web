# Changelog

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
