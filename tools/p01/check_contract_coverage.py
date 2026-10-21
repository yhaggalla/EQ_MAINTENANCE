"""P01 contract consistency check (read-only).

Checks, without modifying any file:
  1. Every acceptance case ID in ACCEPTANCE_CHECKLIST.md appears in the ARCHITECTURE s15 ownership map
     (ranges such as JOB01-JOB13 are expanded).
  2. S01-S17 each have a row in that map.
  3. Every P01 default D-19..D-44 is defined in ARCHITECTURE s13 and in docs/DECISIONS.md.
  4. Cross-document section references (DATA s.., API s.., PORTAL plan s..) resolve to real headings.
  5. Taxonomy facts the contracts rely on still hold in mechanisms-approved.json.
  6. The approved role codes, audience and binding claim appear verbatim in the contracts.
  7. No obvious secret material (connection-string passwords, credential values) in the P01 documents.

Usage: python -I tools/p01/check_contract_coverage.py --root F:/CODEX/EQ_MAINTENANCE --out docs/evidence/P01/contract-coverage.json
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

ACCEPT_ID = re.compile(r"\b(SRC|AUTH|ADM|JOB|HIS|VIS|FILE|OPS)(\d{2})\b")
RANGE = re.compile(r"\b(SRC|AUTH|ADM|JOB|HIS|VIS|FILE|OPS)(\d{2})-(?:\1)?(\d{2})\b")


def headings(text: str) -> set[str]:
    found = set()
    for line in text.splitlines():
        m = re.match(r"^#{2,4}\s+(\d+(?:\.\d+)?)\s", line)
        if m:
            found.add(m.group(1))
    return found


def section(text: str, number: str) -> str:
    """Return the text of heading `number` (e.g. '15') up to the next heading of the same or higher level."""
    heading = re.compile(r"^(#{2,4})\s+(\d+(?:\.\d+)?)\s")
    out: list[str] = []
    depth = None
    for line in text.splitlines():
        m = heading.match(line)
        if m:
            level, num = len(m.group(1)), m.group(2)
            if depth is None and num == number:
                depth = level
                out.append(line)
                continue
            if depth is not None and level <= depth and not num.startswith(number + "."):
                break
        if depth is not None:
            out.append(line)
    return "\n".join(out)


def expand_ids(text: str) -> set[str]:
    ids = {f"{p}{n}" for p, n in ACCEPT_ID.findall(text)}
    for prefix, start, end in RANGE.findall(text):
        for i in range(int(start), int(end) + 1):
            ids.add(f"{prefix}{i:02d}")
    return ids


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--root", required=True)
    parser.add_argument("--out", required=True)
    args = parser.parse_args()
    root = Path(args.root)
    docs = {
        "ARCH": (root / "docs/ARCHITECTURE.md").read_text(encoding="utf-8"),
        "DATA": (root / "docs/DATA_CONTRACT.md").read_text(encoding="utf-8"),
        "API": (root / "docs/API_CONTRACT.md").read_text(encoding="utf-8"),
        "PORTAL": (root / "docs/PORTAL_INTEGRATION_PLAN.md").read_text(encoding="utf-8"),
    }
    decisions = (root / "docs/DECISIONS.md").read_text(encoding="utf-8")
    checklist = (root / "documents/prompt-pack/ACCEPTANCE_CHECKLIST.md").read_text(encoding="utf-8")
    catalogue = json.loads((root / "documents/prompt-pack/reference/mechanisms-approved.json").read_text(encoding="utf-8"))

    results: list[dict] = []

    def record(name: str, ok: bool, detail) -> None:
        results.append({"check": name, "passed": bool(ok), "detail": detail})

    # 1 and 2: ownership map coverage
    checklist_ids = sorted({m.group(1) for m in re.finditer(r"^\|\s*((?:SRC|AUTH|ADM|JOB|HIS|VIS|FILE|OPS)\d{2})\s*\|", checklist, re.M)})
    ownership = section(docs["ARCH"], "15")
    mapped = expand_ids(ownership)
    missing = [i for i in checklist_ids if i not in mapped]
    record("acceptance IDs in checklist", len(checklist_ids) > 0, len(checklist_ids))
    record("every acceptance ID mapped in ARCHITECTURE s15", not missing, {"missing": missing})
    s_rows = [f"S{i:02d}" for i in range(1, 18)]
    s_missing = [s for s in s_rows if not re.search(rf"^\|\s*{s}\s*\|", ownership, re.M)]
    record("S01-S17 each have an ownership row", not s_missing, {"missing": s_missing})

    # 3: defaults defined
    arch_defaults = section(docs["ARCH"], "13")
    d_ids = [f"D-{i}" for i in range(19, 45)]
    not_in_arch = [d for d in d_ids if not re.search(rf"^\|\s*{d}\s*\|", arch_defaults, re.M)]
    not_in_dec = [d for d in d_ids if not re.search(rf"^\|\s*{d}\s*\|", decisions, re.M)]
    record("D-19..D-44 defined in ARCHITECTURE s13", not not_in_arch, {"missing": not_in_arch})
    record("D-19..D-44 recorded in DECISIONS.md", not not_in_dec, {"missing": not_in_dec})

    # 4: cross references
    targets = {
        "DATA": headings(docs["DATA"]),
        "API": headings(docs["API"]),
        "PORTAL": headings(docs["PORTAL"]),
        "ARCH": headings(docs["ARCH"]),
    }
    patterns = {
        "DATA": re.compile(r"\bDATA(?:_CONTRACT)?\s+s(\d+(?:\.\d+)?)"),
        "API": re.compile(r"\bAPI(?:_CONTRACT)?\s+s(\d+(?:\.\d+)?)"),
        "PORTAL": re.compile(r"\bPORTAL(?:_INTEGRATION_PLAN| plan)\s+s(\d+(?:\.\d+)?)"),
        "ARCH": re.compile(r"\bARCHITECTURE\s+s(\d+(?:\.\d+)?)"),
    }
    broken = []
    checked = 0
    for source_name, text in docs.items():
        for target, pattern in patterns.items():
            for m in pattern.finditer(text):
                checked += 1
                if m.group(1) not in targets[target]:
                    broken.append(f"{source_name} -> {target} s{m.group(1)}")
    record("cross-document section references resolve", not broken, {"checked": checked, "broken": sorted(set(broken))})

    # 5: taxonomy facts
    mains = catalogue["mainMechanisms"]
    subs = catalogue["subMechanisms"]
    main_codes = [m["code"] for m in mains]
    facts = {
        "main": len(mains),
        "sub": len(subs),
        "subActive": sum(1 for s in subs if s["active"]),
        "reservedInactive": sorted(s["code"] for s in subs if not s["active"] and s["reserved"]),
        "main10Absent": "10" not in main_codes,
        "allStringCodes": all(isinstance(x["code"], str) for x in mains + subs),
        "061": next(s["name"] for s in subs if s["code"] == "061"),
        "062": next(s["name"] for s in subs if s["code"] == "062"),
        "ropes": sorted((s["code"], s["mainCode"]) for s in subs if s["code"] in ("015", "024", "033")),
    }
    ok = (facts["main"] == 16 and facts["sub"] == 43 and facts["subActive"] == 41
          and facts["reservedInactive"] == ["048", "063"] and facts["main10Absent"] and facts["allStringCodes"]
          and facts["061"] == "Spreader" and facts["062"] == "Headblock"
          and facts["ropes"] == [("015", "01"), ("024", "02"), ("033", "03")])
    record("taxonomy facts used by the contracts", ok, facts)

    # 6: identifiers
    identifiers = ["eq-maintenance:admin", "eq-maintenance:eq-team", "eq-maintenance:management",
                   "urn:cict-eng:eq-maintenance", "cict:binding:eq-maintenance:local_user_id", "/eq-maintenance/api"]
    absent = {name: [i for i in identifiers if i not in text] for name, text in docs.items() if name in ("ARCH", "PORTAL")}
    record("approved identifiers present in ARCHITECTURE and PORTAL plan", not any(absent.values()), absent)

    # 7: secrets
    secret_patterns = [r"Password\s*=", r"pwd\s*=", r"User ID\s*=", r"ServiceCredential\"?\s*[:=]\s*\"[^\"<]{8,}",
                       r"-----BEGIN", r"eyJ[A-Za-z0-9_-]{20,}\."]
    hits = []
    for name, text in docs.items():
        for p in secret_patterns:
            if re.search(p, text, re.I):
                hits.append(f"{name}: {p}")
    record("no secret material in P01 documents", not hits, hits)

    passed = sum(1 for r in results if r["passed"])
    report = {"tool": "tools/p01/check_contract_coverage.py", "passed": passed, "total": len(results), "results": results}
    out = root / args.out
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(report, indent=2), encoding="utf-8")
    for r in results:
        print(("PASS " if r["passed"] else "FAIL ") + r["check"])
    print(f"{passed}/{len(results)} checks passed")
    return 0 if passed == len(results) else 1


if __name__ == "__main__":
    sys.exit(main())
