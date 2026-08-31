# VolleyTakt Live 0.4.0 RC2 – Funktionsgegencheck

- Basis ist das vollständige 0.4.0 RC1 ZIP.
- FE-UI10 verändert ausschließlich die Darstellung von Quick-Scout-Feldzellen in kompaktem Touch-Landscape; Court-Zonenarrays bleiben unverändert.
- Standard-Quick-Kürzel P1–P6 werden im kompakten Landscape unterdrückt; benutzerdefinierte Kürzel und Trikotnummern bleiben darstellbar.
- Desktop/Fine-Pointer-Darstellung ist von FE-UI10 nicht betroffen.
- FE-SCOUT7: `rallyHighWater` bleibt nach Undo/Rekonstruktion erhalten und der nächste neue Rally-Zweig verwendet `max(rallyCounter, rallyHighWater)+1`.
- Persistierte High-Water-Werte werden beim Laden numerisch normalisiert.
- Aktive Runtime-, UI-, Manifest-, Service-Worker- und Asset-Kennungen stehen auf 0.4.0 RC2.
