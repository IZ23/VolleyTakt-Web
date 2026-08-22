# Funktionsgegencheck – VolleyTakt Live 0.3.1 Preview 1

Ausgangsbasis: korrigierte 0.3.0 Preview 9.

Prüfpunkte:
- Fünfstufiger Workflow WER/WAS/WIE/WO/WOHIN.
- Own-serve preset P1 + Aufschlag, weiterhin korrigierbar.
- Aufschlagtechnik im detaillierten Profil.
- Basis =/-/0/+/# und DataVolley-nah =/-/!//+/#.
- Technikabhängige # Punktautomatik; = als Fehler.
- Einheitliches CSV-/Eventmodell inklusive serve_technique.
- Deutsch/Englisch Kurzbezeichnungen.
- Regression: 9-Zonen-Feld, Timestamps, DJI/GoPro/i18n.

## Testergebnis
- 0.3.1 Preview 1: 16/16
- Preview-8-Kernregression: 10/10
- Preview-9-Erweiterungsregression: 11/11
- Preview-9-Feldorientierung: 7/7
- DJI-Protokoll: OK
- GoPro-BLE: OK
- i18n: OK
- PHP-Syntax: OK

## UI-Korrektur p1c
- Responsive vergrößerte Technik- und Bewertungsbuttons gelten explizit in **einfacher und detaillierter Bewertung**.
- Einfache und detaillierte Bewertung verwenden dieselben responsiven UI-Größenregeln; es gibt keine profilabhängigen Größen-/Layout-State-Klassen. Unterschiede betreffen nur Inhalte und zusätzliche Eingabeschritte.
- Bewertungslegende ist in beiden Modi größer, zeilenweise und eingerückt.
- Cachekennung: `0.3.1-p1d`.
