# Funktionscheck 0.4.0 RC4-r1

## FE-SCOUT8
- Start-Gate enthält „Spontan scouten“.
- Spontanscouting ist sofort positionsbasiert nutzbar.
- Vor dem ersten gespeicherten Ereignis wird kein Spielbibliotheks-Archiv erzeugt und keine Live-Session synchronisiert.
- Beim ersten gespeicherten Ereignis wird der temporäre Zustand materialisiert.

## FE-UI11
- Gegner-Schalter funktioniert im Spontanscouting unmittelbar.
- Der Schalter erklärt per Tooltip seine Funktion bzw. seinen noch nicht verfügbaren Zustand.

## FE-UI12
- Spielkarten sind kompakter.
- Die Liste hat eine begrenzte Höhe und scrollt vertikal unabhängig vom restlichen Spiel-Menü.

## Feldansicht
- Spontanscouting zeigt außerhalb der WOHIN-/Zielauswahl nur eine Feldhälfte.
- Wir/Gegner-Umschaltung verändert nicht die gespeicherten Positionsarrays.
- Detailliertes P1–P9-Raster aus RC3 bleibt mit drei gleich hohen Reihen erhalten.

## Regression
- JavaScript-Syntaxprüfung erfolgreich.
- Gesamter statischer Regressionstest-Satz inklusive RC4-Prüfung erfolgreich.
