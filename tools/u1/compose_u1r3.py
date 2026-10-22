"""U1 round 3: drawing / model comparison images for U1-C17 (trolley) and U1-C18 (headblock, spreader).

Usage: python3 -I tools/u1/compose_u1r3.py [--cap docs/evidence/U1/repair-r3/closeups] [--out docs/evidence/U1/repair-r3/comparison]
Inputs : J526A0200.pdf and J526A1200.pdf (read only, rendered at 300 dpi with PyMuPDF when installed, else pdftoppm),
         the orthographic model renders from tools/u1/capture_u1r3_model.mjs, the user's screenshots 14.png / 15.png.
Outputs: trolley-side-overlay.png, trolley-plan-overlay.png (drawing linework in blue over the faded model render; the
         drawing is scaled from its own printed dimensions: 2560 + 2260 and 900 + 900 measure 144.4 px per metre at
         300 dpi), headblock-pairs.png, before-after-14.png, before-after-15.png.
The overlays check horizontal positions (wheels, sheave shafts, buffers, equalizers, frame ends, rope tangents) and the
heights near the rail. The hoist display pose is lower than the drawing's upper-limit position (3427), so the falls and
the headblock do not coincide vertically by design; the cab follows the GA reading (U-22).
"""
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont, ImageOps

REPO = Path(__file__).resolve().parents[2]


def _opt(n, d):
    return sys.argv[sys.argv.index(n) + 1] if n in sys.argv else d


CAP = REPO / _opt("--cap", "docs/evidence/U1/repair-r3/closeups")
OUT = REPO / _opt("--out", "docs/evidence/U1/repair-r3/comparison")
OUT.mkdir(parents=True, exist_ok=True)
DPI = 300
try:
    FONT = ImageFont.truetype("arial.ttf", 22)
except OSError:
    try:
        FONT = ImageFont.truetype("DejaVuSans.ttf", 20)
    except OSError:
        FONT = ImageFont.load_default()


def page(pdf, n=1):
    path = REPO / "As-bulit drawing" / pdf
    try:
        import fitz  # PyMuPDF (used on the workstation)
        pix = fitz.open(str(path))[n - 1].get_pixmap(dpi=DPI)
        return Image.frombytes("RGB", (pix.width, pix.height), pix.samples)
    except ImportError:
        tmp = Path(tempfile.mkdtemp(prefix="eq-u1r3-"))
        subprocess.run(["pdftoppm", "-r", str(DPI), "-png", "-f", str(n), "-l", str(n), str(path), str(tmp / "p")], check=True)
        img = Image.open(next(tmp.glob("p*.png"))).convert("RGB")
        img.load(); shutil.rmtree(tmp, ignore_errors=True)
        return img


def overlay(drawing, centre_px, px_per_m, render, frame, title, out):
    """frame = (cx_m, cy_m, w_m, h_m) of the orthographic render; centre_px = drawing pixel of model point (x0_m, y0_m)."""
    (dx, dy), (mx, my) = centre_px
    rimg = Image.open(render).convert("RGB")
    W, H = rimg.size
    cx, cy, w, h = frame
    k = W / w  # render px per metre
    s = px_per_m / k  # drawing px per render px
    # render pixel of the model point, then the drawing region that maps onto the render frame
    rx, ry = (mx - (cx - w / 2)) * k, ((cy + h / 2) - my) * k
    box = (dx - rx * s, dy - ry * s, dx + (W - rx) * s, dy + (H - ry) * s)
    crop = drawing.crop(tuple(int(round(v)) for v in box)).resize((W, H), Image.LANCZOS)
    ink = ImageOps.invert(ImageOps.grayscale(crop)).point(lambda v: 255 if v > 90 else int(v * 2.2))
    base = Image.blend(rimg, Image.new("RGB", (W, H), "white"), 0.55)
    blue = Image.new("RGB", (W, H), (20, 60, 220))
    comp = Image.composite(blue, base, ink)
    d = ImageDraw.Draw(comp)
    d.rectangle([0, 0, W, 34], fill="white"); d.text((10, 6), title, fill="black", font=FONT)
    comp.save(out)


def pair(left, right, labels, out, h=520):
    ims = [Image.open(p).convert("RGB") if not isinstance(p, Image.Image) else p for p in (left, right)]
    ims = [im.resize((int(im.width * h / im.height), h), Image.LANCZOS) for im in ims]
    W = sum(im.width for im in ims) + 30
    canvas = Image.new("RGB", (W, h + 44), "white")
    x = 10
    d = ImageDraw.Draw(canvas)
    for im, lab in zip(ims, labels):
        canvas.paste(im, (x, 40)); d.text((x, 8), lab, fill="black", font=FONT); x += im.width + 10
    canvas.save(out)


A0200 = page("J526A0200.pdf")
sc = A0200.width / 2000.0  # crops were read on a 2000 px wide preview of the page
PXM = 144.4 * (A0200.width / 4963.0)  # measured: 2560 + 2260 / 900 + 900 dimension lines at 300 dpi
# side view: trolley centreline and rail top line (dimension 851 / 990 / 3427 base) in the 300 dpi page
side_c = (248 + 1060 * (A0200.width / 4963.0) * 1.0, 149 + 355)
overlay(A0200, ((side_c[0], side_c[1]), (70.0, 52.42)), PXM, CAP / "c17-trolley-side-ortho.png", (69.6, 50.6, 10, 6.43),
        "J526A0200 side view (blue) over model rev 4 side view from +Z: wheels 2370 / 2070, shafts 900 / 900, rope lines 2560 / 2260",
        OUT / "trolley-side-overlay.png")
# plan: centrelines of the plan view; drawing +Z direction taken downwards like the render (plan is symmetric about the centreline)
plan_c = (248 + 1057, 1191 + 742)
overlay(A0200, ((plan_c[0], plan_c[1]), (70.0, 0.0)), PXM, CAP / "c17-trolley-top-ortho.png", (69.6, 0.0, 11, 7.07),
        "J526A0200 plan (blue) over model rev 4 plan: rails 6300, sheave lanes 2600, equalizers, body 1840 / 1540",
        OUT / "trolley-plan-overlay.png")
# headblock: drawing views side by side with the matching orthographic renders (pairs, not overlays)
A1200 = page("J526A1200.pdf")
s12 = A1200.width / 2000.0
front = A1200.crop((int(120 * s12), int(100 * s12), int(1010 * s12), int(500 * s12)))
endv = A1200.crop((int(1010 * s12), int(80 * s12), int(1470 * s12), int(480 * s12)))
pair(front, CAP / "c18-spreader-end-ortho.png", ["J526A1200 front view (5440 / 5200)", "Model rev 4 from the waterside (headblock 5440, spreader 40 ft)"], OUT / "headblock-front-pair.png")
pair(endv, CAP / "c18-spreader-side-ortho.png", ["J526A1200 end view (2090, 1010, 970, 950)", "Model rev 4 along the rails (headblock, spreader end-on)"], OUT / "headblock-end-pair.png")
U1 = REPO / "docs/evidence/U1"
pair(U1 / "14.png", CAP / "c17-trolley-top-ls.png", ["User screenshot 14.png (round 2 model)", "Model rev 4, similar viewpoint"], OUT / "before-after-14-trolley.png")
pair(U1 / "15.png", CAP / "c18-spreader-waterside.png", ["User screenshot 15.png (round 2 model)", "Model rev 4, similar viewpoint (from the waterside)"], OUT / "before-after-15-spreader.png", h=400)
print("written:", sorted(p.name for p in OUT.glob("*.png")))
