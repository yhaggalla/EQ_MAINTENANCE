from pathlib import Path
from datetime import datetime, timezone
import hashlib, json, zipfile

HERE=Path(__file__).resolve().parent
ROOT=HERE.parent.parent
assert HERE.name=='eq-maintenance-demo-20261021'
reports=[json.loads((HERE/'qa'/name).read_text(encoding='utf-8')) for name in ['WORKFLOW_RESULTS.json','ADDITIONAL_RESULTS.json','annotation-fix/ANNOTATION_RESULTS.json']]
assert all(r['failed']==0 for r in reports)
passed=sum(r['passed'] for r in reports)
copies={
 'As-bulit drawing/J526A00（structure parameters）.pdf':'qc-general-arrangement.pdf',
 'As-bulit drawing/J526A0300.pdf':'qc-main-hoist.pdf',
 'As-bulit drawing/J526A0200.pdf':'qc-trolley.pdf',
 'As-bulit drawing/J526A0600.pdf':'qc-gantry-drive.pdf',
 'As-bulit drawing/J526A1200.pdf':'qc-headblock.pdf',
 'documents/images2.jpg':'cict-qc-reference.jpg',
}
references=[]
for source,name in copies.items():
 original=hashlib.sha256((ROOT/source).read_bytes()).hexdigest()
 copied=hashlib.sha256((HERE/'assets'/name).read_bytes()).hexdigest()
 assert original==copied
 references.append({'original':source,'copy':'assets/'+name,'sha256':copied,'identical':True})
(HERE/'qa'/'REFERENCE_INTEGRITY.json').write_text(json.dumps(references,indent=2,ensure_ascii=False),encoding='utf-8')

text=f'''# Mockup verification

Verified on 21 October 2026 using Microsoft Edge, headless, with software WebGL.

**{passed} checks passed; no failed checks remain.** The main 27-check suite ran directly from the standalone HTML under file:// with browser network access disabled. It recorded no uncaught browser errors and no external HTTP(S) requests. Nine additional checks covered the remaining viewer controls, form validation, multi-position completion, Admin correction and the no-WebGL fallback. These suites passed after the model replacement. Eight dedicated annotation checks also passed, including rechecking the final cutaway/camera refinement. See MODEL_CORRECTIONS.md for the five changes.

## Verified behaviour

- Initial fixture: 18 equipment, 20 work orders, 16 main codes, 43 subcodes with 41 active.
- Fleet search, type/status filters, sorting and card/list navigation.
- Actual 3D rendering, ray picking, tree drill-down, camera views/zoom, labels, technical mode, PNG export and full screen.
- Exact equipment/position histories, including independent records for QCs sharing a model.
- Work create/edit/start/complete/cancel, replacement serial updates, duplicate-position validation, multiple replacement lines and retained correction/reopening history.
- Explicit operational-status changes and required Maintenance/Breakdown reasons.
- Local evidence image upload/preview/download; embedded source PDF and photograph preview/download without internet.
- Admin register add/edit/retire/reactivate, main/subcode creation, applicability, part creation/edit/deactivation, activity log and exports.
- Management read-only presentation, EQ Team own-work cancellation, persistence across reload and reset confined to the mockup dataset.
- Desktop at 1600 x 1060 and mobile at 390 x 844; no horizontal overflow in the tested mobile fleet and explorer; modal fits the phone viewport.
- Work navigation and new-work form remain usable when WebGL is disabled.

## Boundaries

This is a browser-only interaction mockup using synthetic operational records. Portal SSO, server-side permissions, SQL persistence, multiuser concurrency, production hosting and verified CAD geometry are outside this artifact. Browser role switching simulates presentation and workflow rules. The crane geometry illustrates major assemblies using the supplied references.

All changes are confined to the isolated mockup folder. The other agent's app, source drawings and project-ledger files were left untouched. The five drawing copies and photograph match their source bytes (see REFERENCE_INTEGRITY.json).

## Evidence

- qa/WORKFLOW_RESULTS.json: 27 executed workflow checks.
- qa/ADDITIONAL_RESULTS.json: 9 additional executed checks.
- qa/annotation-fix/ANNOTATION_RESULTS.json: 8 model/annotation checks.
- qa/annotation-fix/01-revised-perspective.png through 07-revised-mobile.png: corrected crane, gantry, spreader, house and cutaway views.
- qa/REFERENCE_INTEGRITY.json: SHA-256 comparison for the six copied references.
- qa/01-fleet-desktop.png through qa/08-no-webgl-fallback.png: browser captures.

The development scripts remain next to the HTML in the isolated folder. The ZIP below is the portable viewing package; index.html alone is sufficient to run the mockup in a browser.
'''
(HERE/'QA_RESULTS.md').write_text(text,encoding='utf-8')

files=['index.html','README.md','QA_RESULTS.md','MODEL_CORRECTIONS.md','Open mockup.cmd','vendor/THREE-LICENSE.txt','vendor/THIRD_PARTY.json','qa/WORKFLOW_RESULTS.json','qa/ADDITIONAL_RESULTS.json','qa/REFERENCE_INTEGRITY.json','qa/annotation-fix/ANNOTATION_RESULTS.json']
files += [str(p.relative_to(HERE)).replace('\\','/') for p in sorted((HERE/'qa').glob('[0-9][0-9]-*.png'))]
files += [str(p.relative_to(HERE)).replace('\\','/') for p in sorted((HERE/'qa'/'annotation-fix').glob('[0-9][0-9]-*.png'))]
archive=HERE/'EQ_MAINTENANCE_INTERACTIVE_MOCKUP.zip'
with zipfile.ZipFile(archive,'w',compression=zipfile.ZIP_DEFLATED,compresslevel=7) as z:
 for name in files:z.write(HERE/name,name)
manifest={'createdUtc':datetime.now(timezone.utc).isoformat(),'passedChecks':passed,'htmlBytes':(HERE/'index.html').stat().st_size,'htmlSha256':hashlib.sha256((HERE/'index.html').read_bytes()).hexdigest(),'zipBytes':archive.stat().st_size,'zipSha256':hashlib.sha256(archive.read_bytes()).hexdigest(),'zipFiles':files}
(HERE/'qa'/'DELIVERY_MANIFEST.json').write_text(json.dumps(manifest,indent=2),encoding='utf-8')
print(json.dumps({'html':str(HERE/'index.html'),'zip':str(archive),'bytes':archive.stat().st_size,'passed':passed,'sourceCopiesIdentical':len(references)},indent=2))
