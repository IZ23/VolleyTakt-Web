# VolleyTakt Live – offene Tickets

Stand: **0.4.2 final · 07.10.2026**

Diese Datei enthält alle noch nicht geschlossenen Tickets. Die vollständige maschinenlesbare Historie steht in `tickets.json`; abgeschlossene Tickets stehen in `CLOSED_TICKETS.md`.

## 0.4.2 final · aus RC3_2 stabilisiert

- `REPORT-I18N1a` — **implemented** — dynamische Inhalte des persönlichen Spielerinnenreports sind vollständig an die gewählte Reportsprache gebunden; UI-Sprache und Reportsprache können abweichen, ohne gemischte DE/EN-Textbausteine. Bildschirm-, Text- und PNG-Ausgabe verwenden dieselbe Report-Locale.
- `UI-I18N2` — **implemented** — zentrale modulare DE/EN-Sprachdomänen; RC3_2 beseitigt zusätzlich Shadowing der i18n-Helfer `t`/`tr` durch lokale Variablen und Callback-Parameter. Teamliste/-editor und Rotationspfad sind korrigiert; ein automatischer Import-Shadowing-Audit verhindert Wiederholungen.
- `UI-I18N1` — **implemented** — vollständige Deutsch/Englisch-Abdeckung der sichtbaren RC2/RC3-UI einschließlich Settings-Kacheln, Analyseansichten, Worker-Konfiguration sowie Team-, persönlichen Spielerinnen- und Trainerreports samt Text-/PNG-Ausgaben; Volleyballterminologie fachlich vereinheitlicht.
- `REPORT-I18N1` — **implemented** — Reportsprache Deutsch/English ist im Reportdialog unabhängig von der UI-Sprache auswählbar; Auswahl gilt für alle vier Reportarten und deren Bildschirm-/PDF-/Text-/PNG-Ausgaben.
- `UI-ANALYSIS-LABEL1` — **implemented** — Dashboard zeigt lesbare Ansichtsnamen statt interner IDs (`priorityA`, `priorityB`).
- `UI-SETTINGS2` — **implemented** — einheitliches 2×X-Raster: jeder Einstellungsbereich ist als klar gerahmte Kachel dargestellt; Navigationskacheln ohne Pfeilsymbole; Kacheln je Rasterzeile gleich hoch; unter 860 px einspaltig.


## 0.4.2 RC2 · VIDEO3 / optionaler Videoschnitt

- `VIDEO3` – **in Arbeit**: optionaler physischer Videoschnitt über externen Dienst; Kernfunktionen bleiben ohne Worker vollständig nutzbar.
- `VIDEO3-SOURCE1` – **umgesetzt**: `playbackSource` und `processingSource` getrennt, Altformat kompatibel.
- `VIDEO3-MANIFEST1` – **umgesetzt**: serverneutrales `VideoCutManifest` 1.1.
- `VIDEO3-WORKER1` – **umgesetzt**: Einstellungen → Videoschnitt, Anbieter VolleyVideo-Worker, LAN-Adresse/API-Token/Verbindungstest.
- `VIDEO3-API1` – **umgesetzt**: API-v1-Client für Health/Capabilities/Jobs/Result.
- `VIDEO3-UI1` – **umgesetzt**: „Aus Auswahl Video erzeugen“ mit Vor-/Nachlauf, Dateiname und Profil.
- `VIDEO3-PADDING1` – **umgesetzt**: globales Job-Padding, keine Änderung der Aktions-Rohzeiten.
- `VIDEO3-FILENAME1` – **umgesetzt**: sicherer editierbarer Dateiname.
- `VIDEO3-CAP1` – **umgesetzt**: Capability-Anzeige und Profilnutzung.
- `VIDEO3-JOB1` – **umgesetzt**: Jobstart, Polling und Ergebnisdownload.
- `VIDEO3-SEC1` – **umgesetzt**: Worker-Adresse und Token bleiben ausschließlich lokal.
- `VIDEO3-NET1` – **umgesetzt**: Worker-Ausfall bleibt auf Videoschnitt beschränkt; HTTPS/CORS/LAN-Hinweise.
- `VIDEO3-COMPAT1` – **umgesetzt**: alte Videozuordnungen bleiben ohne Schema-Migration nutzbar.

**Noch zu verifizieren:** reale Verbindung zu VolleyVideo-Worker im LAN/VPN auf Chrome, Firefox und Samsung Browser; CORS/HTTPS/Private-Network-Verhalten; Jobstatus und Binärdownload gegen die produktive Worker-API.

## Offen / in Arbeit / umgesetzt (noch nicht verifiziert)

### SCOUT-DATA1 – Scouting-Datenmodell weiter entkoppeln
- Typ: `feature`
- Zielversion: `0.4.2`
- Status: `implemented`
- Priorität: `high`
- Beschreibung: Aktionsqualität/-wirkung und Rally-Ergebnis sind im Eventmodell explizit getrennt: action_quality/action_effect liegen auf Aktionsereignissen, rally_result auf Rally-Ergebnisereignissen. Bestehende value-/rally_winner-Felder bleiben kompatibel erhalten.

### SCOUT-K3 – K3 im Live-Scouting erweitern
- Typ: `feature`
- Zielversion: `0.4.2`
- Status: `implemented`
- Priorität: `high`
- Beschreibung: K3/Transition wird im Live-Scouting explizit aus der beobachteten Folge Gegner-Angriff → eigener Block/Abwehr abgeleitet. transition_trigger/source und transition_no werden am Aktionsereignis gespeichert; nachfolgende eigene Aktionen bleiben im K3-Kontext.

### UI-SCOUT2 – Scouting-UI – offener Ausbaupunkt 2
- Typ: `ui`
- Zielversion: `offen`
- Status: `open`
- Priorität: `medium`
- Beschreibung: Historischer offener Scouting-UI-Punkt; vor Umsetzung gegen die ursprüngliche Detailanforderung im Entwicklungskontext präzisieren.

### UI-SCOUT3 – Scouting-UI – offener Ausbaupunkt 3
- Typ: `ui`
- Zielversion: `offen`
- Status: `open`
- Priorität: `medium`
- Beschreibung: Historischer offener Scouting-UI-Punkt; vor Umsetzung gegen die ursprüngliche Detailanforderung im Entwicklungskontext präzisieren.

### UI-MOBILE10 – Mobile Startscreen-Funktionen absichern
- Typ: `bug`
- Zielversion: `0.4.2`
- Status: `implemented`
- Priorität: `high`
- Beschreibung: Startscreen-Funktionen bleiben auch bei kurzen mobilen Browser-Viewports erreichbar: Aktionen werden einspaltig gehalten, Startkarte intern scrollbar und Safe-Area-/Visual-Viewport-gebunden. Reale Geräteprüfung bleibt erforderlich.

### UI-MOBILE-IOS1 – iOS/Safari Viewport-Härtung
- Typ: `bug`
- Zielversion: `0.4.2`
- Status: `implemented`
- Priorität: `high`
- Beschreibung: Safari/WebKit-Viewport mit visualViewport-Höhe, dvh/svh-Fallbacks und Safe-Area-Abständen für App-Shell, Startseite, Drawer und Dialoge gehärtet. Reale iOS/Safari-Verifikation bleibt erforderlich.

### UI-ONBOARD1 – Schnellstart und Ersteinführung für Neueinsteiger
- Typ: `ui`
- Zielversion: `0.4.2`
- Status: `implemented`
- Priorität: `high`
- Beschreibung: Schnellstart und Ersteinführung für Neueinsteiger. Spontan-Scouting steht als niedrigschwelliger Einstieg ohne Stammdaten an erster Stelle; Hilfe verzweigt per Sprungmarken. Korrekturen: Schnellstart von der Vorschaltseite startet erst die vollständige App-Shell und danach die Tour; nicht sichtbare Tour-Ziele werden nicht markiert; der große Vorschaltseiten-Schnellstart wird nach einer gespeicherten Tour-Entscheidung ausgeblendet.

### VIDEO2 – Aktionsplaylist und Video-Sequenzen
- Typ: `feature`
- Zielversion: `0.4.2`
- Status: `implemented`
- Priorität: `high`
- Beschreibung: Gefilterte Aktionen aus dem Analysezeitraum als virtuelle Video-Playlist einzeln oder sequenziell abspielen; Timestamps und Videozuordnungen werden berücksichtigt.

### VIDEO3 – Video-/Schnittlistenexport
- Typ: `feature`
- Zielversion: `0.4.2`
- Status: `in_progress`
- Priorität: `medium`
- Beschreibung: Aktionsauswahl bleibt als JSON/CSV-Schnittliste exportierbar. RC2 ergänzt optional den VolleyVideo-Worker für den physischen MP4-Zusammenschnitt über ein serverneutrales VideoCutManifest; reale End-to-End-Verifikation mit Worker/LAN/Browsern steht noch aus.

### CAMERA1 – Kamera – Ausbaupunkt 1
- Typ: `feature`
- Zielversion: `offen`
- Status: `open`
- Priorität: `medium`
- Beschreibung: Weiterer Kamera-Ausbaupunkt der modularen DJI/GoPro-Anbindung.

### CAMERA2 – Kamera – Ausbaupunkt 2
- Typ: `feature`
- Zielversion: `offen`
- Status: `open`
- Priorität: `medium`
- Beschreibung: Weiterer Kamera-Ausbaupunkt der modularen DJI/GoPro-Anbindung.

### SYNC1 – Synchronisation – Ausbaupunkt 1
- Typ: `feature`
- Zielversion: `offen`
- Status: `open`
- Priorität: `medium`
- Beschreibung: Weiterer Cloud-/Synchronisations-Ausbaupunkt; bestehende Konfliktlogik bleibt davon unberührt.

### SYNC2 – Synchronisation – Ausbaupunkt 2
- Typ: `feature`
- Zielversion: `offen`
- Status: `open`
- Priorität: `medium`
- Beschreibung: Weiterer Cloud-/Synchronisations-Ausbaupunkt.

### SYNC3 – Synchronisation – Ausbaupunkt 3
- Typ: `feature`
- Zielversion: `offen`
- Status: `open`
- Priorität: `medium`
- Beschreibung: Weiterer Cloud-/Synchronisations-Ausbaupunkt.

### UPDATE1 – Update-Mechanismus weiterentwickeln
- Typ: `feature`
- Zielversion: `offen`
- Status: `open`
- Priorität: `medium`
- Beschreibung: Weiterer Ausbau des Update-/Release-Mechanismus.

### DOC1 – Dokumentation – Ausbaupunkt 1
- Typ: `documentation`
- Zielversion: `offen`
- Status: `open`
- Priorität: `medium`
- Beschreibung: Offener Dokumentationspunkt.

### DOC2 – Dokumentation – Ausbaupunkt 2
- Typ: `documentation`
- Zielversion: `offen`
- Status: `open`
- Priorität: `medium`
- Beschreibung: Offener Dokumentationspunkt.

### WEB1 – Web/Homepage – Ausbaupunkt 1
- Typ: `web`
- Zielversion: `offen`
- Status: `open`
- Priorität: `medium`
- Beschreibung: Offener Web-/Außendarstellungs-Punkt.

### WEB2 – Web/Homepage – Ausbaupunkt 2
- Typ: `web`
- Zielversion: `offen`
- Status: `open`
- Priorität: `medium`
- Beschreibung: Offener Web-/Außendarstellungs-Punkt.

### WEB3 – Web/Homepage – Ausbaupunkt 3
- Typ: `web`
- Zielversion: `offen`
- Status: `open`
- Priorität: `medium`
- Beschreibung: Offener Web-/Außendarstellungs-Punkt.

### QUAL-CORE1 – Neutrales Qualitäts-Kernmodell
- Typ: `architecture`
- Zielversion: `0.5.0`
- Status: `open`
- Priorität: `medium`
- Beschreibung: Neutrales internes Bewertungsmodell als gemeinsame Grundlage für unterschiedliche Erfassungsprofile.

### QUAL-PROFILE1 – Konfigurierbare Qualitätsprofile 1
- Typ: `feature`
- Zielversion: `0.5.0`
- Status: `open`
- Priorität: `medium`
- Beschreibung: DataVolley-nahe bzw. konfigurierbare Erfassungs-/Bewertungsprofile auf gemeinsamem Datenmodell.

### QUAL-PROFILE2 – Konfigurierbare Qualitätsprofile 2
- Typ: `feature`
- Zielversion: `0.5.0`
- Status: `open`
- Priorität: `medium`
- Beschreibung: Weiterer Profil-Ausbau auf dem gemeinsamen Qualitätsmodell.

### QUAL-PROFILE3 – Konfigurierbare Qualitätsprofile 3
- Typ: `feature`
- Zielversion: `0.5.0`
- Status: `open`
- Priorität: `medium`
- Beschreibung: Weiterer Profil-Ausbau auf dem gemeinsamen Qualitätsmodell.

### QUAL-PRECISION1 – Qualitätspräzision
- Typ: `feature`
- Zielversion: `0.5.0`
- Status: `open`
- Priorität: `medium`
- Beschreibung: Präzisierung/Granularität des Qualitätsmodells.

### QUAL-MAP1 – Qualitäts-Mapping
- Typ: `architecture`
- Zielversion: `0.5.0`
- Status: `open`
- Priorität: `medium`
- Beschreibung: Mapping zwischen Profilwerten und neutralem Kernmodell.

### QUAL-IMPORT1 – Qualitätsprofil-Import
- Typ: `feature`
- Zielversion: `0.5.0`
- Status: `open`
- Priorität: `medium`
- Beschreibung: Import-/Übernahmefähigkeit für Qualitätsprofile.

### QUAL-UI1 – UI für Qualitätsprofile
- Typ: `ui`
- Zielversion: `0.5.0`
- Status: `open`
- Priorität: `medium`
- Beschreibung: Konfigurations- und Bedienoberfläche für Qualitätsprofile.

### CHAIN1 – Aktionsketten – nächster Ausbau
- Typ: `analysis`
- Zielversion: `0.5.0`
- Status: `open`
- Priorität: `medium`
- Beschreibung: Weiterer Ausbau der Aktionsketten auf Basis des gemeinsamen Datenmodells.

### ANALYSIS-ACTIONS1 – Spielerinnen-Aktionsanalyse
- Typ: `feature`
- Zielversion: `0.4.2`
- Status: `implemented`
- Priorität: `high`
- Beschreibung: Aktionen über den gewählten Analysezeitraum nach Spielerin, Technik, Rotation, Satz und vorhandenen Zonen filtern und als Liste nach erfolgreich, neutral/eingeschränkt und fehlerhaft gruppieren.

### ANALYSIS-VIDEO1 – Video-Drilldown aus Analyseergebnissen
- Typ: `feature`
- Zielversion: `0.4.2`
- Status: `implemented`
- Priorität: `high`
- Beschreibung: Bestehende Analyse-Detailansichten erhalten Zugriff auf die zugrunde liegenden gefilterten Video-Sequenzen. Einzelne oder alle browserfähigen Sequenzen können abgespielt werden.

### ANALYSIS-PLAYER-REPORT1 – Persönlicher Spielerinnenreport
- Typ: `feature`
- Zielversion: `0.4.2`
- Status: `implemented`
- Priorität: `high`
- Beschreibung: Für eine einzelne Spielerin wird aus dem gewählten Analysezeitraum ein persönlicher, individuell ausgewerteter Report mit denselben fachlichen Grundprinzipien und vollständigen Erklärungstexten erzeugt; PDF/Druck, Text, PNG und native Teilen-Funktion werden unterstützt.

### REPORT-SHARE3 – Teilen auf Android-Tablets absichern
- Typ: `bug`
- Zielversion: `0.4.2`
- Status: `verified`
- Priorität: `high`
- Beschreibung: Native Teilen-Schaltflächen für Spielerinnen- und Trainerreports werden auf geeigneten touch-basierten Android-Tablets angezeigt, wenn navigator.share verfügbar ist. Auf Samsung Galaxy Tab S9+ wurde die Schaltfläche real geprüft; der native Share-Dialog öffnet sich.

### UI-REPORT2 – Report-Auswahldialog kompakt und responsiv halten
- Typ: `bug`
- Zielversion: `0.4.2`
- Status: `implemented`
- Priorität: `high`
- Beschreibung: Regression aus 0.4.2 RC2 korrigieren: Report-Auswahldialog wieder harmonisch und kompakt wie 0.4.1 final gestalten. Team-, persönlicher Spielerinnen- und Trainerreport bleiben innerhalb des Dialograhmens; bei zu geringer Höhe scrollt ausschließlich der mittlere Inhaltsbereich mit sichtbarer vertikaler Bildlaufleiste, während Kopf und Fußzeile sichtbar bleiben.

### ANALYSIS-PLAYER-REPORT2 – Persönlichen Spielerinnenreport fachlich vollständig ausweisen
- Typ: `bug`
- Zielversion: `0.4.2`
- Status: `implemented`
- Priorität: `high`
- Beschreibung: Persönlicher Spielerinnenreport weist die vollständige Qualitätsverteilung einschließlich neutral/eingeschränkt und Aktionen ohne WIE aus. Eine individuelle Stärke darf nicht allein aus einer niedrigen Fehlerquote abgeleitet werden; Interpretationen und Tabellenwerte müssen rechnerisch konsistent sein.

### REPORT-PLAYER-LAYOUT1 – Persönlichen Spielerinnenreport auf A4 korrekt umbrechen
- Typ: `bug`
- Zielversion: `0.4.2`
- Status: `implemented`
- Priorität: `high`
- Beschreibung: Print-/PDF-Regression im persönlichen Spielerinnenreport korrigieren: alle Bereiche bleiben innerhalb der A4-Druckbreite, die Technik-Tabelle nutzt die volle Breite, rechte Spalten werden nicht abgeschnitten und ein Seitenumbruch erfolgt nur vertikal, wenn der Inhalt tatsächlich nicht auf eine Seite passt.

### UI-MATCH2 – Neuanlage eines Spiels verliert Eingabedaten bei Auswahl der Spiel-/Kaderart
- Typ: `bug`
- Zielversion: `0.4.2`
- Status: `implemented`
- Priorität: `high`
- Beschreibung: Regression in 0.4.2 RC2 korrigieren: Im Dialog „Neues Spiel“ bleibt die Auswahl der Spiel-/Kaderart lokaler Formularzustand. Sie darf vor „Spiel übernehmen“ keinen globalen Match-Wechsel, render() oder drawMatch() auslösen und dadurch Datum, Saison, eigenes Team oder Gegner leeren.

### SYNC-LOCK1 – Temporäre WebDAV-423-Locks robust behandeln
- Typ: `bug`
- Zielversion: `0.4.2`
- Status: `implemented`
- Priorität: `high`
- Beschreibung: Manuelle Nextcloud/WebDAV-Synchronisation wiederholt PUT-Anfragen bei HTTP 423 mit kurzen Wartezeiten, meldet einen verbleibenden Lock verständlich und vermeidet unveränderte Masterdata-PUTs. Bestehende ETag-/Session-Konfliktlogik bleibt erhalten.

### SCOUT-SCORE1 – Terminale Qualitätswerte schließen Rally und Spielstand automatisch ab
- Typ: `bug`
- Zielversion: `0.4.2`
- Status: `implemented`
- Priorität: `high`
- Beschreibung: Regression in 0.4.2 RC2 korrigieren: Ein eigenes '=' vergibt automatisch den Punkt an den Gegner, ein gegnerisches '=' an uns; '#' bleibt nur bei Aufschlag, Angriff und Block terminal. Terminale Aktionsresultate dürfen die Rally auch dann korrekt abschließen, wenn die Aufschlagseite unerwartet leer ist.

### SYNC-CLEANUP1 – Gelöschte Spiele auch physisch aus der Cloud entfernen
- Typ: `bug`
- Zielversion: `0.4.2`
- Status: `implemented`
- Priorität: `high`
- Beschreibung: Beim Entfernen aus der synchronisierten Spielbibliothek bleibt der Tombstone im Index erhalten, der zugehörige sessions/<matchId>-Ordner wird aber zusätzlich per WebDAV DELETE entfernt. Bereits als deleted markierte Einträge werden beim Laden der Cloud-Bibliothek best-effort bereinigt; Videos außerhalb der VolleyTakt-Sessiondaten werden nicht gelöscht.

### ANALYSIS-VIDEO2 – Aktionsidentität und Video-Timestamps korrekt darstellen
- Typ: `bug`
- Zielversion: `0.4.2`
- Status: `implemented`
- Priorität: `high`
- Beschreibung: Aktionsvideozeilen trennen Technik und Qualität eindeutig. Leere action_start_seconds fallen korrekt auf seconds zurück, fehlende Timestamps werden nicht als 0 interpretiert, sondern als nicht abspielbar gekennzeichnet. Jede Aktion behält ihre stabile Event-ID und individuelle Start-/Endzeit; Sortierung erfolgt nach Spiel, Satz und Aktionszeit.

### UI-NAV1 – Aufgabenorientierte Hauptnavigation
- Typ: `ui`
- Zielversion: `0.4.2`
- Status: `implemented`
- Priorität: `high`
- Beschreibung: Hauptnavigation in Spiel, Vorbereitung, Analyse, Daten, Hilfe und Einstellungen gliedern. Stammdaten/Kader sowie Kamera & Video unter Vorbereitung bündeln; Cloud & Synchronisation den Einstellungen zuordnen; Hilfe als eigenen Hauptmenüpunkt führen.

### UI-NAV2 – Zurück-Pfeil in Unteransichten
- Typ: `ui`
- Zielversion: `0.4.2`
- Status: `implemented`
- Priorität: `high`
- Beschreibung: Unteransichten der aufgabenorientierten Navigation erhalten oben links einen einheitlichen Zurück-Pfeil. Der Pfeil navigiert genau eine Ebene zurück; X schließt den gesamten Drawer. Navigationshistorie berücksichtigt z. B. Vorbereitung → Spielerinnen → Kader.

### UI-NAV3 – Alle Unteransichten in die Drawer-Navigation integrieren
- Typ: `bug`
- Zielversion: `0.4.2`
- Status: `implemented`
- Priorität: `high`
- Beschreibung: Videospeicher/Zuordnung, Spiel-/Kaderarten und Tastaturkürzel nutzen dieselbe Drawer-Historie wie die neue Hauptnavigation. Globaler Zurück-Pfeil geht genau eine Ebene zurück; lokale Zurück-Buttons bleiben kompatibel an dieselbe Aktion gekoppelt.

### UI-NAV3A – Videospeicher nutzt Drawer-Historie korrekt
- Typ: `bug`
- Zielversion: `0.4.2`
- Status: `implemented`
- Priorität: `high`
- Beschreibung: Vorbereitung → Videospeicher/Zuordnung wird über die zentrale Drawer-Navigation geöffnet. Der globale Zurück-Pfeil führt dadurch zur tatsächlich vorherigen Ebene (z. B. Vorbereitung oder Spiel). Der veraltete lokale „← Spiel“-Button wurde entfernt.

### UI-PLAYERS1 – Inaktive Spielerinnen anzeigen/ausblenden
- Typ: `bug`
- Zielversion: `0.4.2`
- Status: `implemented`
- Priorität: `high`
- Beschreibung: Der Button Inaktive anzeigen besitzt wieder eine Funktion, filtert die Spielerliste und wechselt seine Beschriftung zwischen Anzeigen/Ausblenden.

### DATA-MIGRATION1 – Migration/Backup darf App-Start bei knapper Browser-Quota nicht blockieren
- Typ: `bug`
- Zielversion: `0.4.2`
- Status: `implemented`
- Priorität: `high`
- Beschreibung: Migrationslogik plausibilisiert fehlende Schema-Marker, vermeidet unnötige 0→6-Migrationen bei frischen bzw. bereits Schema-6-Daten, hält nur eine vollständige Migrationssicherung vor und behandelt QuotaExceeded kontrolliert ohne Nutzdaten zu verändern. Reale Firefox/Android-Verifikation bleibt erforderlich.

### UI-ANALYSIS-DATE1 – Analysezeitraum automatisch konsistent halten
- Typ: `ui`
- Zielversion: `0.4.2`
- Status: `open`
- Priorität: `medium`
- Beschreibung: Wenn Von nach dem aktuell gesetzten Bis liegt, soll Bis automatisch auf heute bzw. bei zukünftigem Von auf denselben Tag gesetzt werden.