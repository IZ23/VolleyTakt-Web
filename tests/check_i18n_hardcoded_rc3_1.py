from pathlib import Path
import re
ROOT=Path(__file__).resolve().parents[1]
app=(ROOT/'js/app.js').read_text(encoding='utf-8')
messages=(ROOT/'js/locales/messages.js').read_text(encoding='utf-8')
sw=(ROOT/'sw.js').read_text(encoding='utf-8')
# High-risk user-visible areas that previously regressed must now be key-driven.
forbidden=[
    "const DV_QUALITY_MEANINGS=",
    "Kameraunterstützung verfügbar':'Keine Kameraunterstützung",
    "<label>Anbieter</label>",
    "<label>Server / WebDAV-URL</label>",
    "<label>Benutzer</label>",
    "<label>App-Passwort</label>",
    ">Jetzt synchronisieren</button>",
    ">Lokale Zeit Start / Pause / Fortsetzen</button>",
    "<h3>Bluetooth-Diagnose</h3>",
    "modal(id?'Spielerin bearbeiten':'Spielerin anlegen'",
    "modal(id?'Team bearbeiten':'Team anlegen'",
    "modal(id?'Saison bearbeiten':'Saison anlegen'",
]
for item in forbidden:
    if item in app:
        raise SystemExit(f'hard-coded high-risk UI text/pattern remains: {item}')

for item in [
    "<label>Bezeichnung <input",
    "Team und Saison auswählen.",
    ">Kader speichern</button>",
    "Neue stabile Version ${latest} verfügbar.",
    "settings.ui.language==='en'?'Data':'Daten'",
    "settings.ui.language==='en'?'GitHub release':'GitHub-Release'",
]:
    if item in app:
        raise SystemExit(f'hard-coded RC3_1 UI text/pattern remains: {item}')

# Stable German semantic identifiers are intentionally allowed in data-model constants,
# but their user-facing labels must be mapped through the volleyball locale domain.
for key in ['volleyball.attack','volleyball.reception','volleyball.serve','volleyball.block','volleyball.dig','volleyball.set']:
    if key not in app and key not in (ROOT/'js/locales/domains/volleyball.js').read_text(encoding='utf-8'):
        raise SystemExit(f'missing volleyball locale key: {key}')
if 'actionLabel(a)' not in app:
    raise SystemExit('technique buttons are not localized through actionLabel')
if "quality.${ACTION_KEY_PART[action]" not in app:
    raise SystemExit('detailed quality meanings are not localized through keys')
# Offline PWA must cache every modular locale domain imported by messages.js.
for rel in ['ui','analysis','reports','report-phrases','match','runtime','shell','forms','camera','sync','volleyball']:
    asset=f"./js/locales/domains/{rel}.js"
    if asset not in sw:
        raise SystemExit(f'locale domain missing from service-worker cache: {asset}')
print('RC3_1 hard-coded UI/i18n architecture audit passed.')
