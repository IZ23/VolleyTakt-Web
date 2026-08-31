# VolleyTakt Live 0.4.0 Preview16

Stabilisierung des Scoutingablaufs auf Basis von Preview15.

## Änderungen

- Libero-Workflow weiter stabilisiert:
  - bis zu zwei Liberos bleiben im Satz-/Persistenzzustand erhalten,
  - Spontanscouting führt Libero 1 und Libero 2 als verfügbare Libero-Spieler,
  - Libero-Auswahl, Rücktausch und Libero-gegen-Libero bleiben getrennt vom normalen WO/WOHIN-Scouting.
- Ballpositionskette innerhalb einer laufenden Rally:
  - ein gespeichertes WOHIN wird als bekanntes WO der unmittelbar folgenden Aktion übernommen,
  - nur wenn Zielseite und nächste gescoutete Seite zusammenpassen und die Zone für die Aktion zulässig ist,
  - bei Aktionen mit Zielwahl springt der Ablauf direkt zu WOHIN.
- Manueller Punkt beendet die Rally vollständig; die geerbte Ballposition wird dabei verworfen.
- Versionskonsistenz auf 0.4.0 Preview16 für aktive Runtime, sichtbare UI, Manifest, Update-Manifest, Service Worker, Asset-Revisionen und Tests.
- i18n-Nacharbeit mit zusätzlichen semantischen Sprachschlüsseln für Scouting- und Libero-Statusmeldungen.
- Regressionstest für Ballpositionsvererbung, Rallyende, Doppel-Libero und Versionskonsistenz ergänzt.

## Nicht Bestandteil

- UX1 (tatsächliche taktische Spielposition/Laufwege) bleibt für >0.5 vorgemerkt.
- Scouting9 (Spiel aus Bibliothek entfernen) bleibt offen.
- Vollständige Migration aller Legacy-Texte auf semantische i18n-Schlüssel bleibt ein weiterer Ausbaupunkt.
