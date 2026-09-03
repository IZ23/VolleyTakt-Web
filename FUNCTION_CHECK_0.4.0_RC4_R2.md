# Funktionscheck 0.4.0 RC4-r2

## Automatisch geprüft
- JavaScript-Syntax: 24/24 Runtime-JavaScript-Dateien fehlerfrei.
- Neuer Regressionstest `tests/rc4r2-fe-ui13-ui14-scout9-test.mjs`: bestanden.
- Versionskennung RC4-r2 in App, Startseite, Manifest und Service-Worker-Cache geprüft.
- FE-UI13: Buttontext `VolleyTakt Live`, zentrierende CSS-Regel und Web-Bluetooth-Hinweiscontainer vorhanden.
- FE-UI14: Spielanlage ist konditional; `Neues Spiel` öffnet den Editor, `Abbrechen` verwirft ihn ohne State-Neuanlage.
- FE-SCOUT9: abgebrochener Spontanscout-Start liefert `false` und setzt den sichtbaren Schalter auf den tatsächlichen State zurück.

## Praxistest empfohlen
- Firefox/Linux: technischer Web-Bluetooth-Hinweis + zentrierter Button.
- Einstellungen → Spiel: Bibliothek zunächst ohne Eingabefelder; `Neues Spiel` blendet die Anlage innerhalb der Bibliothek ein; `Abbrechen` verändert kein laufendes Spiel.
- Laufendes Spiel mit Protokolleinträgen: `Spontan scouten` aktivieren → Rückfrage `Abbrechen` → Schalter bleibt AUS und bestehendes Spiel unverändert.
