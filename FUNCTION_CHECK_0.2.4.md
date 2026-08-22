# VolleyTaktLive Web 0.2.4 – Funktionsgegencheck

## Statisch geprüft

- JavaScript-Syntax aller Module.
- PHP-Syntax des WebDAV-Relays.
- Service-Worker- und Modul-Cachekeys einheitlich `0.2.4`.
- Manifest-/Asset-Referenzen vorhanden.
- DJI-Protokoll-Testvektor gegen DJIs publizierten Mode-Switch-Frame.
- Fix5-Wechsel-/Libero-Codepfade in 0.2.4 enthalten.
- Wechselzeilen vollständig klickbar, Liberos separat gruppiert.
- ETag-Kette Relay → sync.js vorhanden.

## Auf echter Hardware zu prüfen

- Chrome/Android Web-Bluetooth-Geräteauswahl und DJI-Handshake.
- Aufnahme Start/Stop mit frischem Statusfeedback.
- GATT-Reconnect nach realem Funkabbruch.
- Near-Realtime-Sync und Lease/ETag mit zwei realen Geräten.
- Touchlayout auf Galaxy Tab S9+ und S23 Ultra.

- Modularer Kamerazweig geprüft: DJI Osmo + GoPro HERO10+ (Open GoPro BLE); Hardwaretest GoPro noch ausstehend.
