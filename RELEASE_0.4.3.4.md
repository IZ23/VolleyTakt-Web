# VolleyTakt Live 0.4.3.4

## UI-SCOUT-UNDO1

**Nicht-modale Undo/Redo-Rückmeldung im Protokollbereich**

Nach Undo und Redo zeigt VolleyTakt Live für ca. drei Sekunden direkt im unteren Protokollbereich eine fachlich verständliche Zusammenfassung der betroffenen Aktion. Die Rückmeldung ist nicht modal, nicht fokussierbar und blockiert keine Scouting-Eingabe.

Unterstützt werden insbesondere Technikaktionen, Punkte inklusive automatischer Rotation, Wechsel, Libero-Wechsel und Spielstandskorrekturen. Bei nicht eindeutig beschreibbaren Eventgruppen wird auf „letzte Eingabe“ / „last entry“ zurückgefallen.

Redo bleibt nach Undo sofort verfügbar. Wird nach einem Undo eine neue Aktion erfasst, leert die vorhandene `appendEvent(...)`-Logik den Redo-Stack vor dem Speichern der neuen Aktion.

Datenschema: **6** (unverändert). Keine Migration erforderlich.
