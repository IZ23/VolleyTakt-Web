#!/usr/bin/env python3
from pathlib import Path
import re, sys
ROOT=Path(__file__).resolve().parents[1]
msg=(ROOT/'js/locales/messages.js').read_text(encoding='utf-8')
legacy=(ROOT/'js/locales/legacy-messages.js').read_text(encoding='utf-8')
i18n=(ROOT/'js/i18n.js').read_text(encoding='utf-8')

def block(name,next_name=None):
    start=msg.index(f'export const {name}=')
    end=msg.index(f'export const {next_name}=',start) if next_name else len(msg)
    return msg[start:end]

de=block('MESSAGES_DE','MESSAGES_EN')
en=block('MESSAGES_EN')
key_re=re.compile(r"['\"]([a-zA-Z0-9_.-]+)['\"]\s*:")

legacy_de=legacy[legacy.index('export const LEGACY_MESSAGES_DE='):legacy.index('export const LEGACY_MESSAGES_EN=')]
legacy_en=legacy[legacy.index('export const LEGACY_MESSAGES_EN='):]
de_keys=set(key_re.findall(de))|set(key_re.findall(legacy_de)); en_keys=set(key_re.findall(en))|set(key_re.findall(legacy_en))
errors=[]
if de_keys!=en_keys:
    only_de=sorted(de_keys-en_keys); only_en=sorted(en_keys-de_keys)
    if only_de: errors.append('Keys only in DE: '+', '.join(only_de))
    if only_en: errors.append('Keys only in EN: '+', '.join(only_en))

# semantic keys used by t('...') or data-i18n-* must exist in both languages
used=set()
for p in ROOT.rglob('*'):
    if p.suffix not in {'.js','.html'} or 'tests' in p.parts: continue
    s=p.read_text(encoding='utf-8',errors='ignore')
    used.update(re.findall(r"\bt\(\s*['\"]([a-zA-Z0-9_.-]+)['\"]",s))
    used.update(re.findall(r"data-i18n(?:-title|-aria|-placeholder)?-key=['\"]([a-zA-Z0-9_.-]+)['\"]",s))
missing=sorted(k for k in used if k not in de_keys or k not in en_keys)
if missing: errors.append('Used semantic keys missing in catalogue: '+', '.join(missing))

# Every legacy bridge must resolve to a real key in both catalogs.
bridge_src=legacy[legacy.index('export const LEGACY_KEY_BY_DE='):legacy.index('export const LEGACY_MESSAGES_DE=')]
bridge=dict(re.findall(r"['\"]([^'\"]+)['\"]\s*:\s*['\"]([a-zA-Z0-9_.-]+)['\"]", bridge_src))
missing_bridge=sorted({v for v in bridge.values() if v not in de_keys or v not in en_keys})
if missing_bridge: errors.append('Legacy bridge targets missing: '+', '.join(missing_bridge))

# Known current visible strings that historically drifted must be covered by semantic key or legacy bridge.
known=[
 'Zurück','Schließen','Einführung','Menü öffnen','Geräteauswahl','Anzahl Sätze','Aktuelles Spiel','Neues Spiel','Letzter Satz','Protokoll löschen','Unterstützte Modelle','Bitte Gerät ins Querformat drehen','Eigenes Team · detailliertes Scouting','Gegner · detailliertes Scouting','Keine Synchronisation','Wird nur angezeigt, weil die letzte Kameraverbindung nicht erfolgreich war.'
]
covered_de_values=set(re.findall(r"['\"][a-zA-Z0-9_.-]+['\"]\s*:\s*['\"]([^'\"]+)['\"]",de))
for text in known:
    if text not in bridge and text not in covered_de_values:
        errors.append(f'Known visible string lacks coverage: {text}')

# Prevent regression to broad substring translation in i18n implementation.
if re.search(r"\.includes\s*\(",i18n) or re.search(r"\.split\s*\([^\n]+\)\s*\.join\s*\(",i18n):
    errors.append('i18n.js contains broad includes/split-join translation logic')

# Simple static German UI drift heuristic: quoted strings containing typical UI words in app/index
# must be either known dynamic legacy translations, semantic values, or explicitly whitelisted technical/status content.
# This is intentionally conservative to avoid IDs/debug/data-value false positives.
visible_sources=[ROOT/'index.html',ROOT/'js/app.js']
ui_word=re.compile(r'\b(Schließen|Zurück|Einführung|Geräteauswahl|Anzahl Sätze|Aktuelles Spiel|Neues Spiel|Letzter Satz|Protokoll löschen|Unterstützte Modelle|Keine Synchronisation)\b')
for p in visible_sources:
    s=p.read_text(encoding='utf-8')
    for m in ui_word.finditer(s):
        # covered via semantic catalog/legacy bridge is enough during migration
        phrase=next((x for x in known if x in s[max(0,m.start()-80):m.end()+80]),None)
        if phrase and phrase not in bridge and phrase not in covered_de_values:
            errors.append(f'Potential untranslated UI drift in {p.name}: {phrase}')

if errors:
    print('i18n coverage/drift check FAILED')
    for e in errors: print(' -',e)
    sys.exit(1)
print(f'i18n coverage/drift check OK: {len(de_keys)} DE / {len(en_keys)} EN keys; {len(used)} semantic keys referenced; {len(bridge)} legacy bridges checked.')
