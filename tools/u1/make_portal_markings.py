"""U1-C76 (D5): portal tie-beam and leg markings texture for the QC model.

Usage: python -I -X utf8 tools/u1/make_portal_markings.py
Writes assets/models/source/cict-j526a-sts/textures/portal-markings.png (2048 x 512 RGBA, white on transparent) and
portal-number-blank.png (256 x 160, fully transparent placeholder).
Rows (80 px per metre on the beam): row A (y 0-160) = tie-beam face seen with the waterside on the left (-Z face),
row B (y 176-336) = face seen with the landside on the left (+Z face). The crane number is NOT in the artwork: the
viewer draws the selected crane's number on the separate crane-number decal (user answer 12 Nov 2026); the gap between
the no-smoking text and the SWL lines is where it goes.
Lettering is generated (Arial Bold). The ZPMC plate is a separate texture, zpmc-plate.png, made from documents/zpmc flag.jpg.
Text from the cover photo layout and J526A00 p1 particulars (SWL 65t under spreader, 75t under cargo beam).
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

OUT = Path(__file__).resolve().parents[2] / "assets/models/source/cict-j526a-sts/textures/portal-markings.png"
W, H, ROW = 2048, 512, 160
img = Image.new("RGBA", (W, H), (255, 255, 255, 0))
d = ImageDraw.Draw(img)
big = ImageFont.truetype("arialbd.ttf", 118)
mid = ImageFont.truetype("arialbd.ttf", 34)
small = ImageFont.truetype("arialbd.ttf", 26)
WHITE = (255, 255, 255, 255)


def row(y0, panel_left):
    # blocks along the beam: no-smoking text, "01", SWL lines, plain panel (order mirrored for the other face)
    def smoke(x): d.text((x, y0 + 80), "SMOKING IS STRICTLY PROHIBITED", font=small, fill=WHITE, anchor="lm")
    def num(x): pass  # crane number: drawn by the viewer for the selected crane
    def swl(x):
        d.text((x, y0 + 52), "SWL UNDER SPREADER", font=mid, fill=WHITE, anchor="lm"); d.text((x + 470, y0 + 52), "65T", font=mid, fill=WHITE, anchor="lm")
        d.text((x, y0 + 108), "SWL UNDER CARGO BEAM", font=mid, fill=WHITE, anchor="lm"); d.text((x + 470, y0 + 108), "75T", font=mid, fill=WHITE, anchor="lm")
    def panel(x): pass  # ZPMC plate: separate decal with the user-supplied artwork (zpmc-plate.png)
    if panel_left:
        panel(60); smoke(430); num(950); swl(1180)
    else:
        smoke(60); num(580); swl(810); panel(1700)


row(0, False)
row(176, True)
Image.new("RGBA", (256, 160), (255, 255, 255, 0)).save(OUT.with_name("portal-number-blank.png"), optimize=True)
OUT.parent.mkdir(parents=True, exist_ok=True)

# U1-C77: ZPMC plate from the artwork the user supplied (documents/zpmc flag.jpg, 420 x 420 JPEG, read only).
# "Enhanced" means cleaned and enlarged only: the logo area is cropped, enlarged with Lanczos resampling, and each pixel is
# rebuilt as the logo blue over white from how far it is from white, with a contrast curve that removes the JPEG haze.
# Nothing is redrawn.
src = Image.open(OUT.parents[5] / "documents" / "zpmc flag.jpg").convert("RGB")
px = src.load(); xs, ys = [], []
for yy in range(src.height):
    for xx in range(src.width):
        r, g, b = px[xx, yy]
        if 255 - r > 60: xs.append(xx); ys.append(yy)
box = (min(xs) - 4, min(ys) - 4, max(xs) + 5, max(ys) + 5)
logo = src.crop(box)
blue = max(((255 - r), (r, g, b)) for r, g, b in logo.getdata())[1]  # the most saturated pixel = logo blue
PW, PH = 1024, 400
scale = (PH - 70) / logo.height
big_logo = logo.resize((round(logo.width * scale), round(logo.height * scale)), Image.LANCZOS)
plate = Image.new("RGB", (PW, PH), (255, 255, 255))
ox, oy = (PW - big_logo.width) // 2, (PH - big_logo.height) // 2
span = 255 - blue[0]
out_px = plate.load(); in_px = big_logo.load()
for yy in range(big_logo.height):
    for xx in range(big_logo.width):
        t = min(1.0, max(0.0, (255 - in_px[xx, yy][0]) / span))
        t = min(1.0, max(0.0, (t - 0.25) / 0.5)); t = t * t * (3 - 2 * t)
        out_px[ox + xx, oy + yy] = tuple(round(255 + (c - 255) * t) for c in blue)
plate.save(OUT.with_name("zpmc-plate.png"), optimize=True)
img.save(OUT, optimize=True)
print(OUT, img.size)
