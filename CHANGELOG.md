# VolleyTakt Live 0.4.3_1 – 07.10.2026

- Sprachwahl **DE / EN** bereits auf der Vorschaltseite ergänzt.
- Gewählte Sprache wird lokal gespeichert und von der eigentlichen Scouting-App übernommen.
- `?lang=de` und `?lang=en` werden als explizite Sprachvorgabe unterstützt, damit Homepage und externe Links die App direkt in der passenden Sprache öffnen können.
- Ohne explizite Auswahl gilt: gespeicherte Sprache → vorhandene App-Einstellung → Browsersprache → Fallback.
- Browser-/Bluetooth-Hinweis und Starttexte wechseln sofort mit der Sprache.
- Datenschema bleibt **6**; keine Migration von Match- oder Cloud-Daten.

---

# VolleyTakt Live 0.4.2 final – 07.10.2026

- RC3_2 als stabilen Release **0.4.2** veröffentlicht; Release-Kanal auf `stable` umgestellt.
- Datenschema bleibt **6**; für das Release ist keine neue Datenmigration erforderlich.
- Modulares Deutsch/Englisch-Sprachsystem mit getrennt wählbarer Reportsprache konsolidiert; i18n-Shadowing in Team-, Rotations-, Protokoll- und Analysepfaden beseitigt.
- Analyse-Dashboard zeigt lesbare Ansichtsbezeichnungen statt interner IDs.
- Einstellungen verwenden ein einheitliches responsives 2×X-Kachelraster.
- Optionaler VolleyVideo-Worker für serverseitigen physischen Videoschnitt integriert; Analyse, Filter, virtuelle Playlist und Schnittlistenexport bleiben ohne Worker vollständig nutzbar.
- Wiedergabe- und Verarbeitungsquelle für Videos getrennt; `VideoCutManifest` 1.1, Worker-Capabilities, Jobstatus und Ergebnisdownload ergänzt.
- Scouting-/Analyse-/Report-/Cloud-/Migrations-/Video-Regressionsprüfungen und der Import-Shadowing-Audit laufen im finalen Quellstand erfolgreich durch.
- Releasepakete erneut auf versehentlich eingebettete Zugangsdaten, Tokens, Private Keys und lokale Entwicklungspfade geprüft.

---

# VolleyTakt Live 0.4.2 RC3_2 – 07.10.2026

## UI-I18N2 / Stabilität

- Teamansicht nach Cloud-Synchronisation repariert: lokale Teamvariablen überschreiben die Übersetzungsfunktion `t()` nicht mehr.
- Team bearbeiten/neu anlegen verwendet ebenfalls konfliktfreie Variablennamen.
- Rotations- und Aufstellungslogik bereinigt: lokale `t`-Variablen wurden durch sprechende Namen ersetzt; damit bleibt `t()` als i18n-Funktion eindeutig.
- Protokoll-Rendering verwendet `rowEl` statt `tr`, damit auch der importierte i18n-Helfer `tr` nicht überschattet wird.
- Analyse-Callbackparameter `t` wurden in sprechende Namen umbenannt.
- Neuer automatischer Audit prüft alle JS-Module auf lokale Bindings, die importierte Bezeichner überschreiben.
- Keine Änderung am Datenschema (6) und keine Änderung an Cloud-/Matchdaten.

# VolleyTakt Live 0.4.2 RC3_1 – 06.10.2026

## Mehrsprachigkeit / i18n

- `REPORT-I18N1a`: persönlichen Spielerinnenreport nachgehärtet: dynamische Einleitung, Kennzahlen-Unterzeilen, Stärke/Entwicklungsfokus, Tabellen, Rotationshinweise sowie Text-/PNG-Ausgaben verwenden jetzt explizit die gewählte Reportsprache statt der UI-Sprache.
- `UI-I18N2`: Sprachsystem auf modulare Sprachdomänen konsolidiert; DE/EN-Kataloge besitzen identische semantische Schlüssel.
- Neue Domänen für Stammdatenformulare, Kamera, Synchronisation und Volleyball-Fachbegriffe; bestehende Domänen für UI, Analyse, Reports, Match, Runtime und Shell bleiben getrennt.
- Sichtbare Texte in Shell, Setup/Stammdaten, Analyse, Reportauswahl/-ausgaben, Kamera- und Sync-Konfiguration werden zentral über `t()`/Report-Lokalisierung erzeugt.
- Interne stabile Scoutingwerte (`Aufschlag`, `Annahme`, `Zuspiel`, `Angriff`, `Abwehr` usw.) bleiben zur Rückwärtskompatibilität der gespeicherten Daten deutsch kodiert; ihre Anzeige wird über zentrale Volleyball-Sprachschlüssel lokalisiert.
- Service Worker cached jetzt alle modularen Locale-Dateien explizit, damit die Sprachumschaltung auch offline zuverlässig funktioniert.
- Zusätzliche i18n-Regressionsprüfungen prüfen DE/EN-Schlüsselparität, kritische Oberflächen, fachliche Volleyballübersetzungen und vollständige englische Reportausgaben.
- Datenschema bleibt 6.

# VolleyTakt Live 0.4.2 RC3 – 06.10.2026

## Analyse & Einstellungen

- `REPORT-I18N1`: Reportsprache kann im Dialog „Report erzeugen“ unabhängig von der UI-Sprache auf Deutsch oder English gesetzt werden; die Auswahl gilt für Team-, persönlichen Spielerinnen- und Trainerreports einschließlich PDF/Druck, Text und PNG.
- `UI-I18N1`: Sprachumschaltung auf Deutsch/Englisch für neue RC2/RC3-Texte vervollständigt; Settings, Hauptnavigation, Analyseansichten, VolleyVideo-Worker und Reportaktionen verwenden konsistente fachliche Volleyballterminologie.
- `UI-I18N1` Nachkorrektur: Team-, persönliche Spielerinnen- sowie Trainerreports einschließlich Reportauswahl, Bildschirmdarstellung, Text-/PNG-Ausgabe und volleyballfachlicher Begriffe reagieren nun auf die gewählte Sprache.
- `UI-ANALYSIS-LABEL1`: Im Analyse-Dashboard werden interne IDs wie `priorityA`/`priorityB` nicht mehr angezeigt; sichtbar ist immer die lesbare Bezeichnung der gewählten Analyseansicht.
- `UI-SETTINGS2`: Einstellungsseite erneut vereinheitlicht: alle Einstellungsbereiche werden als klar gerahmte Kacheln im 2×X-Raster dargestellt; Navigationskacheln verwenden keine Pfeilsymbole mehr. Kacheln einer Zeile bleiben gleich hoch, unter 860 px erfolgt automatisch eine einspaltige Darstellung.
- Service-Worker-/Asset-Version auf `0.4.2-rc3` angehoben.

# VolleyTakt Live 0.4.2 RC2 – 23.09.2026

- Optionaler Bereich **Einstellungen → Videoschnitt** mit Provider-Auswahl; erster Anbieter VolleyVideo-Worker.
- Trennung von Wiedergabe- und Processing-Quelle für Spielvideos.
- VideoCutManifest 1.1 inklusive selectionContext, globalem Vor-/Nachlauf und sicherem Dateinamen.
- API-v1-Client, Capability-Anzeige, Jobstart/-status und Ergebnisdownload.
- API-Token bleibt lokale Gerätekonfiguration; keine Aufnahme in Matchdaten, Sync oder Manifeste.
- Analyse/Playlist/Export bleiben ohne Worker unverändert nutzbar.


- `UI-NAV3A`: Videozuordnung öffnet nun über `openDrawer('videoassignments')`; Zurück-Pfeil verwendet die echte Drawer-Historie, der veraltete lokale „← Spiel“-Button entfällt.
### 0.4.2 RC2 – Navigation/Onboarding/Scouting-UI Korrekturstand
- `UI-NAV2`: einheitlicher Zurück-Pfeil in Unteransichten mit echter Ein-Ebenen-Historie; X bleibt „komplett schließen“.
- `UI-SCOUT-QUALITY2`: WIE-Buttons stellen die bewährte 3×2-Geometrie wieder her (`+/#/0` oben, `-/=` links unten). Explizite Zeilenhöhen und Abstände verhindern Überlagerungen bei reduzierter Desktopbreite/-höhe.
- `UI-ONBOARD1`: Schnellstart von der Vorschaltseite startet die vollständige App-Shell vor der Tour; Erklärungsschritte ohne sichtbares Ziel erzeugen keinen falschen Fokusrahmen; der große Schnellstart-Button wird nach gespeicherter Tour-Entscheidung ausgeblendet.
# VolleyTakt Live 0.4.2 RC2 – 11.09.2026 Korrekturstand

## 0.4.2 RC2 · Aufgabenorientierte Hauptnavigation – 12.09.2026
- `UI-NAV1`: Hauptmenü auf sechs logisch getrennte Bereiche reduziert: **Spiel**, **Vorbereitung**, **Analyse**, **Daten**, **Hilfe**, **Einstellungen**.
- Unter **Vorbereitung** sind Spielerinnen, Teams, Saisons, Kader sowie Kamera & Video gebündelt.
- **Cloud & Synchronisation** ist jetzt Teil der Einstellungen; der operative Sync bleibt weiterhin aus der Spielbibliothek bzw. den Sync-Aktionen erreichbar.
- **Hilfe** ist ein eigener Hauptmenüpunkt mit Schnellstart, Ersteinführung, Fallstricken und Detailhilfe.
- Einstellungen enthalten nur dauerhafte App-/Benutzerkonfigurationen, Bedienoptionen, Updates und Cloud-Konfiguration.
- Die Ersteinführung wurde auf die neue Navigation angepasst; der problematische Schritt 4 verwendet keinen losgelösten Fokusrahmen mehr.
- `UI-MOBILE-IOS2` ist in diesem RC ausdrücklich nicht Bestandteil der Umsetzung.
- Service-Worker-Cache innerhalb von RC1 auf `rc1-nav1` revidiert.


## 0.4.2 RC2 · Schnellstart / Ersteinführung – 12.09.2026
- `UI-ONBOARD1`: Schnellstart/Ersteinführung überarbeitet: Spontan-Scouting steht für Neueinsteiger an erster Stelle; Hilfe verzweigt per Sprungmarken zu „Sofort scouten“, regulärem Spiel und Fallstricken.
- Ersteinführung auf sieben notwendige Schritte bis zur ersten Rally fokussiert; weiterhin manuell wiederholbar und per „Nicht mehr zeigen“ steuerbar.
- Schnellstart ist zusätzlich direkt am Start sowie bei noch nicht eingerichtetem Spiel erreichbar.
- Typische Fallstricke zu Kader, Satzvorbereitung, Aufschlagrecht, WER/WO, Qualitätsautomatik, Video und Cloud werden im Hilfetext erläutert.
- Service-Worker-Cache innerhalb von 0.4.2 RC2 revidiert, damit der Korrekturstand bei bestehender RC1-Installation zuverlässig aktualisiert wird.


- `ANALYSIS-VIDEO2`: Aktionsvideozeilen zeigen Technik und Qualität getrennt; leere `action_start_seconds` werden nicht mehr fälschlich als 0 interpretiert. Individuelle Aktionszeiten bleiben erhalten, fehlende Timestamps werden ausdrücklich als nicht verfügbar gekennzeichnet.
- `SYNC-CLEANUP1`: synchronisiert gelöschte Spiele entfernen nach dem Index-Tombstone auch den zugehörigen VolleyTakt-Sessionordner aus Nextcloud/WebDAV. Bereits als gelöscht markierte Altordner werden beim Laden der Cloud-Bibliothek best-effort bereinigt. Verknüpfte externe Videos werden nicht gelöscht.
- Regressionstests für unterschiedliche Aufschlag-Timestamps derselben Spielerin und Cloud-Session-Cleanup ergänzt.

# VolleyTakt Live 0.4.2 RC2 – 09.09.2026

### 0.4.2 RC2 – Korrekturstand Spielerinnenreport
- `UI-MATCH2`: Neuanlage eines Spiels korrigiert; Auswahl der Spiel-/Kaderart bleibt bis „Spiel übernehmen“ lokaler Formularzustand und leert Datum, Saison oder Teams nicht mehr.
- `REPORT-PLAYER-LAYOUT1`: PDF-/Drucklayout des persönlichen Spielerinnenreports auf A4 korrigiert; keine abgeschnittenen rechten Spalten oder horizontalen Überläufe.
- `ANALYSIS-PLAYER-REPORT2`: Persönlicher Spielerinnenreport zeigt jetzt auch neutrale/eingeschränkte Bewertungen und Aktionen ohne WIE explizit an.
- Techniktabellen enthalten die vollständige gespeicherte Qualitätsverteilung; Summen werden gegen die Zahl der Aktionen konsistent geführt.
- Eine niedrige Fehlerquote allein erzeugt keine „individuelle Stärke“ mehr; dafür muss positive Evidenz vorhanden sein.
- Bestehende Report-Erklärungstexte wurden nicht gekürzt; Erläuterungen zu Zwischenbewertungen und fehlender WIE-Bewertung wurden ergänzt.

- ANALYSIS-ACTIONS1: gefilterte Aktionslisten über einen oder mehrere Spiele, gruppiert nach Aktionswirkung.
- ANALYSIS-VIDEO1 / VIDEO2: Video-Drilldown und virtuelle Aktionsplaylist aus bestehenden Analysefiltern und Timestamps.
- VIDEO3: JSON-/CSV-Schnittlistenexport umgesetzt; physischer MP4-Zusammenschnitt lokaler Videos noch offen.
- ANALYSIS-PLAYER-REPORT1: persönlicher, individualisierter Spielerinnenreport mit PDF/Druck, Text, PNG und Teilen.
- REPORT-SHARE3: Web-Share-Erkennung für geeignete Touch-Tablets erweitert.
- Datenschema bleibt 6; Release-Kanal `preview`.

# Changelog

### 0.4.2 RC2 – Korrekturstand SYNC-LOCK1 / SCOUT-SCORE1
- `SYNC-LOCK1`: WebDAV HTTP 423 wird bei PUT kurz wiederholt; unveränderte Masterdata-Dateien werden nicht unnötig zurückgeschrieben.
- `SCOUT-SCORE1`: terminale Qualitätswerte lösen die festgelegte automatische Punktvergabe wieder zuverlässig aus.
- Regressionstests für beide Korrekturen ergänzt.

## 0.4.1 final – 09.09.2026

- RC6-8 als stabile 0.4.1 veröffentlicht.
- Versionskanal von `prerelease` auf `stable` umgestellt.
- Datenschema in den Release-Metadaten auf den tatsächlich verwendeten Stand **6** vereinheitlicht.
- Ticketverwaltung mit `TODO.md`, `tickets.json` und `CLOSED_TICKETS.md` eingeführt.
- Sicher umgesetzte RC6-Tickets als geschlossen dokumentiert.
- **UI-MATCH1:** aktuelles Spiel steht im Menü „Spiel“ vor der Spielbibliothek.
- **REPORT-PRINT3:** Trainer-Detailreport verwendet wieder den stabilen Zwei-Seiten-Umbruch; Abschnitt 4 beginnt auf Seite 2.
- **REPORT-STYLE1:** einheitliche Rundungen der Reportkacheln.
- **REPORT-SHARE2B:** Teilen-Schaltfläche nur auf geeigneten mobilen Plattformen sichtbar.
- Releasepakete auf notwendige Dateien reduziert und auf versehentlich eingebettete Zugangsdaten/Secrets geprüft.

---

## 0.4.1 RC6-8

- **REPORT-SHARE2B:** „Teilen“ wird in Spielerinnen- und Trainerreports nur noch auf mobilen/touch-basierten Plattformen mit nativer Web-Share-Unterstützung angezeigt. Auf Windows-, macOS- und Linux-Desktop bleibt der Button verborgen.

- **UI-MATCH1:** im Menü „Spiel“ wird das aktuelle Spiel jetzt vor der Spielbibliothek dargestellt.
- **REPORT-PRINT3:** Seitenumbruch des Trainer-Detailreports auf die zuvor stabile 2-Seiten-Komposition zurückgeführt; Abschnitt 4 „Technik- und Aktionsanalyse“ beginnt verbindlich auf Seite 2. Die STYLE1-Rundungen bleiben erhalten, ohne den mehrseitigen Report durch `overflow:hidden` zu beeinflussen.

- **REPORT-STYLE1:** einheitliche Kachelästhetik für Spielerinnen-, Trainer-Kurz- und Trainer-Detailreport. Außenkacheln und Kopfbereiche verwenden nun konsistente Radien; Innenkacheln einen kleineren Radius; Badges bleiben pillenförmig. Keine inhaltliche oder semantische Änderung.

- **REPORT-PRINT2:** Druckkopf des Browsers wird durch eine eigene VolleyTakt-Paged-Media-Konfiguration verdrängt; VolleyTakt erzeugt stattdessen eine Fußzeile mit `Seite x von y` und Erzeugungsdatum/-zeit.
- **REPORT-FORMAT1A:** verbleibende Punkt-Dezimalwerte im Trainerreport (u. a. Rallyquote und Rotations-Annahmewert) auf deutsches Dezimalkomma vereinheitlicht.
- **REPORT-TYPO1:** Trainer-Kurzreport und Seite 2 des Detailreports mit besser lesbarer Drucktypografie optimiert, ohne die 1-/2-Seiten-Ziele aufzugeben.
- **REPORT-SHARE2A:** Trainer-Kurz- und Detailreport bieten jetzt wie der Spielerinnenreport `PDF / Drucken`, `Text kopieren`, `PNG speichern` und `Teilen`.

- **REPORT-LAYOUT1:** neues platzoptimiertes A4-Kachelraster für Spielerinnen- und Trainerreports.
- **REPORT-PLAYER1:** Spielerinnenreport bleibt textlich unverändert und wird ausschließlich über Header, Raster, Abstände und Typografie auf eine einseitige A4-Darstellung optimiert.
- **REPORT-TRAINER1:** Trainerkachel enthält jetzt zwei direkte Ausgaben: „Kurzreport“ (1 Seite A4 als Ziel) und „Detailreport“ (max. 2 Seiten A4 als Ziel). Kein zusätzliches Auswahlfenster.

- **REPORT-PRINT1 (Bugfix):** beide PDF-Reports auf natürlichen Blockfluss umgestellt; Spielerinnenreport kompakter, Glossar dichter; Trainer-Innenkarten druckhell und kontrastreich.
- **ANALYSIS-REPORT3A (Bugfix):** Trainerreport verwendet für Spielerinnen K1/K2/K3 nun `playerContext` statt der flachen Spielerinnenübersicht; fehlende Gegnerdaten werden als „nicht erfasst“ statt 0 ausgegeben.
- **REPORT-FORMAT1 (Bugfix):** deutsche Prozentdarstellung mit Dezimalkomma vereinheitlicht; laufendes Spiel heißt „Spielstand“, abgeschlossenes Spiel „Ergebnis“; Ligaturen im Druck deaktiviert, um PDF-Textfehler wie `Angri�` zu vermeiden.

- **UI-REPORT1:** Reportauswahl als kompakter, viewport-zentrierter Dialog; keine unnötige Vollhöhe. Zwei responsive Zielgruppen-Kacheln, auf schmalen Viewports untereinander.
- **ANALYSIS-REPORT3:** eigenständiger interpretierter Trainerreport statt erneutem Analyse-Dashboard. Enthält priorisierte Erkenntnisse, K1/K2/K3, Rotationen, Technik-/Aktionsanalyse, Spielerinnen im Kontext, Gegnerdaten und Trainingsableitung.
- Der Trainerreport enthält keinen internen Button „Report erzeugen“ mehr.
- Trainerhinweise nennen Datenbasis und trennen Beobachtung, Interpretation und „Weiter analysieren“; keine Kausalitätsbehauptungen.
- **ANALYSIS-SHARE2:** aussagekräftige Exportnamen mit Spieldatum, eigenem Team, Gegner und Zielgruppe. Beispiel: `VolleyTakt_2026-08-15_MTV-BS-Da3_vs_MTV-Goslar_Trainer`.
- Spielerinnen-PNG und Share-Datei verwenden den neuen Dateinamen. Beim PDF-/Druckexport wird der Dokumenttitel vor dem Druck auf den gewünschten Dateinamen gesetzt, damit Browser ihn als PDF-Vorschlag übernehmen können.
- Gespeicherte Analyseergebnisse enthalten Team- und Trainerreport (`schema: 3`).
- Datenschema bleibt 6; keine Migration erforderlich.

## 0.4.1 RC6-7

- ANALYSIS-REPORT2A: Spielerinnenreport ergänzt um „Begriffe kurz erklärt“ für R1–R6, K1, K2, K3, Sideout, First Ball und Break; Kurzkennzahlen zeigen verständliche Bezeichnung plus Fachkürzel.

- ANALYSIS-REPORT2: neuer spielerinnengerechter Team-Report mit klarer Sprache statt Trainer-Rohdaten.
- Team-Report gliedert sich in „Das lief gut“, „Hier können wir besser werden“, „Fokus fürs nächste Training“, vier verständliche Kurzwerte und Rotations-Rallybilanz.
- ANALYSIS-SHARE1: PDF/Druck, PNG, Text kopieren und Web-Share.
- Gespeicherte Analyseergebnisse enthalten den Team-Report.
- Offline-Cache erweitert; Datenschema bleibt 6.


## 0.4.1 RC6-4

- ANALYSIS-SERVE1: Aufschlaganalyse semantisch getrennt in direktes Ergebnis (Fehler + Ass + im Spiel = 100 %), Breakquote und Gegnerannahme.
- ANALYSIS-K3: K3/Transition aus gegnerischem Angriff → eigenem Block/Abwehrkontakt → Zuspiel/Gegenangriff modelliert und nach Rotation/Auslöser ausgewertet.
- ANALYSIS-ROT1: Rotation um K1/K2/K3, First Ball, Annahme und ersten Angriff vertieft; „Punkte +/−“ als „Rallybilanz“ präzisiert.
- ANALYSIS-FIRSTBALL1: First-Ball-Sideout nach Rotation und Annahmequalität mit Erstangriffsbezug.
- ANALYSIS-SET1: Zuspiel nach Rotation, Phase, Annahme davor, Ziel, Tempo/Distanz und Folgeangriff.
- ANALYSIS-ATTACK1: Angriff nach Rotation, Phase, Quelle/Ziel, Annahme davor, Zuspieltempo, Effizienz und Rallyerfolg.
- ANALYSIS-RECEPTION1: Annahme nach Spielerin und Rotation mit Sideout, First Ball, Folgeangriff und Zuspielziel.
- ANALYSIS-BLOCKDEF1: Block/Abwehr trennt direkten Punkt, Weiterspiel und Transition-Erfolg.
- ANALYSIS-PLAYER1: Spielerinnenwirkung im K1/K2/K3- und Rotationskontext, ohne individuelle Kausalität zu behaupten.
- ANALYSIS-OPP1: Gegneraktionen zusätzlich nach eigener Rotation und Rallyerfolg kontextualisiert.
- ANALYSIS-CHAIN3: Gewinn-/Verlustketten als wiederkehrende Rallymuster ergänzt.
- ANALYSIS-TARGET1: WO→WOHIN-Verteilungen für Aufschlag und Angriff mit Erfolgs-/Fehlerbezug.
- ANALYSIS-COMPARE2: A/B-Vergleich um Delta-Kennzahlen in Prozentpunkten mit Richtung ergänzt.
- ANALYSIS-CONFIDENCE2: einheitliche Datenbasisstufen n<4 / 4–7 / 8–17 / ≥18 und sichtbare Legende.
- ANALYSIS-INSIGHT3: Insight-Engine auf K3, First Ball, Serve, Annahme, Zuspiel, Angriff, Block/Abwehr, Ziele, Spielerinnen und Gegner erweitert.
- ANALYSIS-REPORT1: Detailansicht als druckbarer Trainerbericht mit Kennzahlen, Visualisierung, Interpretation und Detaildaten.
- UI-SCOUT-QUALITY1: Basis-WIE-Schaltflächen nur visuell neu geordnet: oben `+`, `#`, `0`; unten `-`, `=`. Semantik, gespeicherte Werte und Qualitätsprofil bleiben unverändert.
- Datenschema bleibt 6.

## 0.4.1 RC6
- Neue seitliche Menüstruktur mit rechts ausklappendem Inhaltsbereich.
- Responsives Analyse-Dashboard mit automatisch aus der verfügbaren Breite bestimmter Kachelanzahl.
- Detailanalysen und bestehende Filterlogik bleiben erhalten.

# Changelog

## 0.4.1 RC5-6

- SCOUT-SYNC1/2: Mehrgeräte-Konflikt vollständig umgesetzt: neuere Cloud-Generation wird erkannt und kann bewusst **Cloud übernehmen** oder **Lokal behalten** werden.
- **Cloud übernehmen** ersetzt den lokalen Spiel-/Protokollstand vollständig durch Session, Events, Videozuordnungen und Status aus der Cloud und setzt die lokale Sync-Generation korrekt fort.
- **Lokal behalten** schreibt den lokalen Stand nach expliziter Auswahl unter bestehendem Lease-/ETag-Schutz als neue Generation in die Cloud.
- Ein gültiger Fremd-Lease kann weiterhin nicht überschrieben werden.
- Erfolgreicher Live-Sync gleicht den lokalen Archivstand ab; reine Cloud-Heartbeat-Zeitstempel lösen dadurch nicht mehr dauerhaft einen falschen „Cloud neuer“-Status aus.
- Rendern der Spielbibliothek verändert den lokalen `updatedAt`-Zeitstempel nicht mehr.
- VIDEO-TIMESTAMP1f: Seitengrößen-Auswahl und Pagination im Zeiten-Editor sichtbar/stabil; Kopfbereich ohne abgeschnittene Controls.
- Timestamp-Nacharbeit: vollständige Chronologie statt Ausschnitt der letzten Einträge.
- Seitengröße Alle/10/25/50/100 mit Seitennavigation.
- WER-Auswahl mit Trikotnummer und Kürzel/Name; P1–P6 als Fallback.
- WOHIN trennt eigenes Feld und Gegnerfeld eindeutig.
- UI-Feinschliff für den 3-spaltigen Einfügedialog.

## 0.4.1 RC4

- RC4 vollständig neu auf `0.4.1 RC3 UI-SCOUT4` aufgebaut
- WebDAV-/Nextcloud-Relay um persistentes, dateibasiertes Auth-Rate-Limit ergänzt; 429-Schutzantwort und sicherheitsorientiertes Logging ohne Credentials
- Relay-User-Agent auf `VolleyTaktLive-WebDAV-Relay/0.4.1-RC4` aktualisiert
- i18n um semantische Message-Keys und automatischen Coverage-/Drift-Test erweitert; bekannte sichtbare Übersetzungslücken und Kamera-/Setup-Textdrifts geschlossen
- SCOUT-WOHIN1: verbindliche WOHIN-Feldorientierung korrigiert
- SCOUT-FLOW1: freie WER/WAS/WIE-Eingabereihenfolge bei identischem semantischem Datensatz
- SCOUT-SIDE1: automatische Seitenvorauswahl beim Satzwechsel, weiterhin manuell überschreibbar
- SCOUT-VIDEO1: lokale Zeit startet bei zugeordnetem Video spätestens mit dem ersten Scouting-Touch ohne Kamera-Zeitquelle
- SCOUT-SYNC1: neuere Cloud-Version kann bewusst lokal übernommen werden; kompakte Auswahl-/Warntexte und Cloud-neuer-Status in der Bibliothek
- UI-LIBRARY1: Busy-Anzeige bei synchronisiertem Löschen/Cloud-Übernahme
- UI-MOBILE11: Protokoll-/Vollbildwerkzeuge überlagern Drawer/Modal/Tour nicht mehr
- UI-ANALYSIS1: Tabellenköpfe und Daten der Analyse verwenden wieder dieselbe Tabellengeometrie
- UI-SETTINGS1: Drawer-Inhalt wird beim Bereichswechsel explizit geleert und neu gerendert
- LEGAL-AI1: freiwilliger Hinweis auf KI-Unterstützung in About/Legal
- aktive Versions-/Cachekennungen auf 0.4.1 RC4 konsolidiert; Datenschema bleibt 5

## 0.4.1 RC3

- UI-SCOUT4: Korrekturleiste auf sieben Aktionen korrigiert; „Aktion abbrechen“ bleibt in Desktop-, Tablet- und Smartphone-Layouts sichtbar.
- mobile Vorschaltseite größer und näher an der Desktop-Identität gestaltet
- Portrait-Drehhinweis wird vor Sichtbarkeit der eigentlichen App vorbereitet
- Vollbild-Wiederherstellungsbutton für den mobilen Browser ergänzt
- Protokollbutton in die Feldkopf-Werkzeugzone verschoben
- einfache Qualitätsbewertung auf Touch-Tablets mit stabilem Zwei-Zeilen-Grid gehärtet
- reproduzierbarer PWA-Installationszugang mit Browser-Fallback-Anleitung ergänzt
- Datenschema unverändert 5

## 0.4.1 RC2

- UI-MOBILE1–8 umgesetzt und browserneutral gehärtet
- mobile Vorschaltseite neu ausbalanciert, Firefox-Überbreite beseitigt
- Chrome-Portrait-Erkennung durch stabile Orientation-/Viewport-Neubewertung verbessert
- Chrome-Landscape fällt nun ebenfalls in die kompakte Smartphone-Klasse
- Portrait-Drehhinweis um VolleyTakt-Logo ergänzt
- Safe-Area/dvh/svh/WebKit-Härtung für iOS-nahe Browserbedingungen
- Datenschema unverändert 5

## 0.4.1 RC1

- neue geräteklassenspezifische Layout-Schicht bei gemeinsamer Fachlogik
- Smartphone-Landscape für niedrige nutzbare Viewport-Höhen neu aufgebaut
- Qualität (WIE) im Smartphone-Landscape explizit sichtbar und bedienbar
- Smartphone-Protokoll als Overlay/Drawer statt Desktop-Spalte
- Smartphone-Portrait mit Vollbild-Drehhinweis, Blur und Bedienblockade
- Bedienhilfe: Bewertungssymbole wieder korrekt als Tabellenkopfzeile
- Datenschema unverändert 5

## 0.4.0 final

- modulare Anwendungsarchitektur für State, Persistenz, Scouting, Rally/Scoring, Match-Flow, History, Input-Routing, Kamera und Analyse
- DataVolley-orientierte Bewertung einschließlich korrekter terminaler `=`/`#`-Punktlogik
- Spontanscouting einschließlich terminaler Punktwertung ohne vorher festgelegtes erstes Aufschlagrecht
- stabile Rally-Nummerierung, Undo/Redo, Wechsel- und Doppel-Libero-Workflow
- responsive Tablet-/Smartphone-Landscape-Darstellung und vereinheitlichte Scouting-Bedienung
- Spielbibliothek mit lokaler/Cloud-Sicht, Fortsetzen, Prüfen, Analysieren und Videozuordnung
- DJI-/GoPro-Kameraadapter, Status-/Akkuanzeige und Diagnose nur bei Verbindungsfehlern
- erweiterter Analysebereich mit Spiel-/Phasen-, Technik-/Wirkungs- und vertiefenden Analysen, A/B-Vergleich, gespeicherten Ergebnissen und Druck/PDF
- In-App-Hilfe auf den finalen Bedien-, Scouting- und Analyseumfang aktualisiert
- About mit Copyright © 2026 Ingo Zech und PolyForm Perimeter License 1.0.1
- Datenschema bleibt Version 5; keine Migration gegenüber RC10 erforderlich

## 0.4.1 RC5-1
- ANALYSIS-HELP1: Erklärungen und Tooltips für alle Analyseansichten und zentrale Kennzahlen ergänzt.
- VIDEO-TIMESTAMP1: erster Timestamp-Nacharbeitseditor im Protokoll und in der Spielbibliothek; tolerante Eingabeformate und Live-Vorschau.
- VIDEO-TIMESTAMP1 erweitert: fehlende Aktionen können als neue Protokollzeile nachträglich eingefügt und semantisch mit WER/WAS/WIE/WO/WOHIN sowie Timestamp ergänzt werden.

- **VIDEO-TIMESTAMP1a:** Timestamp-Nacharbeit zeigt pro Protokollzeile einen sichtbaren `＋`-Button. Dieser setzt die Zeile als Einfügeanker und öffnet den Editor zum Ergänzen einer fehlenden Aktion.

- Timestamp-Nacharbeit: kompakter Tabellenbereich ohne unnötigen Dialog-Scroll, optimierte Spaltenbreiten sowie konsistenter Abgleich mit dem aktuellen Live-Protokoll.

## 0.4.1 RC5-1
- VIDEO-TIMESTAMP1e: `Spiel → Zeiten` öffnet wieder zuverlässig; fehlende Persistenz-Hilfsfunktion ergänzt.
- VIDEO-TIMESTAMP1d: Dialog „Aktion davor einfügen“ mit ausreichend großen Select-/Eingabefeldern und responsivem 3/2/1-Spalten-Layout.
- RC-Revisionsschema eingeführt: erste Fassung `RCn`, Überarbeitungen `RCn-1`, `RCn-2`, …; bei `RC(n+1)` startet der Zähler neu.

### RC5-5 Nacharbeit
- WER-Auswahl in Nacharbeitsdialogen vereinheitlicht: nur aktiver Spieltagskader, Feldspieler zuerst, beide Gruppen nach Trikotnummer sortiert.
- WOHIN folgt technikabhängig derselben Feldseitenlogik wie das Live-Scouting.
- Nachträglich eingefügte Aktionen können optional ein Rally-Ergebnis (Punkt Wir/Punkt Gegner) setzen; Folgestände werden konsistent neu berechnet.
- Einfügedialog breiter, Labels enger an den Feldern und Controls touch-tauglich.


## RC1-Korrekturstand · Navigation, Mobile und Scouting-Semantik (19.09.2026)
- `UI-NAV3`: Videospeicher/Zuordnung, Spiel-/Kaderarten und Tastaturkürzel vollständig in die Drawer-Historie integriert; der globale Zurück-Pfeil führt jeweils genau eine Ebene zurück.
- `UI-PLAYERS1`: „Inaktive anzeigen“ funktioniert wieder als echter Filter und schaltet zwischen Anzeigen/Ausblenden.
- `UI-MOBILE-IOS1`: Visual-Viewport-/Safe-Area-Härtung für iOS/Safari ergänzt; reale Geräteverifikation bleibt offen.
- `UI-MOBILE10`: Startscreen-Aktionen bleiben auch bei kurzen mobilen Browser-Viewports sichtbar/erreichbar; reale Geräteverifikation bleibt offen.
- `SCOUT-DATA1`: Aktionsqualität/-wirkung und Rally-Ergebnis besitzen explizit getrennte semantische Felder im Eventmodell, bei Rückwärtskompatibilität der bisherigen Felder.
- `SCOUT-K3`: K3 wird im Live-Scouting explizit aus Gegner-Angriff → eigener Block/Abwehr erkannt und mit Trigger/Transitionnummer gespeichert.
- `UI-SCOUT-QUALITY2`: nach realer Nutzerprüfung geschlossen.

## 0.4.2 RC2 – Korrekturstand 20.09.2026
- DATA-MIGRATION1: robuste Schema-Erkennung, nur eine Migrationssicherung und kontrollierte Quota-Behandlung beim Start.
- UI-SCOUT-ICON1 historisch geschlossen: nach Seitenaktualisierung nicht reproduzierbar.
- UI-ANALYSIS-DATE1 als offenes Nice-to-have aufgenommen.
