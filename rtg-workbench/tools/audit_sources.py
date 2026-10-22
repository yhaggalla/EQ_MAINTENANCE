"""Read-only source audit. Outputs are confined to rtg-workbench/evidence."""
from pathlib import Path
import hashlib, json, subprocess
import fitz

ROOT = Path(__file__).resolve().parents[1]
REPO = ROOT.parent
OUT = ROOT / 'evidence' / 'sources'
OUT.mkdir(parents=True, exist_ok=True)
register = []
for index, path in enumerate(sorted((REPO / 'RTG drawings').rglob('*'))):
    if not path.is_file(): continue
    sid = 'M13' if path.name == 'user manual (mechanical part).pdf' else 'M14'
    row = dict(id=sid, file=str(path.relative_to(REPO)), bytes=path.stat().st_size,
               sha256=hashlib.sha256(path.read_bytes()).hexdigest())
    if path.suffix.lower() == '.pdf':
        doc = fitz.open(path)
        row.update(pages=len(doc), metadata=doc.metadata)
        folder = OUT / sid
        folder.mkdir(exist_ok=True)
        pages = []
        for i, page in enumerate(doc):
            text = page.get_text()
            pages.append(dict(pdfPage=i+1, textCharacters=len(text), width=page.rect.width, height=page.rect.height))
            (folder / f'p{i+1:03}.txt').write_text(text, encoding='utf-8')
        row['pageInventory'] = pages
        selected = [1,12,13,14,15,16,17,20,21,22,23,24,25,26,27,28] if sid == 'M14' else [1,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28]
        for number in selected:
            page = doc[number-1]
            page.get_pixmap(matrix=fitz.Matrix(2,2), alpha=False).save(folder / f'p{number:03}.png')
        doc.close()
    register.append(row)
(OUT / 'source-register.json').write_text(json.dumps(register, indent=2), encoding='utf-8')
print(json.dumps([{k:v for k,v in x.items() if k not in ('pageInventory','metadata')} for x in register], indent=2))
