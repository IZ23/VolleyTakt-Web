# VolleyTakt Live 0.4.0 Preview19

Schwerpunkt: Rally-History, Spielbibliothek und i18n-Abschluss.

- FE-SCOUT7: monotone Rally-Nummer über Undo/Neuzweig mit persistiertem High-Water-Zähler.
- Scouting9: Papierkorb in der Spielbibliothek; lokal oder synchronisiert entfernen. Video-Dateien, Video-Referenzen und Speicherorte werden niemals gelöscht oder verändert.
- Synchronisierte Entfernung verwendet einen Tombstone im Bibliotheksindex, damit ein späterer normaler Sync den entfernten Eintrag nicht sofort wiederherstellt.
- I18N3: alle 429 bisherigen exakten Legacy-Übersetzungen sind in einen schlüsselbasierten Katalog überführt; der alte EXACT_EN-Katalog ist entfernt.
- Versionen und Offline-Cache auf 0.4.0 Preview19 aktualisiert.
