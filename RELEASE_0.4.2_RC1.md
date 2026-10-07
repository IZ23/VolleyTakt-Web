# VolleyTakt Live 0.4.2 RC1

Release Candidate 1 für den 0.4.2-Zweig. Grundlage ist der vollständige GitHub-Stand 0.4.1 final; Datenschema bleibt 6.

## Neu in RC1

- **ANALYSIS-VIDEO2:** Technik und Qualität sind in Aktionslisten eindeutig getrennt. Leere Startzeitfelder fallen auf den echten gespeicherten Aktionszeitpunkt zurück; fehlt eine belastbare Zeit vollständig, wird kein 00:00-Clip erzeugt. Mehrere Aktionen derselben Spielerin behalten ihre individuellen Start-/Endzeiten und Event-IDs.
- **SYNC-CLEANUP1:** Beim synchronisierten Löschen wird nach dem Bibliotheks-Tombstone der zugehörige VolleyTakt-Sessionordner per WebDAV `DELETE` entfernt. Bereits als gelöscht markierte Altordner werden beim Laden der Cloud-Bibliothek best-effort aufgeräumt. Verknüpfte Videoquellen außerhalb des Sessionordners bleiben unangetastet.

- **SCOUT-SCORE1:** Terminale Qualitätswerte schließen Rally und Spielstand wieder zuverlässig automatisch ab. Eigenes `=` führt zu Punkt Gegner, gegnerisches `=` zu Punkt Wir; `#` bleibt nur bei Aufschlag, Angriff und Block automatisch punktentscheidend.
- **SYNC-LOCK1:** HTTP-423-Locks bei Nextcloud/WebDAV-PUTs werden mit kurzen Retries behandelt; unveränderte Masterdata-Dateien werden nicht erneut geschrieben. Bleibt ein Lock bestehen, erscheint eine verständliche Meldung.
- **UI-MATCH2:** Im Dialog „Neues Spiel“ löst die Auswahl der Spiel-/Kaderart keinen globalen Match-Wechsel mehr aus. Datum, Saison, eigenes Team, Gegner und weitere Formulareingaben bleiben bis „Spiel übernehmen“ erhalten.
- **ANALYSIS-ACTIONS1:** neue Ansicht „Aktionen & Video“ auf Basis des gewählten Analysezeitraums und der vorhandenen Filter. Treffer werden nach erfolgreich (`#`, `+`), neutral/eingeschränkt und fehlerhaft (`-`, `=`) gruppiert.
- **VIDEO2 / ANALYSIS-VIDEO1:** browserfähige Videozuordnungen (insbesondere YouTube bzw. HTTP(S)-Referenzen) können für Einzelaktionen und als virtuelle Aktionsplaylist mit Start-/End-Timestamps abgespielt werden. Auch bestehende Analyse-Detailansichten erhalten einen Video-Drilldown auf die zugrunde liegenden gefilterten Aktionen.
- **VIDEO3 (teilweise):** Aktions-/Schnittlisten können als JSON oder CSV exportiert werden. Ein physischer MP4-Zusammenschnitt aus lokalen Großvideos ist in RC1 noch nicht umgesetzt.
- **ANALYSIS-PLAYER-REPORT1:** persönlicher Spielerinnenreport je Spielerin und Analysezeitraum; individuelle Technik-/Qualitäts- und Rotationsauswertung, vollständige Begriffserklärungen, PDF/Druck, Text, PNG und native Teilen-Funktion.
- **ANALYSIS-PLAYER-REPORT2:** Korrektur des persönlichen Reports: neutrale/eingeschränkte Qualitätswerte und Aktionen ohne WIE werden explizit ausgewiesen; die Qualitätsverteilung bleibt vollständig nachvollziehbar. Eine niedrige Fehlerquote ohne positive Aktionen wird nicht mehr als „Stärke“ bezeichnet.
- **REPORT-SHARE3:** Erkennung geeigneter Touch-Tablets für Web Share erweitert, damit Android-Tablets mit `navigator.share` nicht allein wegen Desktop-/Tablet-UA vom Teilen ausgeschlossen werden. Auf Samsung Galaxy Tab S9+ wurde die Funktion inzwischen real verifiziert; der Share-Dialog öffnet sich.
- **REPORT-PLAYER-LAYOUT1:** persönlicher Spielerinnenreport erhält eine eigene A4-Druckkomposition: volle Seitenbreite für Kernwerte und Technik-Tabelle, definierte Spaltenbreiten, keine horizontal abgeschnittenen Bereiche; bei echtem Platzmangel nur sauberer vertikaler Seitenumbruch.
- **UI-REPORT2:** Report-Auswahldialog gegenüber der ersten RC1-Erstellung wieder kompakt und harmonisch gestaltet. Bei zu geringer Viewport-Höhe bleibt der Dialograhmen im Viewport; ausschließlich der mittlere Kachelbereich scrollt und erhält eine sichtbare vertikale Bildlaufleiste.

## Technische Hinweise

- Version: `0.4.2 RC1`
- Version-ID: `0.4.2-rc1`
- Kanal: `preview`
- Datenschema: `6` (unverändert)
- Kein automatisches Herunterladen oder Neu-Zusammenschneiden von Streamingvideos.
- Lokale Videozuordnungen, die nur einen Dateinamen enthalten, bleiben in der Schnittliste enthalten, können im Browser aber nicht ohne browserfähige Datei-/URL-Referenz direkt abgespielt werden.

## Verifikation

Automatisierte Prüfungen und neue Regressionstests werden mit dem GitHub-Paket ausgeliefert. Die Share-Funktion wurde vom Anwender auf einem Samsung Galaxy Tab S9+ real verifiziert. Weitere Browser-/Gerätekombinationen wurden durch die Build-Erstellung nicht real geprüft.


## RC1-Korrekturstand · Schnellstart / Ersteinführung (12.09.2026)
- `UI-ONBOARD1` umgesetzt/erweitert: Schnellstart und Ersteinführung beginnen mit Spontan-Scouting; Hilfe bietet Sprungmarken für Sofort-Scouting, reguläre Spielvorbereitung und typische Fallstricke.
- Geführte Ersteinführung erklärt die Reihenfolge Stammdaten → Spielanlage → Satzvorbereitung → Aufschlagrecht → optional Video → Scouting → Rallyende.
- Schnellstart vom Startscreen und bei nicht eingerichtetem Spiel direkt erreichbar.
- Eigener Abschnitt „Typische Fallstricke“ ergänzt; bestehende Detailhilfe bleibt erhalten.
## Korrekturstand 12.09.2026 – Navigation

- `UI-NAV1`: Hauptnavigation neu strukturiert in Spiel, Vorbereitung, Analyse, Daten, Hilfe und Einstellungen.
- Vorbereitung bündelt Spielerinnen, Teams, Saisons, Kader sowie Kamera & Video.
- Cloud & Synchronisation ist Bestandteil der Einstellungen.
- Hilfe ist ein eigenständiger Hauptmenüpunkt.
- `UI-MOBILE-IOS2` wurde auf Wunsch ausdrücklich nicht umgesetzt.


## Korrekturen dieses RC1-Stands
- `UI-NAV2`: Zurück-Pfeil in Unteransichten.
- `UI-SCOUT-QUALITY2`: Qualitätsbuttons wieder in stabiler 3×2-Geometrie ohne Überlagerung; `-/=` bleiben unter `+/#`, die dritte Zelle unten bleibt frei.
- `UI-ONBOARD1`: robuste Schnellstart-/Tour-Navigation und kompaktere Vorschaltseite nach Tour-Entscheidung.
- `UI-MOBILE-IOS2` bleibt unverändert außerhalb dieses RC1-Auftrags.


## RC1-Korrekturstand · Navigation, Mobile und Scouting-Semantik (19.09.2026)
- `UI-NAV3`: Videospeicher/Zuordnung, Spiel-/Kaderarten und Tastaturkürzel vollständig in die Drawer-Historie integriert; der globale Zurück-Pfeil führt jeweils genau eine Ebene zurück.
- `UI-NAV3A`: Vorbereitung → Videospeicher/Zuordnung ist vollständig an die Drawer-Historie angebunden; Zurück führt zur realen vorherigen Ebene, der lokale „← Spiel“-Button wurde entfernt.
- `UI-PLAYERS1`: „Inaktive anzeigen“ funktioniert wieder als echter Filter und schaltet zwischen Anzeigen/Ausblenden.
- `UI-MOBILE-IOS1`: Visual-Viewport-/Safe-Area-Härtung für iOS/Safari ergänzt; reale Geräteverifikation bleibt offen.
- `UI-MOBILE10`: Startscreen-Aktionen bleiben auch bei kurzen mobilen Browser-Viewports sichtbar/erreichbar; reale Geräteverifikation bleibt offen.
- `SCOUT-DATA1`: Aktionsqualität/-wirkung und Rally-Ergebnis besitzen explizit getrennte semantische Felder im Eventmodell, bei Rückwärtskompatibilität der bisherigen Felder.
- `SCOUT-K3`: K3 wird im Live-Scouting explizit aus Gegner-Angriff → eigener Block/Abwehr erkannt und mit Trigger/Transitionnummer gespeichert.
- `UI-SCOUT-QUALITY2`: nach realer Nutzerprüfung geschlossen.

## RC1-Korrekturstand · Datenmigration / Firefox-Start (20.09.2026)
- `DATA-MIGRATION1`: fehlende Schema-Marker werden bei frischen bzw. bereits Schema-6-Daten plausibilisiert, damit keine unnötige 0→6-Migration startet.
- Migration hält nur noch eine vollständige Sicherung in LocalStorage vor; alte Update-/Migrationsbackups werden vor einer erforderlichen Migration als Speicherreserve entfernt.
- `QuotaExceededError` beim Anlegen der Migrationssicherung wird kontrolliert behandelt; Nutzdaten bleiben unverändert und die App-Initialisierung bricht nicht mehr mit technischem Stacktrace ab.
- Reale Verifikation auf Firefox/Android bleibt erforderlich; Chrome/Firefox besitzen getrennte Browserdatenbestände.
