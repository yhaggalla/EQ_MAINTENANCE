"""P00 check of reference/drawing-register.json against the actual drawing folder.

Recomputes SHA-256 and PDF page counts (PyMuPDF), lists files present on disk
but absent from the register (and vice versa) and extracts the drawing numbers
printed in each page's text layer where one exists. Read-only on sources.

Usage: python -I tools/p00/verify_drawing_register.py [--out report.json]
"""
from __future__ import annotations

import hashlib
import json
import re
import sys
from pathlib import Path

import fitz  # PyMuPDF

ROOT = Path(__file__).resolve().parents[2]
DRAW = ROOT / "As-bulit drawing"
REG = ROOT / "documents" / "prompt-pack" / "reference" / "drawing-register.json"
NUM = re.compile(r"J526A[0-9M]{2,4}(?:-[0-9]{1,3})?")


def main(argv: list[str]) -> int:
    out = Path(argv[argv.index("--out") + 1]) if "--out" in argv else None
    reg = json.loads(REG.read_text(encoding="utf-8"))
    on_disk = {p.name: p for p in DRAW.iterdir() if p.is_file()}
    pdfs = {n for n in on_disk if n.lower().endswith(".pdf")}
    reg_files = {f["file"] for f in reg["files"]}
    rows, mismatches = [], []
    total_pages = 0
    for f in reg["files"]:
        p = on_disk.get(f["file"])
        if p is None:
            mismatches.append(f"missing on disk: {f['file']}")
            continue
        sha = hashlib.sha256(p.read_bytes()).hexdigest()
        doc = fitz.open(p)
        pages = doc.page_count
        total_pages += pages
        nums_per_page = []
        for i in range(pages):
            txt = doc[i].get_text()
            nums = sorted(set(NUM.findall(txt)))
            nums_per_page.append(nums[:6])
        doc.close()
        if sha != f["sha256"]:
            mismatches.append(f"sha256 differs: {f['file']}")
        if pages != f["pdfPages"]:
            mismatches.append(f"page count differs: {f['file']} disk={pages} reg={f['pdfPages']}")
        rows.append({"file": f["file"], "pages": pages, "shaOk": sha == f["sha256"],
                     "textLayerDrawingNumbers": nums_per_page})
    extra = sorted(n for n in on_disk if n not in reg_files)
    unregistered_pdfs = sorted(pdfs - reg_files)
    report = {
        "registerPdfFileCount": reg["pdfFileCount"],
        "registerPdfPageCount": reg["pdfPageCount"],
        "diskPdfCount": len(pdfs),
        "computedPageCount": total_pages,
        "mismatches": mismatches,
        "nonRegisteredFilesOnDisk": extra,
        "unregisteredPdfs": unregistered_pdfs,
        "files": rows,
    }
    print(f"PDFs on disk: {len(pdfs)} (register {reg['pdfFileCount']}); pages {total_pages} (register {reg['pdfPageCount']})")
    print(f"checksum/page mismatches: {len(mismatches)}")
    for m in mismatches:
        print("  " + m)
    print("non-PDF / unregistered files on disk: " + ", ".join(extra))
    if out:
        out.write_text(json.dumps(report, indent=2, ensure_ascii=False), encoding="utf-8")
    ok = not mismatches and len(pdfs) == reg["pdfFileCount"] and total_pages == reg["pdfPageCount"] and not unregistered_pdfs
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
