# VolleyTakt Live 0.3.0 Preview 9 – Funktionsgegencheck

- Basis: korrigierte Preview 8.
- Aktionstimestamps: Start beim ersten WER-Touch, Ende beim Commit; beide Zeiten bleiben erhalten.
- Detailliertes Scouting: 3×3-Zonenmodell P4/P3/P2 – P7/P8/P9 – P5/P6/P1.
- P7–P9 sind ausschließlich Dokumentationszonen, nie WER-Spielerpositionen.
- Detaillierte Richtung: separates Zielfeld; Angriff/Aufschlag können Zielzone speichern, Gegnerangriff bleibt kompatibel.
- Detailliertes Zuspiel: FIVB Tempo 0–3, Passweite/-richtung sowie Ziel-/Angriffszone.
- CSV erweitert um action_start_*, action_end_*, set_tempo, set_distance.
- Korrigierte Feldorientierung: Gegner oberhalb des Netzes spiegelbildlich, eigenes Team unterhalb.
- P7–P9 vor WER nicht aktiv; Aktivierung erst als Dokumentationszone im Orts-/Zielschritt.
- Mittlere Zonen besitzen optische Halbflächenzuordnung zu den angrenzenden P1–P6-Grundpositionen.

- Hotfix Feldansicht: nur ein gemeinsames Netz zwischen Gegner/Wir; P7–P9 werden nach WER über selectedPlayerPos freigeschaltet; permanenter grauer Halbflächen-Schleier entfernt.
