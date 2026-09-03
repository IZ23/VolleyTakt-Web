# VolleyTakt Live 0.4.0 RC4-r2

Release-Candidate-Revision auf Basis des vollständigen RC4-r1. RC4-r2 präzisiert das technische Einstiegsfenster (FE-UI13), integriert die neue Spielanlage in die Spielbibliothek (FE-UI14) und korrigiert den Abbruchzustand des Spontanscouting-Schalters (FE-SCOUT9).

Weitere Details: `RELEASE_0.4.0_RC4_R2.md` und `FUNCTION_CHECK_0.4.0_RC4_R2.md`.

---

# VolleyTakt Live 0.4.0 Preview7

Modularisierungs-Preview: Undo-Gruppierung und Zustandsrekonstruktion aus dem Eventstrom wurden in `js/scouting/history.js` ausgelagert. Sichtbares Verhalten und persistiertes Datenformat sollen unverändert bleiben.

---

# VolleyTakt Live 0.4.0 Preview3

Vierte Stufe der Modularisierung: Scouting-Eventaufbau und die Normalisierung aktionsspezifischer Eventfelder liegen jetzt in `js/scouting/events.js`. Rally-, Capture-, Daten- und UI-Verhalten sollen gegenüber Preview3 unverändert bleiben.

Weitere Details: `RELEASE_0.4.0_PREVIEW3.md` und `FUNCTION_CHECK_0.4.0_PREVIEW3.md`.

---

# VolleyTakt Live 0.4.0 Preview2

Modularisierungs-Preview auf Basis von 0.4.0 Preview1. Sichtbares Verhalten und persistiertes Datenformat sollen unverändert bleiben.

## Modularisierung Preview2
- DOM-freie Scouting-Erfassungslogik in `js/scouting/scouting.js`
- WER → WAS → WIE → optionale Details → WO → WOHIN erzeugt einen internen `ActionDraft`
- P1–P6 bleiben WER-Positionen; P7–P9 sind ausschließlich detaillierte Dokumentationszonen
- direkter Gegneraufschlag und eigener Aufschlag-Preset bleiben erhalten
- Aufschlagtechnik und Zuspieldetails sind Teil des Scouting-Capture-Moduls
- Rally-ID, K1/K2/K3, Eventbau, automatische Punkte, Rotation, Undo und Persistenz bleiben bewusst außerhalb des Scouting-Moduls
- UI, Touch/Tastatur-Routing, Analyse, Kamera, Storage und Sync fachlich unverändert
- kein neues Datenschema / keine Datenmigration

# VolleyTakt Live 0.3.2 Preview2-r7 rebuild3-fix2

Browserbasierte, offline-first Volleyball-Scouting-App.

## Schwerpunkt dieser Preview

- Spielbibliothek als gemeinsame Sicht auf lokale und Cloud-Spiele
- automatische lokale Speicherung und Nachsynchronisation bei wiederkehrender Online-Verbindung
- gespeicherte Spiele laden, fortsetzen, prüfen und gezielt analysieren
- Videospeicher: lokal, Cloud oder YouTube
- persistente Videozuordnung je Spiel
- individueller Scouting↔Video-Timestamp-Abgleich je Video
- modularer DJI-/GoPro-Kameraadapter mit Verbindungsstatus und Akkuanzeige
- GitHub-Release-Updateprüfung mit Bestätigung, Datensicherung und Migrationsrahmen
- korrigierte einfache/detaillierte Spielfeldlogik und stabile Orientierung während einer Aktion

## Offline-first

Die lokale Arbeitskopie ist führend. Scouting, bereits lokal vorhandene Spiele und Stammdaten bleiben ohne Internet nutzbar. Bei wieder verfügbarer Verbindung kann die konfigurierte Synchronisation nachziehen.

## Versionierung

Dieser Stand ist **nicht als GitHub-Release veröffentlicht** und zeigt deshalb überall die interne Versionskennung **0.3.2 Preview2-r7 rebuild3-fix2**.

## Update und Datenmigration

Ein bestätigtes Update ersetzt die App-Version, nicht die Nutzerdaten. Vor einer erforderlichen Schema-Migration wird eine lokale Sicherung angelegt. Stammdaten, Einstellungen, Spielbibliothek, Spiele und Videozuordnungen werden übernommen und – soweit erforderlich – versionsgesteuert migriert.

## Kamera

Unterstützte Adapter:
- DJI Osmo Action (aktueller R-SDK/BLE-Adapter: Osmo Action 4, Osmo Action 5 Pro, Osmo Action 6, Osmo 360)
- GoPro HERO über Open GoPro BLE (u. a. HERO9–HERO13 Black)

Nach Aufnahme-Stopp bleibt die Kameraverbindung aktiv. Akku wird in der Oberfläche in einem ca. 12-Sekunden-Rhythmus aktualisiert. Die angezeigte Verbindungsqualität ist eine aus Statusalter, Fehlern und Wiederverbindungen abgeleitete Qualitätsanzeige; Web Bluetooth stellt keine allgemein portable RSSI-Anzeige bereit.


### Kamera-Korrektur Preview2-r1
Bluetooth-Diagnose wird nur nach einem fehlgeschlagenen Verbindungsversuch eingeblendet und nach erfolgreicher Verbindung wieder verborgen. DJI und GoPro verwenden eine gemeinsame Statusanzeige; GoPro fragt den Hintergrundstatus im konfigurierten 10–15-s-Rhythmus ab, DJI liefert Status als Kamera-Push. Die Akkuanzeige wird kompakt als Batteriesymbol mit Prozentwert dargestellt.


### Kameraauswahl Preview2-r2
In der Auswahl werden nur noch die Kamerafamilien **DJI Osmo Action** und **GoPro HERO** angezeigt. Ein Info-Button direkt an der Auswahl zeigt die unterstützten Modellfamilien/Protokolle kompakt an; die ausführlichere Kompatibilitätsbeschreibung bleibt in der Hilfe/Dokumentation.


### Spielbibliothek Preview2-r3
`Neues Spiel` erzeugt sofort eine neue stabile `matchId` und speichert das neue Spielobjekt lokal. Videozuordnungen sind deshalb sofort möglich. Zusätzlich besitzt jeder Eintrag der Spielbibliothek einen `🎬 Video`-Button; Videos können dort ergänzt oder bearbeitet werden, ohne das Spiel als aktives Scouting fortzusetzen. Bei aktiver Nextcloud/WebDAV-Synchronisation wird die geänderte Spiel-/Videozuordnung nach online synchronisiert.


### Kamerakompatibilität Preview2-r4
Die Hilfe nennt jetzt die konkreten Modelle hinter den vereinfachten Familiennamen:

- DJI R-SDK/BLE: Osmo Action 4, Osmo Action 5 Pro, Osmo Action 6, Osmo 360. Action 2 und Osmo Action 3 sind mit diesem Adapter nicht kompatibel.
- GoPro Open GoPro BLE (HERO): HERO9 Black, HERO10 Black, HERO11 Black, HERO11 Black Mini, HERO12 Black, HERO13 Black.
- Die offizielle Open-GoPro-Kompatibilität umfasst darüber hinaus weitere Geräte wie LIT HERO, MAX 2 und MISSION 1 / MISSION 1 Pro; diese werden aktuell nicht als eigene VolleyTakt-Kamerafamilie angeboten.
