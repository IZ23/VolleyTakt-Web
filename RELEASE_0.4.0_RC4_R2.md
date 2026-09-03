# VolleyTakt Live 0.4.0 RC4-r2

Basis: vollständiges `0.4.0 RC4-r1` ZIP.

## Änderungen
- FE-UI13: technisches Einstiegsfenster präzisiert. Der einzige Einstiegsbutton heißt `VolleyTakt Live` und ist zentriert. Die Seite dient weiterhin nur dem technischen Web-Bluetooth-/Browser-Hinweis vor dem Öffnen der Anwendung.
- FE-UI14: Spielanlage in die Spielbibliothek integriert. Die Eingabefelder für Datum, Saison, Teams, Spielart und Spielmodus sind standardmäßig eingeklappt und erscheinen erst nach `Neues Spiel`.
- FE-UI14: `Abbrechen` schließt die Spielanlage ohne ein neues Spiel anzulegen oder das laufende Spiel zu ersetzen.
- FE-SCOUT9: Wird die Rückfrage zum Start eines neuen Spontanscoutings abgebrochen, springt der Schalter zuverlässig in seinen vorherigen Zustand zurück; Match und Protokoll bleiben unverändert.
- Versions-, Manifest- und Service-Worker-Kennungen auf RC4-r2 aktualisiert.

## Unverändert
- Scouting-/Positionslogik, P1–P9-Geometrie, Undo/Redo und bestehende Spielbibliothekseinträge.
- Web Bluetooth bleibt browser-/plattformabhängig; das Einstiegsfenster zeigt lediglich die technische Verfügbarkeit/Hinweise an.
