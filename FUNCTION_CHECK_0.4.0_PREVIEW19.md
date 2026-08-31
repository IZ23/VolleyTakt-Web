# VolleyTakt Live 0.4.0 Preview19 – Funktionsgegencheck

## Rally / History
- Rally-Nummern besitzen einen persistenten High-Water-Zähler.
- Undo darf den sichtbaren Spielzustand zurücksetzen, aber nicht die höchste bereits vergebene Rally-Nummer.
- Nach einem neuen Zweig wird die nächste noch nie vergebene Rally-Nummer verwendet.

## Spielbibliothek
- Papierkorb je nicht aktivem Spiel vorhanden.
- Auswahl: nur auf diesem Gerät / aus synchronisierter Bibliothek entfernen.
- Synchronisierte Entfernung setzt einen Bibliotheks-Tombstone.
- Zugeordnete Videos werden weder gelöscht noch verschoben noch verändert.

## i18n
- 429 bisherige exakte Legacy-Texte sind über stabile Schlüssel in DE/EN-Katalogen abgebildet.
- Der alte EXACT_EN-Laufzeitkatalog wurde entfernt.
- Unbekannte Texte werden weiterhin nicht über unsichere Teilstring-Ersetzungen übersetzt.

## Prüfungen
- Preview19-Regressionsprüfung für Rally-High-Water, Bibliotheksentfernung und i18n-Key-Migration.
