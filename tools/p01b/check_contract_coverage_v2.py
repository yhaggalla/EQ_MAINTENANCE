"""P01B contract consistency check for SOW V2 (read-only).

Extends tools/p01/check_contract_coverage.py to requirements v2.0. Checks, without modifying any contract:
  1. Every acceptance case ID in ACCEPTANCE_CHECKLIST.md (v2.0, 94 cases incl. ACC/ZM/SP/FAC/FDB) appears in the
     ARCHITECTURE s15 ownership map (ranges such as JOB01-JOB13 are expanded).
  2. S01-S29 each have a row in that map.
  3. P01 defaults D-19..D-44 and P01B defaults D-89..D-128 are defined in ARCHITECTURE s13 and in DECISIONS.md.
  4. Cross-document section references (DATA s.., API s.., PORTAL plan s.., ARCHITECTURE s..) resolve to real headings.
  5. Taxonomy facts used by the contracts still hold in mechanisms-approved.json.
  6. Approved identifiers (four role codes, audience, binding claim, API base, display name) appear in the contracts.
  7. No secret material, and no value assigned to a CMMS account key, in the contracts, DECISIONS or P01B evidence.
  8. Each V2 requirement S18-S29 and each V2 acceptance ID is referenced in DATA_CONTRACT or API_CONTRACT text.
  9. The DATA s6 matrix matches SOW V2 s3.2: 13 toggleable cells with the stated defaults, Admin fixed everywhere,
     no write feature in the Management column, no EQ write for FAC Team, no FAC write for EQ Team,
     admin.access only for Admin.
 10. Feature keys used in API policies (F:...) are exactly the DATA s6 feature keys; API s1.1 lists the same keys.
 11. fac-job-list.json facts the FAC contract relies on (114 jobs, 111 rows, 12 frequency codes with the agreed
     intervals, row 14/2 opening facts) and every frequency code is named in DATA s17.1.
 12. The four crane-view tabs of U1-C19 exist in DATA s18.1 and API s4.16.

Usage: python -I tools/p01b/check_contract_coverage_v2.py --root F:/CODEX/EQ_MAINTENANCE --out docs/evidence/P01B/contract-coverage-v2.json
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

PREFIXES = "SRC|AUTH|ADM|JOB|HIS|VIS|FILE|OPS|ACC|ZM|SP|FAC|FDB"
ACCEPT_ID = re.compile(rf"\b({PREFIXES})(\d{{2}})\b")
RANGE = re.compile(rf"\b({PREFIXES})(\d{{2}})-(?:\1)?(\d{{2}})\b")
FEATURES = ["eq.fleet.view", "eq.jobs.view", "eq.work", "eq.work.admin", "fac.dashboard.view", "fac.jobs.view",
            "fac.work", "fac.oneTimeJobs.add", "fac.masterList.manage", "fac.work.admin", "export.excel", "admin.access"]
# SOW V2 s3.2 defaults: (feature, column) -> expected cell text start. Columns: Admin, EQ Team, FAC Team, Management.
EXPECTED = {
    "eq.fleet.view": ["Fixed", "Fixed", "Toggle (on)", "Toggle (on)"],
    "eq.jobs.view": ["Fixed", "Fixed", "Toggle (on)", "Toggle (on)"],
    "eq.work": ["Fixed", "Fixed", "No", "No"],
    "eq.work.admin": ["Fixed", "No", "No", "No"],
    "fac.dashboard.view": ["Fixed", "Toggle (on)", "Fixed", "Toggle (on)"],
    "fac.jobs.view": ["Fixed", "Toggle (on)", "Fixed", "Toggle (on)"],
    "fac.work": ["Fixed", "No", "Fixed", "No"],
    "fac.oneTimeJobs.add": ["Fixed", "No", "Toggle (on)", "No"],
    "fac.masterList.manage": ["Fixed", "No", "Toggle (off)", "No"],
    "fac.work.admin": ["Fixed", "No", "No", "No"],
    "export.excel": ["Fixed", "Toggle (on)", "Toggle (on)", "Toggle (on)"],
    "admin.access": ["Fixed", "No", "No", "No"],
}


def headings(text: str) -> set[str]:
    found = set()
    for line in text.splitlines():
        m = re.match(r"^#{2,4}\s+(\d+(?:\.\d+)?)\s", line)
        if m:
            found.add(m.group(1))
    return found


def section(text: str, number: str) -> str:
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
    fac = json.loads((root / "documents/prompt-pack/reference/fac-job-list.json").read_text(encoding="utf-8"))
    evidence_dir = root / "docs/evidence/P01B"
    evidence = {p.name: p.read_text(encoding="utf-8") for p in evidence_dir.glob("*.md")} if evidence_dir.exists() else {}

    results: list[dict] = []

    def record(name: str, ok: bool, detail) -> None:
        results.append({"check": name, "passed": bool(ok), "detail": detail})

    # 1, 2 ownership map
    checklist_ids = sorted({m.group(1) for m in re.finditer(rf"^\|\s*((?:{PREFIXES})\d{{2}})\s*\|", checklist, re.M)})
    ownership = section(docs["ARCH"], "15")
    mapped = expand_ids(ownership)
    missing = [i for i in checklist_ids if i not in mapped]
    record("acceptance IDs in checklist v2.0 (expect 94)", len(checklist_ids) == 94, len(checklist_ids))
    record("every acceptance ID mapped in ARCHITECTURE s15", not missing, {"missing": missing})
    s_rows = [f"S{i:02d}" for i in range(1, 30)]
    s_missing = [s for s in s_rows if not re.search(rf"^\|\s*{s}\s*\|", ownership, re.M)]
    record("S01-S29 each have an ownership row", not s_missing, {"missing": s_missing})

    # 3 defaults
    arch_defaults = section(docs["ARCH"], "13")
    d_ids = [f"D-{i}" for i in list(range(19, 45)) + list(range(89, 129))]
    not_in_arch = [d for d in d_ids if not re.search(rf"^\|\s*{d}\s*\|", arch_defaults, re.M)]
    not_in_dec = [d for d in d_ids if not re.search(rf"^\|\s*{d}\s*\|", decisions, re.M)]
    dup_dec = [d for d in d_ids if len(re.findall(rf"^\|\s*{d}\s*\|", decisions, re.M)) > 1]
    record("D-19..D-44, D-89..D-128 defined in ARCHITECTURE s13", not not_in_arch, {"missing": not_in_arch})
    record("D-19..D-44, D-89..D-128 recorded once in DECISIONS.md", not not_in_dec and not dup_dec,
           {"missing": not_in_dec, "duplicated": dup_dec})

    # 4 cross references
    targets = {k: headings(v) for k, v in docs.items()}
    patterns = {
        "DATA": re.compile(r"\bDATA(?:_CONTRACT)?\s+s(\d+(?:\.\d+)?)"),
        "API": re.compile(r"\bAPI(?:_CONTRACT)?\s+s(\d+(?:\.\d+)?)"),
        "PORTAL": re.compile(r"\bPORTAL(?:_INTEGRATION_PLAN| plan)\s+s(\d+(?:\.\d+)?)"),
        "ARCH": re.compile(r"\bARCHITECTURE\s+s(\d+(?:\.\d+)?)"),
    }
    broken, checked = [], 0
    sources = dict(docs)
    sources["DECISIONS"] = decisions
    for source_name, text in sources.items():
        for target, pattern in patterns.items():
            for m in pattern.finditer(text):
                checked += 1
                if m.group(1) not in targets[target]:
                    broken.append(f"{source_name} -> {target} s{m.group(1)}")
    # in-document "s<n>" references inside DATA/API addressed as "(s14.3)" are checked against own headings
    own = 0
    for name in ("DATA", "API"):
        for m in re.finditer(r"\(s(\d+(?:\.\d+)?)[,)]", docs[name]):
            own += 1
            if m.group(1) not in targets[name] and m.group(1).split(".")[0] not in targets[name]:
                broken.append(f"{name} -> own s{m.group(1)}")
    record("cross-document section references resolve", not broken,
           {"checked": checked, "ownChecked": own, "broken": sorted(set(broken))})

    # 5 taxonomy
    mains, subs = catalogue["mainMechanisms"], catalogue["subMechanisms"]
    facts = {
        "main": len(mains), "sub": len(subs), "subActive": sum(1 for s in subs if s["active"]),
        "reservedInactive": sorted(s["code"] for s in subs if not s["active"] and s["reserved"]),
        "main10Absent": "10" not in [m["code"] for m in mains],
        "allStringCodes": all(isinstance(x["code"], str) for x in mains + subs),
        "061": next(s["name"] for s in subs if s["code"] == "061"),
        "062": next(s["name"] for s in subs if s["code"] == "062"),
    }
    ok = (facts["main"] == 16 and facts["sub"] == 43 and facts["subActive"] == 41
          and facts["reservedInactive"] == ["048", "063"] and facts["main10Absent"] and facts["allStringCodes"]
          and facts["061"] == "Spreader" and facts["062"] == "Headblock")
    record("taxonomy facts used by the contracts", ok, facts)

    # 6 identifiers
    identifiers = ["eq-maintenance:admin", "eq-maintenance:management", "eq-maintenance:eq-team",
                   "eq-maintenance:fac-team", "urn:cict-eng:eq-maintenance",
                   "cict:binding:eq-maintenance:local_user_id", "/eq-maintenance/api", "EQ & FAC Maintenance"]
    absent = {name: [i for i in identifiers if i not in text] for name, text in docs.items()
              if name in ("ARCH", "PORTAL")}
    absent["DATA"] = [i for i in identifiers[:4] + ["EQ & FAC Maintenance"] if i not in docs["DATA"]]
    absent["API"] = [i for i in identifiers[:4] + ["EQ & FAC Maintenance"] if i not in docs["API"]]
    record("approved identifiers (four roles, display name) present", not any(absent.values()), absent)

    # 7 secrets and CMMS account values
    secret_patterns = [r"Password\s*=", r"pwd\s*=", r"User ID\s*=", r"ServiceCredential\"?\s*[:=]\s*\"[^\"<]{8,}",
                       r"-----BEGIN", r"eyJ[A-Za-z0-9_-]{20,}\.",
                       r"Cmms(?:__|:)Account(?:__|:)(?:UserName|Password)\s*[=:]\s*[\"']?[^\s\"'<|`]{3,}",
                       r"\"(?:UserName|Password)\"\s*:\s*\"[^\"<]{3,}\""]
    hits = []
    scanned = dict(docs)
    scanned["DECISIONS"] = decisions
    scanned.update({f"evidence/{k}": v for k, v in evidence.items()})
    for name, text in scanned.items():
        for p in secret_patterns:
            if re.search(p, text, re.I):
                hits.append(f"{name}: {p}")
    record("no secret material or CMMS account value in contracts/decisions/evidence", not hits, hits)

    # 8 V2 requirement and acceptance references in DATA or API
    contract_text = docs["DATA"] + "\n" + docs["API"]
    req_missing = [f"S{i}" for i in range(18, 30) if f"S{i}" not in contract_text]
    v2_ids = [i for i in checklist_ids if re.match(r"(ACC|ZM|SP|FAC|FDB)\d{2}", i)] + ["HIS06"]
    contract_ids = expand_ids(contract_text)
    v2_missing = [i for i in v2_ids if i not in contract_ids]
    record("S18-S29 referenced in DATA/API", not req_missing, {"missing": req_missing})
    record("V2 acceptance IDs referenced in DATA/API", not v2_missing, {"count": len(v2_ids), "missing": v2_missing})

    # 9 matrix vs SOW V2 s3.2
    s6 = section(docs["DATA"], "6")
    rows = {}
    for line in s6.splitlines():
        m = re.match(r"^\|\s*`([a-zA-Z.]+)`\s*\|[^|]*\|\s*([^|]+)\|\s*([^|]+)\|\s*([^|]+)\|\s*([^|]+)\|", line)
        if m:
            rows[m.group(1)] = [c.strip() for c in m.groups()[1:]]
    mism = {}
    for f, exp in EXPECTED.items():
        got = rows.get(f)
        if got is None or any(not g.startswith(e) for g, e in zip(got, exp)):
            mism[f] = {"expected": exp, "got": got}
    toggles = sum(1 for cells in rows.values() for c in cells if c.startswith("Toggle"))
    record("DATA s6 matrix matches SOW V2 s3.2 ceilings and defaults (13 toggles)",
           not mism and toggles == 13 and set(rows) == set(FEATURES), {"toggles": toggles, "mismatches": mism,
                                                                       "features": sorted(rows)})

    # 10 feature keys
    used = set()
    for m in re.finditer(r"`F:([a-zA-Z.|]+)`", docs["API"]):
        # `F:x` and `F:x|y` in API s2 are notation examples, not features
        used.update(t for t in m.group(1).split("|") if len(t) > 1)
    unknown = sorted(u for u in used if u not in FEATURES)
    s11 = section(docs["API"], "1.1")
    listed = [f for f in FEATURES if f in s11]
    record("API feature policies use only DATA s6 features; API s1.1 lists all",
           not unknown and len(listed) == len(FEATURES), {"used": sorted(used), "unknown": unknown,
                                                          "listedInS1.1": len(listed)})

    # 11 FAC reference facts
    freqs = {f["code"]: (f["intervalMonths"], f["intervalDays"]) for f in fac["frequencies"]}
    jobs = fac["jobs"]
    row2 = next(j for j in jobs if j["sourceRow"] == 2)
    row14 = next(j for j in jobs if j["sourceRow"] == 14)
    s171 = section(docs["DATA"], "17.1")
    s171_text = s171.lower()
    labels_missing = [code for code in freqs if code.replace("-", " ").split()[0] not in s171_text]
    fac_ok = (fac["counts"] == {"sheetRows": 111, "importJobs": 114} and len(jobs) == 114 and len(freqs) == 12
              and freqs.get("tri-annually") == (4, 0) and freqs.get("bi-annually") == (6, 0)
              and freqs.get("daily") == (0, 1) and freqs.get("weekly") == (0, 7)
              and freqs.get("2-years") == (24, 0) and freqs.get("5-years") == (60, 0)
              and row2["sheetCompletedQty"] == 345 and row2["importQuantity"] == 414
              and row14["kind"] == "continuous" and row14["sheetCompletedQty"] == 4 and row14["importQuantity"] == 4
              and not labels_missing)
    record("fac-job-list.json facts used by DATA s17", fac_ok,
           {"counts": fac["counts"], "frequencies": freqs, "labelsMissingInDATA17.1": labels_missing,
            "row2": [row2["sheetCompletedQty"], row2["importQuantity"]],
            "row14": [row14["kind"], row14["sheetCompletedQty"], row14["importQuantity"]]})

    # 12 crane tabs
    s181 = section(docs["DATA"], "18.1")
    s416 = section(docs["API"], "4.16")
    tabs = ["Maintenance", "Projects/Special", "Technical", "Spare parts"]
    api_paths = ["/current-state/maintenance", "/current-state/special", "/current-state/technical",
                 "/current-state/spare-parts"]
    tabs_ok = all(f"| {t} |" in s181 for t in tabs) and all(p in s416 for p in api_paths)
    record("U1-C19 four crane-view tabs in DATA s18.1 and API s4.16", tabs_ok,
           {"dataTabs": [t for t in tabs if f"| {t} |" in s181], "apiPaths": [p for p in api_paths if p in s416]})

    passed = sum(1 for r in results if r["passed"])
    report = {"tool": "tools/p01b/check_contract_coverage_v2.py", "passed": passed, "total": len(results),
              "results": results}
    out = root / args.out
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(report, indent=2), encoding="utf-8")
    for r in results:
        print(("PASS " if r["passed"] else "FAIL ") + r["check"])
    print(f"{passed}/{len(results)} checks passed")
    return 0 if passed == len(results) else 1


if __name__ == "__main__":
    sys.exit(main())
