# VolleyTakt Live 0.4.0 RC4-r1

Basis: vollständiger Stand 0.4.0 RC3.

## Änderungen
- FE-SCOUT8: direkter Einstieg „Spontan scouten“ auf der Startseite. Das Spontanscouting wird zunächst als temporärer Matchzustand geführt; erst das erste gespeicherte Scouting-Ereignis materialisiert den Eintrag in der Spielbibliothek und gibt ihn für die Live-Synchronisation frei.
- FE-UI11: der Schalter „Gegner“ ist im Spontanscouting sofort als Umschalter der zu scoutenden Seite nutzbar und erhält einen erklärenden Hinweis. Außerhalb eines bereiten Spiels erklärt der Tooltip den noch nicht verfügbaren Zustand.
- FE-UI12: kompaktere Spielbibliothek mit flacheren Einträgen, kleineren Aktionen und eigenem vertikal begrenztem Scrollbereich.
- Feldansicht: Spontanscouting startet mit genau einer Feldhälfte. Das Umschalten Wir/Gegner wechselt die aktive Feldseite, ohne eine zweite Feldhälfte dauerhaft einzublenden. Eine Dual-Feldansicht bleibt nur für fachlich erforderliche Zielauswahl erhalten.
- Versions-, Manifest- und Service-Worker-Kennung auf 0.4.0 RC4-r1 angehoben.
