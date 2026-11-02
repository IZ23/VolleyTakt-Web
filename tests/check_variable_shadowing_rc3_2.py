#!/usr/bin/env python3
from pathlib import Path
import re
ROOT=Path(__file__).resolve().parents[1]
errors=[]

for path in ROOT.joinpath('js').rglob('*.js'):
    src=path.read_text(encoding='utf-8')
    imported=[]
    for m in re.finditer(r'import\s*\{([^}]*)\}\s*from',src,re.S):
        for part in m.group(1).split(','):
            part=part.strip()
            if not part:
                continue
            imported.append(part.split(' as ')[-1].strip())
    for name in imported:
        esc=re.escape(name)
        patterns=[
            rf'\b(?:const|let|var)\s+{esc}\b',
            rf'\b(?:map|filter|find|forEach|some|every|reduce)\(\s*{esc}\s*=>',
            rf'\(\s*{esc}\s*\)\s*=>',
            rf'\bfunction\s+[A-Za-z_$][\w$]*\s*\([^)]*(?:\(|,)\s*{esc}\s*(?:,|\))',
        ]
        if any(re.search(p,src) for p in patterns):
            errors.append(f'{path.relative_to(ROOT)} shadows imported identifier {name!r}')

app=(ROOT/'js/app.js').read_text(encoding='utf-8')
ui=(ROOT/'js/analysis/ui.js').read_text(encoding='utf-8')
required=[
    ('team list uses descriptive callback', 'master.teams.map(teamRow=>' in app),
    ('team editor uses teamRecord', 'function editTeam(id){const teamRecord=' in app),
    ('rotation transition uses rotationState', 'const rotationState=rotationTransition' in app),
    ('lineup transition uses lineupTransition', 'const lineupTransition=setLineupTransition' in app),
    ('protocol row uses rowEl', "const rowEl=document.createElement('tr')" in app),
    ('analysis actions avoid t callback', 'actions.map(actionName=>' in ui),
]
for label,ok in required:
    if not ok: errors.append(label)
for forbidden in ['master.teams.map(t=>','const t=team(','const t=id?team(','const t=rotationTransition(','const t=setLineupTransition(','const tr=document.createElement(\'tr\')','actions.map(t=>']:
    if forbidden in app or forbidden in ui:
        errors.append(f'forbidden shadowing pattern remains: {forbidden}')

if errors:
    raise SystemExit('RC3_2 variable-shadowing audit failed:\n- '+'\n- '.join(errors))
print('RC3_2 variable-shadowing audit passed: no imported identifiers are re-bound locally.')
