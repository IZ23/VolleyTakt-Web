# VolleyTakt Live 0.4.0 Preview16 – Funktionsgegencheck

## Scouting / Rally
- WOHIN einer laufenden Rally wird als bekannte Ballposition gespeichert.
- Bei der nächsten Aktion derselben Zielseite wird diese Position automatisch als WO übernommen.
- Ungültige bzw. zur anderen Feldseite gehörende Ballpositionen werden nicht übernommen.
- Manueller Punkt Wir/Gegner schließt die Rally und löscht die bekannte Ballposition.

## Libero
- Persistierter Zustand unterstützt zwei Liberos je Team.
- Satzaufstellung und Reconstruction unterstützen weiterhin zwei Liberos.
- Spontanscouting hält Libero 1 und Libero 2 als auswählbare Libero-Spieler bereit.
- Libero-Workflow bleibt außerhalb des normalen WER/WAS/WIE/WO/WOHIN-Ablaufs.

## Version / UI
- Aktive Runtime und sichtbare UI: 0.4.0 Preview16.
- Service Worker: volleytakt-live-web-v0.4.0-preview16.
- Manifest und Update-Manifest: 0.4.0 Preview16.
- Keine aktive sichtbare Preview1–Preview15- oder „0.3 Preview“-Kennung in den zentralen Runtime-Dateien.

## i18n
- Substring-/Fragment-Fallback bleibt deaktiviert.
- Zusätzliche semantische Keys für Scouting-Status und Libero-Bedienung.
- Unbekannte Legacy-Texte bleiben weiterhin unverändert statt fehlerhaft gemischt übersetzt.

## Automatisierte Prüfungen
- 44 Node-/Regressionstests erfolgreich.
- JavaScript-Syntax aller aktiven Module geprüft.
- manifest.webmanifest und update-manifest.json gültig.
- PHP-Syntax von sync/nextcloud.php geprüft.
- ZIP-Integrität nach Erstellung geprüft.
