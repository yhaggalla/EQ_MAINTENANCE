"""P00 independent validation of reference/mechanisms-approved.json.

Re-parses documents/prompt-pack/reference/mechanisms-original.txt (two
independent four-column groups, tab separated, continuation rows) without
reusing the pack-authoring parser, then compares the result with the approved
JSON and the confirmed business decisions.

Read-only: writes nothing unless --out is given (a JSON report path).
Usage: python -I tools/p00/validate_mechanisms.py [--out report.json]
"""
from __future__ import annotations

import hashlib
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
REF = ROOT / "documents" / "prompt-pack" / "reference"
ORIGINAL = REF / "mechanisms-original.txt"
APPROVED = REF / "mechanisms-approved.json"


def norm(text: str) -> str:
    """Whitespace-normalised comparison form (collapse runs, strip)."""
    return re.sub(r"\s+", " ", text).strip()


def parse_original(path: Path):
    raw = path.read_bytes()
    text = raw.decode("utf-8-sig")
    lines = text.split("\n")
    mains: dict[str, dict] = {}
    subs: dict[str, dict] = {}
    order: list[str] = []
    issues: list[str] = []
    # half index -> current main code / current sub code
    cur_main = {0: None, 1: None}
    cur_sub = {0: None, 1: None}
    for lineno, line in enumerate(lines, start=1):
        line = line.rstrip("\r")
        if lineno <= 2:
            continue  # title row + header row
        cells = line.split("\t")
        if len(cells) < 8:
            cells += [""] * (8 - len(cells))
        if len(cells) > 8:
            issues.append(f"line {lineno}: {len(cells)} cells (>8)")
        for half in (0, 1):
            main_c, sub_c, name_c, desc_c = (c.strip() for c in cells[half * 4: half * 4 + 4])
            if main_c:
                m = re.match(r"^(\d{2})-(.*)$", main_c)
                if not m:
                    issues.append(f"line {lineno} half {half}: unparsed main '{main_c}'")
                    continue
                code, name = m.group(1), m.group(2).strip()
                if code in mains:
                    issues.append(f"duplicate main {code}")
                mains[code] = {"code": code, "name": name, "half": half, "line": lineno}
                cur_main[half] = code
                cur_sub[half] = None
            if sub_c:
                if not re.fullmatch(r"\d{3}", sub_c):
                    issues.append(f"line {lineno} half {half}: odd sub code '{sub_c}'")
                if sub_c in subs:
                    issues.append(f"duplicate sub {sub_c}")
                if cur_main[half] is None:
                    issues.append(f"line {lineno}: sub {sub_c} without parent")
                subs[sub_c] = {
                    "code": sub_c,
                    "mainCode": cur_main[half],
                    "sourceName": name_c,
                    "descParts": [desc_c] if desc_c else [],
                    "half": half,
                    "line": lineno,
                }
                order.append(sub_c)
                cur_sub[half] = sub_c
            elif desc_c or name_c:
                # continuation row in this half
                if cur_sub[half] is None:
                    issues.append(f"line {lineno} half {half}: continuation without sub")
                else:
                    if name_c:
                        issues.append(f"line {lineno} half {half}: name in continuation '{name_c}'")
                    subs[cur_sub[half]]["descParts"].append(desc_c)
    for s in subs.values():
        s["description"] = " ".join(p.strip() for p in s["descParts"])
    return raw, mains, subs, order, issues


def main(argv: list[str]) -> int:
    out = None
    if "--out" in argv:
        out = Path(argv[argv.index("--out") + 1])
    raw, mains, subs, order, issues = parse_original(ORIGINAL)
    approved = json.loads(APPROVED.read_text(encoding="utf-8"))
    checks: list[tuple[str, bool, str]] = []

    def check(name: str, ok: bool, detail: str = "") -> None:
        checks.append((name, bool(ok), detail))

    sha = hashlib.sha256(raw).hexdigest()
    check("source sha256 matches approved.sourceSha256", sha == approved.get("sourceSha256"), sha)
    check("original parse has no structural issues", not issues, "; ".join(issues))
    check("original: 16 main codes", len(mains) == 16, str(sorted(mains)))
    check("original: 43 subcodes", len(subs) == 43, str(len(subs)))
    check("original: main 10 absent", "10" not in mains)

    a_mains = {m["code"]: m for m in approved["mainMechanisms"]}
    a_subs = {s["code"]: s for s in approved["subMechanisms"]}
    check("approved: 16 main", len(a_mains) == 16 and len(approved["mainMechanisms"]) == 16)
    check("approved: 43 sub", len(a_subs) == 43 and len(approved["subMechanisms"]) == 43)
    active = [s for s in approved["subMechanisms"] if s.get("active")]
    inactive = [s["code"] for s in approved["subMechanisms"] if not s.get("active")]
    check("approved: 41 active", len(active) == 41, str(len(active)))
    check("approved: inactive exactly 048,063", sorted(inactive) == ["048", "063"], str(inactive))
    check("approved: reserved flag exactly 048,063",
          sorted(s["code"] for s in approved["subMechanisms"] if s.get("reserved")) == ["048", "063"])
    check("approved: counts block", approved.get("counts") == {"main": 16, "subTotal": 43, "subActive": 41, "subReservedInactive": 2},
          json.dumps(approved.get("counts")))
    check("approved: unassignedMainCodes == ['10']", approved.get("unassignedMainCodes") == ["10"])
    check("approved: main 10 absent", "10" not in a_mains)
    all_codes = [m["code"] for m in approved["mainMechanisms"]] + [s["code"] for s in approved["subMechanisms"]] + \
        [s["mainCode"] for s in approved["subMechanisms"]]
    check("approved: every code is a JSON string", all(isinstance(c, str) for c in all_codes))
    check("approved: main codes 2-digit, sub codes 3-digit with leading zero preserved",
          all(re.fullmatch(r"\d{2}", m) for m in a_mains) and all(re.fullmatch(r"\d{3}", s) for s in a_subs))
    check("approved: codeStorage == string", approved.get("codeStorage") == "string")

    check("main code sets equal", set(mains) == set(a_mains), str(set(mains) ^ set(a_mains)))
    for code, m in mains.items():
        am = a_mains.get(code)
        check(f"main {code} name", am is not None and norm(am["name"]) == norm(m["name"]),
              f"orig='{m['name']}' approved='{am and am['name']}'")
    check("sub code sets equal", set(subs) == set(a_subs), str(set(subs) ^ set(a_subs)))
    desc_exact = 0
    for code, s in subs.items():
        a = a_subs.get(code)
        if a is None:
            continue
        check(f"sub {code} parent {s['mainCode']}", a["mainCode"] == s["mainCode"], f"approved={a['mainCode']}")
        check(f"sub {code} sourceName", norm(a.get("sourceName", "")) == norm(s["sourceName"]),
              f"orig='{s['sourceName']}' approved='{a.get('sourceName')}'")
        ok_desc = norm(a.get("description", "")) == norm(s["description"])
        if a.get("description", "") == s["description"]:
            desc_exact += 1
        check(f"sub {code} description (whitespace-normalised)", ok_desc,
              f"orig='{norm(s['description'])[:90]}' approved='{norm(a.get('description',''))[:90]}'")
        check(f"sub {code} sourceLine", a.get("sourceLine") == s["line"], f"orig={s['line']} approved={a.get('sourceLine')}")

    # Confirmed decisions
    check("061 display name Spreader", a_subs["061"]["name"] == "Spreader", a_subs["061"]["name"])
    check("061 original label 'lp' retained", a_subs["061"].get("sourceName") == "lp")
    check("062 display name Headblock", a_subs["062"]["name"] == "Headblock", a_subs["062"]["name"])
    check("062 original label blank retained", a_subs["062"].get("sourceName", None) == "")
    for c in ("048", "063"):
        check(f"{c} blank source, inactive", subs[c]["sourceName"] == "" and subs[c]["description"] == ""
              and not a_subs[c]["active"])
    ropes = {c: (a_subs[c]["mainCode"], a_subs[c]["name"]) for c in ("015", "024", "033")}
    check("three separate rope definitions 015/024/033 with parents 01/02/03",
          ropes == {"015": ("01", "steel rope"), "024": ("02", "steel rope"), "033": ("03", "steel rope")}, str(ropes))
    # Both halves parsed
    halves = {h: sorted(c for c, s in subs.items() if s["half"] == h) for h in (0, 1)}
    check("left half mains 01-06", sorted(c for c, m in mains.items() if m["half"] == 0) == ["01", "02", "03", "04", "05", "06"])
    check("right half mains 07-09,11-17", sorted(c for c, m in mains.items() if m["half"] == 1) ==
          ["07", "08", "09", "11", "12", "13", "14", "15", "16", "17"])
    multi = {c: len(s["descParts"]) for c, s in subs.items() if len(s["descParts"]) > 1}

    passed = sum(1 for _, ok, _ in checks if ok)
    failed = [(n, d) for n, ok, d in checks if not ok]
    report = {
        "validator": "tools/p00/validate_mechanisms.py",
        "original": str(ORIGINAL.relative_to(ROOT)),
        "approved": str(APPROVED.relative_to(ROOT)),
        "sourceSha256": sha,
        "checksRun": len(checks),
        "checksPassed": passed,
        "failed": failed,
        "parseIssues": issues,
        "descriptionsByteExactAfterPartJoin": desc_exact,
        "subcodesPerHalf": {"left": halves[0], "right": halves[1]},
        "continuedDescriptions": multi,
        "subOrder": order,
    }
    for name, ok, detail in checks:
        if not ok:
            print(f"FAIL  {name}  {detail}")
    print(f"{passed}/{len(checks)} checks passed")
    print(f"left-half subcodes ({len(halves[0])}): {' '.join(halves[0])}")
    print(f"right-half subcodes ({len(halves[1])}): {' '.join(halves[1])}")
    print("continued descriptions (parts): " + ", ".join(f"{k}:{v}" for k, v in sorted(multi.items())))
    print(f"descriptions byte-identical to simple part join: {desc_exact}/43")
    if out:
        out.write_text(json.dumps(report, indent=2, ensure_ascii=False), encoding="utf-8")
    return 0 if not failed else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
