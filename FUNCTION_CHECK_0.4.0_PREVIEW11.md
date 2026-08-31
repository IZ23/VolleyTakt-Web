# VolleyTakt Live 0.4.0 Preview11 – Funktionsgegencheck

- Basis: 0.4.0 Preview10
- Aufschlag = und # schließen ohne verpflichtendes WO ab.
- Annahme, Zuspiel und Angriff erlauben P1–P9 als WO-Dokumentationszonen.
- Zuspiel und Angriff erlauben WOHIN auf eigener und gegnerischer Feldseite; target_side wird gespeichert.
- Zielmarkierung ist an target_side + target_zone gekoppelt.
- Feldorientierung zeigt den tatsächlichen UI-Zustand und ist während laufender Aktion sichtbar deaktiviert.
- Scoutingaktion + automatischer Punkt + automatische Rotation teilen transaction_id.
- Undo arbeitet bevorzugt transaktionsweise und fällt für Alt-Daten auf event_group zurück.
