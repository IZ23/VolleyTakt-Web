# VolleyTakt Live 0.4.2 RC2

RC2 baut auf dem letzten 0.4.2-RC1-Stand auf. Datenschema bleibt **6**, Release-Kanal `preview`.

## Schwerpunkt: optionaler Videoschnitt / VolleyVideo-Worker

- neuer Bereich **Einstellungen → Videoschnitt** nach dem Provider-Prinzip der Cloud-Einstellungen
- erster Anbieter: **VolleyVideo-Worker** mit Aktivierung, LAN-/Serveradresse, lokalem API-Token, Verbindungstest und Capability-Anzeige
- Worker bleibt vollständig optional; Analyse, Filter, Aktionsauswahl, virtuelle Playlist und Schnittlistenexport funktionieren unverändert ohne Worker
- getrennte `playbackSource` und `processingSource` bei Videozuordnungen; bestehende `storageType`/`reference`-Daten bleiben kompatibel
- YouTube bleibt vollständig als Wiedergabequelle erhalten; der physische Schnitt verwendet ausschließlich eine Worker-erreichbare Processing-Quelle
- serverneutrales `VideoCutManifest` **1.1** mit `selectionContext`, `sourceId`, `start`, `end`, `order`, globalem Vor-/Nachlauf und Ausgabeprofil
- Dateiname wird aus dem Auswahlkontext vorgeschlagen, ist editierbar und wird auf einen sicheren Basename begrenzt
- API-Client für `/api/v1/health`, `/capabilities`, `/jobs`, Jobstatus und Ergebnisdownload
- Worker-API muss `apiVersion = 1` melden
- Jobstatus wird lokal verfolgt; VolleyTakt bleibt während des Renderns normal bedienbar
- Bearer-Token und Worker-Adresse bleiben ausschließlich in lokalen App-Einstellungen und werden nicht in Matchdaten, Cloud-Sync, Analyseexporte oder Manifest serialisiert
- Netzwerkfehler des Workers bleiben lokal auf den Videoschnitt begrenzt; Hinweise auf HTTPS, CORS und privaten LAN-Zugriff sind integriert

## Bedienablauf

Analyse → Aktionen filtern/auswählen → **Aus Auswahl Video erzeugen** → Vor-/Nachlauf und Dateiname festlegen → Job an VolleyVideo-Worker senden → Status verfolgen → MP4 herunterladen.

Ist Videoschnitt deaktiviert oder der Worker nicht erreichbar, bleiben die bestehenden Analyse- und Videofunktionen unverändert verfügbar.

## Technische Daten

- Version: `0.4.2 RC2`
- Version-ID: `0.4.2-rc2`
- Datenschema: `6`
- Manifest-Schema für Videoschnitt: `1.1`
- Lizenz: PolyForm Perimeter License 1.0.1

## Verifikation

Automatisierte statische und fachliche Regressionstests wurden erweitert. Eine reale End-to-End-Verifikation gegen den produktiven VolleyVideo-Worker im LAN/VPN und die Browser Chrome, Firefox und Samsung Browser ist noch erforderlich.
