# VolleyTakt Live 0.4.3.2

Security-Patch auf Basis von 0.4.3.1.

## Behoben
- Stored/imported XSS in Analyse-Renderern und Importpfaden
- WebDAV-Relay-Härtung gegen Traversal, Header-Injection, Origin-/Content-Type-Missbrauch und Rate-Limit-Inode-Spraying
- CSP/HSTS/Permissions-Policy
- exakte YouTube-Hostprüfung und HTTPS-only Browser-Videoquellen
- HTTPS-only Worker (HTTP nur Loopback)
- verbleibende Kamera-/Worker-i18n-Texte

## Kompatibilität
- Datenschema 6
- keine Migration erforderlich
- kompatibel zu 0.4.3/0.4.3.1
