"""WCAG 2.x contrast check for the colour pairs used by the P02 prototype (tokens in css/app.css).

Run: python -I tools/p02/check_contrast.py [out.json]
Text pairs need >= 4.5:1; large/bold UI text and non-text indicators (focus ring, status icon strokes) need >= 3:1.
This checks the declared tokens, not every rendered pixel.
"""
import json
import pathlib
import re
import sys

root = pathlib.Path(__file__).resolve().parents[2]
css = (root / "artifacts/prototypes/p02-ui/css/app.css").read_text(encoding="utf-8")
tokens = {}
for name, val in re.findall(r"--([a-z0-9-]+):\s*(#[0-9a-fA-F]{3,6})", css):
    tokens[name] = "#" + "".join(c * 2 for c in val[1:]) if len(val) == 4 else val


def lum(hexv):
    hexv = hexv.lstrip("#")
    rgb = [int(hexv[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    lin = [c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4 for c in rgb]
    return 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2]


def ratio(a, b):
    la, lb = lum(a), lum(b)
    hi, lo = max(la, lb), min(la, lb)
    return (hi + 0.05) / (lo + 0.05)


T = tokens
pairs = [
    # (name, foreground, background, minimum)
    ("body text on surface", T["ink"], T["surface"], 4.5),
    ("body text on page", T["ink"], T["page"], 4.5),
    ("muted text on surface", T["ink-muted"], T["surface"], 4.5),
    ("muted text on page", T["ink-muted"], T["page"], 4.5),
    ("muted text on subtle surface", T["ink-muted"], T["surface-subtle"], 4.5),
    ("link on surface", T["navy-700"], T["surface"], 4.5),
    ("link on page", T["navy-700"], T["page"], 4.5),
    ("primary button text", "#ffffff", T["navy-800"], 4.5),
    ("secondary button text", T["navy-800"], T["surface"], 4.5),
    ("nav link on topbar", "#d6e5ee", T["navy-950"], 4.5),
    ("active nav link on topbar", "#ffffff", T["navy-950"], 4.5),
    ("logo mark text on gold", T["navy-950"], T["gold-500"], 4.5),
    ("topbar subtitle", "#b4cddc", T["navy-950"], 4.5),
    ("status Ready for OPS", T["st-ready-fg"], T["st-ready-bg"], 4.5),
    ("status Breakdown", T["st-break-fg"], T["st-break-bg"], 4.5),
    ("status Maintenance", T["st-maint-fg"], T["st-maint-bg"], 4.5),
    ("status Unreported", T["st-unrep-fg"], T["st-unrep-bg"], 4.5),
    ("status Ready border (non-text)", T["st-ready-bd"], T["surface"], 1.5),
    ("tag gold text", "#5d4100", T["gold-100"], 4.5),
    ("read-only chip text", "#5d4100", T["gold-100"], 4.5),
    ("error notice text", "#7a1b26", T["danger-bg"], 4.5),
    ("info notice text", "#0a3a58", T["blue-50"], 4.5),
    ("warning notice text", "#5d4100", T["warn-bg"], 4.5),
    ("success notice text", "#0f5f40", T["success-bg"], 4.5),
    ("error text on white", T["danger"], T["surface"], 4.5),
    ("prototype banner text", "#ffe9a6", "#3a2a00", 4.5),
    ("prototype banner strong", "#ffffff", "#3a2a00", 4.5),
    ("eyebrow text", "#805900", T["page"], 4.5),
    ("label text", "#20394e", T["surface"], 4.5),
    ("focus ring inner line navy-900 on white (non-text 3:1)", T["navy-900"], T["surface"], 3.0),
    ("focus ring inner line navy-900 on page (non-text 3:1)", T["navy-900"], T["page"], 3.0),
    ("focus ring outer gold on navy top bar (non-text 3:1)", T["focus"], T["navy-950"], 3.0),
    ("selection outline on sky (non-text 3:1)", T["sel"], "#eef5fa", 3.0),
    ("input / button border on white (non-text 3:1)", T["border-strong"], T["surface"], 3.0),
    ("scene label on halo", "#1d3346", "#ffffff", 4.5),
    ("paint red vs sky (appearance only)", T["paint-red"], "#eef5fa", 3.0),
    ("selected tree item text", T["navy-900"], T["blue-100"], 4.5),
]
rows = []
for name, fg, bg, need in pairs:
    r = ratio(fg, bg)
    rows.append({"pair": name, "foreground": fg, "background": bg, "ratio": round(r, 2), "required": need, "pass": r >= need})

out = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else root / "docs/evidence/P02/contrast-report.json"
out.parent.mkdir(parents=True, exist_ok=True)
out.write_text(json.dumps({"method": "WCAG 2.x relative luminance on CSS tokens", "results": rows}, indent=1), encoding="utf-8")
fails = [r for r in rows if not r["pass"]]
for r in rows:
    print(("PASS " if r["pass"] else "FAIL ") + f'{r["ratio"]:>5}:1 (need {r["required"]}) {r["pair"]}')
print(f"{len(rows)} pairs, {len(fails)} below threshold")
sys.exit(1 if fails else 0)
