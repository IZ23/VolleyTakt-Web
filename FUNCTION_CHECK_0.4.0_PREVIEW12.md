# VolleyTakt Live 0.4.0 Preview12 – Funktionsgegencheck

- Basis: 0.4.0 Preview11; enthält damit sämtliche Preview11-Korrekturen.
- Redo stellt die letzte per Undo entfernte Transaktion wieder her.
- Mehrere Undo/Redo-Schritte sind möglich; ein neuer Protokolleintrag verwirft den Redo-Stack.
- DJI und GoPro werden im CameraService erst bei Auswahl/Verbindung dynamisch importiert.
- Kameraadapter bleiben als optionale Offline-Ressourcen cachebar, blockieren aber nicht die Service-Worker-Kerninstallation.
- Qualitätsbuttons, Legende und Detailbereiche sind separate Flow-Blöcke ohne Überlagerung.
