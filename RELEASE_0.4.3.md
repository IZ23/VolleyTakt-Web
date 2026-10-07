# VolleyTakt Live 0.4.3

## Schwerpunkt

0.4.3 ergänzt die durchgängige Mehrsprachigkeit bereits vor dem Start der App. Nutzer können auf der Vorschaltseite zwischen **DE** und **EN** wechseln. Die Auswahl wird in die Scouting-App übernommen und lokal gespeichert.

## Neu

- DE/EN-Umschalter oben rechts auf der Vorschaltseite.
- Sofortige Übersetzung der Starttexte und Browser-/Web-Bluetooth-Hinweise.
- Übergabe der gewählten Sprache an die komplette App.
- Unterstützung von `?lang=de` und `?lang=en` für sprachspezifische Links, z. B. von `volleytakt.de` bzw. `volleytakt.de/en/`.
- Erster Aufruf ohne Vorgabe verwendet die Browsersprache; Deutsch bleibt für deutschsprachige Browser Standard, andere Browser starten auf Englisch.

## Kompatibilität

- Datenschema: **6**
- Keine Migration der Match-, Stamm- oder Cloud-Daten.
- Bestehende 0.4.2-Daten bleiben kompatibel.
- Die Spracheinstellung kann weiterhin unter **Einstellungen → Sprache** geändert werden.

## Lizenz

PolyForm Perimeter License 1.0.1.
