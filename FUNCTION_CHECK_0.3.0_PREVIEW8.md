# Function Check – VolleyTakt Live 0.3.0 Preview 8

Ausgangsbasis: unveränderte 0.3.0 Preview 7.

## Preview-8-Kern
- Eingabezustände WER → WAS → WIE → WO.
- WER löst die aktuelle Position sofort auf eine stabile player_id auf.
- player_rotation_position und action_zone werden getrennt gespeichert.
- Bis vor WO kann die Spielerposition weiter korrigiert werden; im Zustand WO bedeutet P1–P6 ausschließlich Aktionszone.
- Außenrahmen kennzeichnet WER, Innenrahmen WO, Kombination ergibt Doppelrahmen.
- Temporäre Aktionsanzeige zeigt z. B. P4 · Angriff · + · P3.
- Gegner-Angriff behält target_zone/attack_to separat von action_zone.
- Rally-Kontextfelder rally_phase und transition_no ergänzt; daraus wird keine K2/K3-Grundformation abgeleitet.
- Bedienhilfe und Einführung auf die neue Eingabelogik aktualisiert.
- CSV enthält die neuen Felder player_rotation_position, action_zone, target_zone, rally_phase und transition_no.

## Prüfungen
- JavaScript-Syntax aller Module.
- vorhandene DJI-, GoPro- und i18n-Tests.
- Versions-/Cachekennungen auf 0.3.0 Preview 8 / 0.3.0-p8.
- ZIP-Integrität.
