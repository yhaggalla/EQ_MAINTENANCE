"""P00 helper: render one drawing PDF page (optionally a fractional crop) to PNG.

Usage: python -X utf8 tools/p00/render_drawing_page.py <pdf> <page 1-based> <dpi> <out.png> [x0 y0 x1 y1]
Crop values are fractions of the page width/height. Read-only on the source PDF.
"""
import sys, fitz
from pathlib import Path
# usage: render.py file.pdf page(1-based) dpi out.png [x0 y0 x1 y1 fractions]
f, page, dpi, out = sys.argv[1], int(sys.argv[2]), int(sys.argv[3]), sys.argv[4]
d = fitz.open(f); p = d[page-1]
clip = None
if len(sys.argv) > 5:
    x0,y0,x1,y1 = map(float, sys.argv[5:9]); r = p.rect
    clip = fitz.Rect(r.x0 + x0*r.width, r.y0 + y0*r.height, r.x0 + x1*r.width, r.y0 + y1*r.height)
pix = p.get_pixmap(dpi=dpi, clip=clip)
pix.save(out); print(out, pix.width, pix.height)
