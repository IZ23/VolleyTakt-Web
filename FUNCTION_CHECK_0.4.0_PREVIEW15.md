# VolleyTakt Live 0.4.0 Preview15 – Funktionsgegencheck

## i18n
- Neues semantisches t(key, params)-API mit getrennten DE/EN-Katalogen.
- Fragment-/Substring-Fallback aus der Runtime entfernt; unbekannte Legacy-Texte werden nicht mehr wortweise verstümmelt.
- Bestehende exakte Übersetzungen bleiben über tr() kompatibel.
- Kritische bislang fehlerhafte Texte und neue Libero-Texte besitzen exakte Übersetzungen.
- Regressionstest prüft die bekannten Fragment-Kollisionen und das Key-/Placeholder-Verhalten.
