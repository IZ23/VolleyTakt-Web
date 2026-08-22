# Function Check – VolleyTakt Live 0.3.0 Preview 8

## Statisch geprüft
- Versions-/Cachekennung: 0.3.0 Preview 8 / 0.3.0-p8.
- JavaScript-Syntax aller Module einschließlich i18n und Locale-Dateien.
- Service Worker referenziert i18n- und Locale-Module für Offlinebetrieb.
- Deutsch/Englisch-Sprachumschaltung wird lokal gespeichert und ohne App-Neustart auf neu gerenderte sowie bestehende DOM-Texte angewendet.
- Browserdialoge (`alert`, `confirm`, `prompt`) werden durch die Sprachschicht übersetzt.
- `title`, `aria-label` und `placeholder` werden von der Sprachschicht berücksichtigt.
- Interne Aktionswerte, IDs, CSV-/Sessiondaten bleiben von der Anzeigeübersetzung unberührt.
- Bedienung & Hilfe: 2 Spalten auf breiten Ansichten, 1 Spalte <= 720 px.
- i18n-Katalog-Smoke-Test (`tests/i18n-test.mjs`) erfolgreich.
- DJI-Protokoll-Testvektor weiterhin erfolgreich.
- PHP-Syntax des WebDAV-Relays geprüft.

## Nicht durch diese Prüfung ersetzt
- echter Android-/Touch-Test
- echter DJI-BLE-Hardwaretest
- visueller Volltest jeder einzelnen Ansicht in beiden Sprachen
- produktiver Cloud-/WebDAV-Test

Die 0.3.0-To-do-Liste bleibt unabhängig von diesem Preview-Stand bestehen.
