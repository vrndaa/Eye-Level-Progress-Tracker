#!/usr/bin/env python3
"""Generate src/data/registry.json from the FIC Registry Excel sheet.

The app reads registry.json through src/data/dataSource.js. When the source
sheet changes, re-run this to regenerate the data — the UI never changes.

Usage:
    python scripts/build-registry.py [path/to/FIC_Registry_POC_data.xlsx]

Requires: pandas, openpyxl  (pip install pandas openpyxl)
"""
import sys, json, math
from pathlib import Path
import pandas as pd

SHEET = 'FIC Registry (POC data)'
PWA_ROOT = Path(__file__).resolve().parents[1]
# Prefer a copy checked into the app; fall back to the Desktop project folder.
_local = PWA_ROOT / 'FIC_Registry_POC_data.xlsx'
DEFAULT_XLSX = _local if _local.exists() else PWA_ROOT.parent / 'FIC_Registry_POC_data.xlsx'
OUT = PWA_ROOT / 'src' / 'data' / 'registry.json'


def clean(v):
    if v is None:
        return None
    if isinstance(v, float) and math.isnan(v):
        return None
    s = str(v).strip()
    return s or None


def build(xlsx_path):
    df = pd.read_excel(xlsx_path, sheet_name=SHEET)
    teachers = list(dict.fromkeys(df['Teacher'].dropna().astype(str)))
    times = sorted(df['Time'].dropna().astype(str).unique(),
                   key=lambda t: int(t.split(':')[0]))

    sessions = []
    for teacher in teachers:
        for slot in times:
            sub = df[(df['Teacher'].astype(str) == teacher) &
                     (df['Time'].astype(str) == slot)]
            students = []
            for si, (name, rows) in enumerate(sub.groupby('Student', sort=False)):
                first = rows.iloc[0]
                grade = clean(first['Grade']) or '—'
                note = clean(first['Notes'])
                fic_rows = rows[rows['Strand / Workbook (FIC)'].notna()]
                unmatched = len(fic_rows) == 0
                # A "no FIC match" note describes the unmatched state, not a hand-match.
                note_out = None if unmatched or (note and 'no FIC match' in note) else note
                fics = [{
                    'id': f'{teacher}|{slot}|{si}|{fj}',
                    'program': clean(r['Program']) or 'English',
                    'code': clean(r['Strand / Workbook (FIC)']),
                    'detail': clean(r['Detail']) or '',
                    'cleared': clean(r['Status']) == 'Cleared',
                } for fj, (_, r) in enumerate(fic_rows.iterrows())]
                students.append({
                    'id': f'{teacher}|{slot}|{si}',
                    'name': str(name),
                    'grade': grade,
                    'note': note_out,
                    'unmatched': unmatched,
                    'fics': fics,
                })
            sessions.append({'teacher': teacher, 'slot': slot, 'students': students})

    return {
        'SESSION_DATE': 'Wed, Jul 1',
        'SLOTS': times,
        'TEACHERS': teachers,
        'sessions': sessions,
    }


def main():
    xlsx = Path(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_XLSX
    data = build(xlsx)
    OUT.write_text(json.dumps(data, indent=2, ensure_ascii=False))
    n_stud = sum(len(s['students']) for s in data['sessions'])
    n_fic = sum(len(st['fics']) for s in data['sessions'] for st in s['students'])
    print(f'wrote {OUT.relative_to(Path.cwd()) if OUT.is_relative_to(Path.cwd()) else OUT}')
    print(f'teachers={data["TEACHERS"]} slots={data["SLOTS"]}')
    print(f'sessions={len(data["sessions"])} students={n_stud} fics={n_fic}')


if __name__ == '__main__':
    main()
