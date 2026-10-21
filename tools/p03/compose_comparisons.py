"""P03: compose aligned drawing/model comparison images.

Usage: python -I -X utf8 tools/p03/compose_comparisons.py
Inputs : tools/p03/alignment.json, the J526A00 PDF (read-only), artifacts/p03-captures/model-<view>.png
Outputs: docs/evidence/P03/comparison/<view>-overlay.png and <view>-pair.png, perspective-photo-pair.png, site-photo-closeups.png
The model renders were made with the same pixel frame as the drawing crop (alignment.json), so the overlay is a
direct check of rail origin, scale and silhouette. Drawing linework is drawn in blue over a faded model render.
"""
import json
import sys
from pathlib import Path

import fitz
from PIL import Image, ImageDraw, ImageFont, ImageOps

REPO = Path(__file__).resolve().parents[2]
A = json.loads((REPO / "tools/p03/alignment.json").read_text(encoding="utf-8"))
CAP = REPO / "artifacts/p03-captures"
OUT = REPO / "docs/evidence/P03/comparison"
OUT.mkdir(parents=True, exist_ok=True)

try:
    FONT = ImageFont.truetype("arial.ttf", 22)
    FONT_S = ImageFont.truetype("arial.ttf", 16)
except OSError:
    FONT = FONT_S = ImageFont.load_default()

doc = fitz.open(str(REPO / A["pdf"]))
pix = doc[A["page"] - 1].get_pixmap(dpi=A["dpi"])
page = Image.frombytes("RGB", (pix.width, pix.height), pix.samples)


def caption(img, text, sub=None):
    h = 34 + (24 if sub else 0)
    out = Image.new("RGB", (img.width, img.height + h), "white")
    out.paste(img, (0, h))
    d = ImageDraw.Draw(out)
    d.text((10, 6), text, fill="#0b2a45", font=FONT)
    if sub:
        d.text((10, 34), sub, fill="#556270", font=FONT_S)
    return out


def overlay(drawing, model):
    g = ImageOps.grayscale(drawing)
    mask = g.point(lambda v: 255 if v < 150 else 0)  # drawing linework
    base = Image.blend(Image.new("RGB", model.size, "white"), model.convert("RGB"), 0.55)
    blue = Image.new("RGB", model.size, "#0b3fd1")
    base.paste(blue, (0, 0), mask)
    return base


def mark_ref(img, ref_xy, crop):
    d = ImageDraw.Draw(img)
    x, y = ref_xy[0] - crop[0], ref_xy[1] - crop[1]
    d.line([(x - 18, y), (x + 18, y)], fill="#e07000", width=3)
    d.line([(x, y - 18), (x, y + 18)], fill="#e07000", width=3)
    return img


written = []
for view, v in A["views"].items():
    crop = v["crop"]
    drawing = page.crop(tuple(crop))
    model_path = CAP / f"model-{view}.png"
    if not model_path.exists():
        sys.exit(f"missing {model_path}; run tools/p03/capture.mjs first")
    model = Image.open(model_path).convert("RGB")
    if model.size != drawing.size:
        sys.exit(f"{view}: model {model.size} != drawing crop {drawing.size}")
    ov = mark_ref(overlay(drawing, model), v["ref"], crop)
    scale = 0.5
    ov_s = ov.resize((int(ov.width * scale), int(ov.height * scale)), Image.LANCZOS)
    f1 = OUT / f"{view}-overlay.png"
    caption(ov_s, f"{v['title']} - overlay", "Blue = J526A00 p1 linework (400 dpi); faded = model v1 render in the same frame; orange cross = origin reference (" + v["refNote"] + ")").save(f1, optimize=True)
    d_s = mark_ref(drawing.copy(), v["ref"], crop).resize(ov_s.size, Image.LANCZOS)
    m_s = mark_ref(model.copy(), v["ref"], crop).resize(ov_s.size, Image.LANCZOS)
    if ov_s.width > ov_s.height:  # stack vertically for wide views
        pair = Image.new("RGB", (ov_s.width, ov_s.height * 2 + 10), "white"); pair.paste(d_s, (0, 0)); pair.paste(m_s, (0, ov_s.height + 10))
    else:
        pair = Image.new("RGB", (ov_s.width * 2 + 10, ov_s.height), "white"); pair.paste(d_s, (0, 0)); pair.paste(m_s, (ov_s.width + 10, 0))
    f2 = OUT / f"{view}-pair.png"
    caption(pair, f"{v['title']} - drawing and model", "Drawing J526A00 p1 (first) and model v1 render (second), identical scale and origin").save(f2, optimize=True)
    written += [f1, f2]

# perspective vs appearance photo (appearance reference only, not a dimensional alignment)
photo = Image.open(REPO / "documents/images2.jpg").convert("RGB")
model = Image.open(CAP / "model-persp-photo-angle.png").convert("RGB")
h = 520
p_s = photo.resize((int(photo.width * h / photo.height), h), Image.LANCZOS)
m_s = model.resize((int(model.width * h / model.height), h), Image.LANCZOS)
pair = Image.new("RGB", (p_s.width + m_s.width + 10, h), "white"); pair.paste(p_s, (0, 0)); pair.paste(m_s, (p_s.width + 10, 0))
f3 = OUT / "perspective-photo-pair.png"
caption(pair, "Appearance: supplied CICT photo (documents/images2.jpg) and model v1 from a similar quay-level angle", "Paint and arrangement reference only; the photo is not a dimensional source. Logos/text panels are omitted in the model.").save(f3, optimize=True)
written.append(f3)
# close-ups against the later site photos (appearance only: house, walkways/stairs, trolley, cabin, headblock/spreader)
site = [("Image_20261021165846.jpg", "persp-house-closeup", "machinery house: light enclosure on a red deck, red stairs/handrails"),
        ("Image_20261021165637.jpg", "persp-trolley-closeup", "headblock and spreader yellow (crane 01); trolley and cabin")]
tiles = []
for photo_name, cap_name, note in site:
    ph = Image.open(REPO / "documents" / photo_name).convert("RGB")
    md = Image.open(CAP / f"model-{cap_name}.png").convert("RGB")
    p_s = ph.resize((int(ph.width * h / ph.height), h), Image.LANCZOS)
    m_s = md.resize((int(md.width * h / md.height), h), Image.LANCZOS)
    t = Image.new("RGB", (p_s.width + m_s.width + 10, h), "white"); t.paste(p_s, (0, 0)); t.paste(m_s, (p_s.width + 10, 0))
    tiles.append(caption(t, f"documents/{photo_name} and model v1", note))
sheet = Image.new("RGB", (max(t.width for t in tiles), sum(t.height for t in tiles) + 10 * (len(tiles) - 1)), "white")
y = 0
for t in tiles:
    sheet.paste(t, (0, y)); y += t.height + 10
f4 = OUT / "site-photo-closeups.png"
caption(sheet, "Appearance close-ups: site photos supplied 21 Oct 2026 and model v1", "Paint and arrangement reference only; photos are not dimensional sources. Logos and text panels are omitted in the model.").save(f4, optimize=True)
written.append(f4)
for name in ["persp-overall", "persp-technical"]:
    src = CAP / f"model-{name}.png"
    f = OUT / f"{name}.png"
    caption(Image.open(src).convert("RGB"), "Model v1 perspective, " + ("Overall mode" if name.endswith("overall") else "Technical mode (machinery house transparent, internals and location markers)")).save(f, optimize=True)
    written.append(f)
print("\n".join(str(p.relative_to(REPO)) for p in written))
