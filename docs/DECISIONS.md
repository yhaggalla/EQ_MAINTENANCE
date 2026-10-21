# Decisions

Created in P00, extended in P01, Repair-R01, P02 and P03 on 21 October 2026. Three separate lists: confirmed business choices (only the user changes these), routine implementation defaults (made by the implementing agent, revisable with a recorded reason), and unresolved source facts (need an authorized technical or business answer; none blocks P01).

User checkpoint approvals (U1 after R02, U2 after P11) are recorded in section 4 when the user gives them.

## 1 Confirmed business choices

Source: `documents/prompt-pack/APPROVED_REQUIREMENTS.md` s1 and `documents/EQ_MAINTENANCE_REQUIREMENTS_REVIEW.md`, both 21 October 2026. Do not ask these again.

| ID | Decision |
| --- | --- |
| B-01 | Stage 1: QC interactive 3D first; QC, RTG and ES in the equipment register, fleet dashboard and work records. RTG/ES 3D is deferred and never substituted with a QC model. |
| B-02 | Separate EQ app integrated with existing ENG Portal authentication, central roles, SQL Server technology and IIS hosting patterns. |
| B-03 | EQ Team creates and completes jobs; Admin manages and corrects them with recorded history; no extra completion approval. |
| B-04 | Preserve supplied codes; no main 10; 048 and 063 inactive; 061 Spreader; 062 Headblock; applicability configurable by equipment type/model. |
| B-05 | Simplified models from the drawings with accurate overall shape, major assemblies and simplified internal drill-down. |
| B-06 | No EAM/Maximo work-order reference field or synchronisation in stage 1. |
| B-07 | No bulk import of historical records. History starts at go-live; earlier work may be entered manually as completed jobs with past business dates. |
| B-08 | Initial QC main-part positions are derived from the as-built drawings and reviewed/edited by Admin before any history is recorded. |
| B-09 | EQ Team may cancel uncompleted jobs they created, with a reason; Admin may cancel any uncompleted job; only Admin corrects or reopens completed work. |
| B-10 | Exactly three operational statuses (Ready for OPS, Breakdown, Maintenance) plus a neutral Unreported display; reason mandatory for Breakdown and Maintenance; job completion never sets Ready for OPS. |
| B-11 | Roles: EQ Maintenance Admin, EQ Team, Management (read-only). EQ Admin is not PortalAdmin. |
| B-12 | Run order with user checkpoints U1 (after R02) and U2 (after P11). |

## 2 Routine implementation defaults

Made in P00 from installed tools, the current local Portal source and primary documentation checked on 21 October 2026. P01 and P04 may refine them; a change needs a reason recorded here.

| ID | Default | Reason / evidence |
| --- | --- | --- |
| D-01 | EQ backend targets **.NET 10 (LTS)**: ASP.NET Core 10 and EF Core 10 (`Microsoft.EntityFrameworkCore.SqlServer` 10.0.x, latest observed 10.0.13). | Microsoft support policy page (fetched 21 Oct 2026): .NET 10 LTS supported to 14 Nov 2028, latest patch 10.0.13 (13 Oct 2026); .NET 8 and .NET 9 both end support on **10 Nov 2026**. Choosing net8.0 for a new app would ship on an unsupported runtime within three weeks. |
| D-02 | Install a .NET 10 SDK before P04 (only SDK 8.0.426 is installed; Microsoft.NETCore.App 10.0.13 runtime is present but Microsoft.AspNetCore.App 10 is not). Prefer a machine-wide official installer or the official `dotnet-install` script into a task-owned folder; do not alter neighbouring repos' local SDK folders. | Toolchain check, `docs/evidence/P00/P00_EVIDENCE.md` s5. |
| D-03 | The Portal, Identity, UMMS, PayPrep and Safety stay on their current net8.0 targets. P05 references `CictEng.Auth` (net8.0 library) from the net10.0 EQ host and proves it builds and validates under ASP.NET Core 10 before relying on it. No incidental Portal upgrade. | Master control; net8.0 libraries are consumable from net10.0, but the JwtBearer/IdentityModel version unification must be tested, not assumed. |
| D-04 | Frontend candidate set (newest stable releases at least 14 days old on 21 Oct 2026; P04 pins exact versions with a lockfile after a clean install): react / react-dom 19.3.0; three 0.186.1; @types/three 0.186.0; @react-three/fiber 9.8.1 (peer react >=19 <19.4, three >=0.156); @react-three/drei 10.7.9 (peer react ^19, fiber ^9); vite 8.3.3 (node ^20.19 or >=22.12); @vitejs/plugin-react 6.1.2; typescript 6.0.3; eslint 10.12.0; typescript-eslint 8.71.1; vitest 5.0.3; @playwright/test 1.63.0; @tanstack/react-query 5.104.1; react-router 7.18.4. | npm registry queried 21 Oct 2026. TypeScript 7.0.2 is "latest" but typescript-eslint 8.72 peers require `typescript <6.1.0`, so 6.0.3 is the compatible choice. React 19/Fiber 9 is chosen because the Portal web has no shared component package (React 18.3.1 there does not constrain EQ). react-router 7.x is the conservative line; 8.x may be evaluated in P04. |
| D-05 | Node.js 24.15.0 (installed) and npm 11.12.1 for the EQ frontend. | Satisfies Vite 8 engines. |
| D-06 | One deployable EQ host (ASP.NET Core) serving the SPA and API under `/eq-maintenance`, API under `/eq-maintenance/api`; internal modules Domain / Application / Infrastructure / Web with tests. No microservices. | APPROVED_REQUIREMENTS s8. |
| D-07 | Identifiers: app code `eq-maintenance`; audience `urn:cict-eng:eq-maintenance`; roles `eq-maintenance:admin`, `eq-maintenance:eq-team`, `eq-maintenance:management`; binding claim `cict:binding:eq-maintenance:local_user_id`. No collision found in the Portal registry seed, shared contract or docs. The validator derives the audience from the role prefix before `:`, so these role codes map to the proposed audience. | Portal source inspection, SOURCE_MAP s7. |
| D-08 | Separate EQ database on the local SQL Server Express 2022 instance `.\SQLEXPRESS` (16.0.4305.5). Disposable development/test databases are named `EqMaintenanceDisposable_<purpose>[_<runid>]`; tooling refuses migration/seed unless the target name matches that prefix **and** an EQ-owned marker table written at creation exists. No startup migration or seeding. Never target `CictEng*`, `UrgentMaterials*`, `PayPrep`, `EngineeringPaymentAssistant`, `CictSafety*` or any other existing database. | Instance and existing database names listed read-only in P00; no `EqMaintenance*` database exists. |
| D-09 | Local development ports: EQ host 5310, Vite dev server 5311 (proxied to the same origin). These avoid the Portal runner's 5174, 5180, 5190, 5091, 5173, 5088, 5280. P05 decides how EQ joins the same-origin local Portal at `http://127.0.0.1:5174/eq-maintenance`. | `scripts/portal-local.ps1` port table. |
| D-10 | QC model pipeline: a **deterministic TypeScript procedural generator** (run with Node in the EQ repo) that builds the Three.js scene from a parameter file of drawing dimensions, exports a GLB with `GLTFExporter`, and writes a node manifest, dimension/provenance table and checksums. The runtime loads the generated GLB through the protected asset endpoint. | Blender is not installed (no `blender` on PATH; `bpy` unavailable); no CAD/3D source exists in the drawing folder. A code generator is reproducible, diff-reviewable and uses the same Three.js version as the viewer. An editable-asset (Blender) route stays possible later but is not required. |
| D-11 | Model coordinates: metres; Y up; X along the boom, positive toward waterside; Z along the rails (gantry travel); origin at the top of the waterside rail on the crane's transverse centreline (landside rail at X = -30). Millimetre drawing values are converted explicitly in the parameter file. | QC_3D_MODELLING_BRIEF s3. Outreach is measured from the waterside rail on J526A00/J526A0100, which makes it a natural origin. |
| D-12 | Model template name `CICT-J526A-STS`, version 1. Never assigned to equipment automatically. | Brief s2; SRC06. |
| D-13 | Supply-chain rule: pin exact versions with lockfiles; prefer releases at least 14 days old; no CDN at runtime; fonts/decoders bundled same-origin. | Master control; brief s6. |
| D-14 | Business dates stored as `date`; audit instants as UTC `datetime2`; display in Asia/Colombo. | APPROVED_REQUIREMENTS s5. |
| D-15 | Fleet polling 60 s default (configurable) plus refresh after writes. | APPROVED_REQUIREMENTS s8. |
| D-16 | Spreader tracking default: the spreader is a maintainable **position on the crane** (06/061) whose installed item records the spreader serial when known; the same physical spreader may later appear installed on another crane. Admin can revise before history exists. | Subsidiary list shows 16 spreaders for 12 cranes (U-09); the installation model already supports moving items without a separate asset register. |
| D-17 | Workspace is not a Git repository. P00 does not initialise Git. Recommendation: initialise Git (with a `.gitignore` excluding `tmp/`, `artifacts/` large outputs, build outputs and secrets) at the start of P04, or earlier if the user prefers, so later reviews can cite commits. | Master control asks for branch/commit "if Git exists". |
| D-18 | The `tmp/` folder (pack-authoring scratch and a v1.1 backup) is preserved untouched and is not an authority. | Preserve existing work. |

### P01 additions (21 October 2026)

Full context for each item is in the P01 contract documents named in the reason column. D-17 is superseded in fact: the workspace became a Git repository (branch `main`, commit `c326b62` "P00: source discovery and implementation plan") before P01 started.

| ID | Default | Reason / evidence |
| --- | --- | --- |
| D-19 | Versioned API at `/eq-maintenance/api/v1` under the approved `/eq-maintenance/api` base. | Allows a later v2 without changing the approved base; ARCHITECTURE s2 |
| D-20 | Deep-link query values restricted to `[A-Za-z0-9_-]`; selection uses separate `main`/`sub`/`part` parameters. | Portal `IdentityReturnUrlValidator` rejects `%`, so encoded values would lose the deep link after sign-in; ARCHITECTURE s6 |
| D-21 | Prototype adapter and fixtures only in a separate Vite mode/entry; P12 bundle check. | Fixtures must never look like production workflows; ARCHITECTURE s6 |
| D-22 | No Draco/meshopt compression in stage 1. | Avoids decoder hosting; procedural asset expected well under 8 MiB; revisit with measurements |
| D-23 | Disposable-database guard = name pattern `EqMaintenanceDisposable_*` **and** `eq.__DisposableMarker`; non-disposable reference imports need `--target-confirmation`; fixtures only on disposable targets. | Refines D-08; ARCHITECTURE s10 |
| D-24 | Solution naming `Cict.EqMaintenance.*`, four layers + AdminCli, architecture test. | Mirrors the Safety repo; ARCHITECTURE s3 |
| D-25 | `CictEng.Auth` 0.3.0 consumed as a PackageReference from a checksummed local `packages/` feed. | Pins the contract version; Safety precedent; PORTAL_INTEGRATION_PLAN E-1 |
| D-26 | `rowversion` concurrency exposed as `version`; stale writes -> 409 `version_conflict` with the current representation. | Same response code as the Safety API; API_CONTRACT s1.4 |
| D-27 | `Idempotency-Key` required on every creating/changing POST; records kept 30 days; completion also protected by job state. | JOB06; DATA_CONTRACT s8 |
| D-28 | Completion, status change, correction and provisioning run in one transaction with `UPDLOCK, HOLDLOCK` on affected rows inside the EF execution strategy. | JOB07/JOB08; DATA_CONTRACT s5.1 |
| D-29 | Position kinds `serialized` and `quantityLot` (lots with quantity/UOM; full or partial replacement). | JOB10; DATA_CONTRACT s5.2 |
| D-30 | Replacement lines are entered at completion only; Repair jobs carry no lines. | Fewer states; DATA_CONTRACT s3.6 |
| D-31 | Replacement-line positions must be inside the job target subtree (equipment-level jobs: any active position of that equipment). | Keeps scoped history coherent; DATA_CONTRACT J3 |
| D-32 | A new installation event's business date must be >= the latest non-voided event date at that position, else 409 `out_of_order_installation`. | Never overwrite later physical history; DATA_CONTRACT I2 |
| D-33 | Status changes take effect at server time (no back-dating); setting the current value again is refused. | No fabricated downtime; DATA_CONTRACT s4.2 |
| D-34 | Cancellation is terminal in stage 1. | Requirement defines no un-cancel; DATA_CONTRACT s4.1 |
| D-35 | Retire refused while uncompleted jobs exist; retired equipment takes no new jobs/status changes. | ADM04; DATA_CONTRACT E3 |
| D-36 | Admin-only "known existing installation" baseline (no job, explicit source note, date may be unknown); never automatic. | Lets known current items be recorded without inventing an installation event; DATA_CONTRACT s3.5 |
| D-37 | Delegated EQ role administration not enabled in stage 1; PortalAdmin grants EQ roles. | Matches Safety; requirement s4 allows delegation only if it does not widen authority; PORTAL_INTEGRATION_PLAN s8 |
| D-38 | Registry icon key `maintenance` with a dedicated Portal icon mapping. | Current mapping would show the generic icon or the UMMS wrench; PORTAL_INTEGRATION_PLAN W-2 |
| D-39 | Model assets served `private, no-cache` with a sha256 ETag. | Every load revalidates through authentication; ARCHITECTURE s9 |
| D-40 | History responses are sectioned (open, completed, installation events, status changes). | Date-only and instant orderings are not mixed; DATA_CONTRACT s9 |
| D-41 | The `eq-maintenance` registry row is committed disabled; enabling it is an audited rollout step after gate G1. | Old consumers reject EQ-bearing tokens; PORTAL_INTEGRATION_PLAN s6 |

### Repair-R01 additions (21 October 2026)

From R01 findings F1-F3 (`docs/evidence/R01/review-20261021-1357.md`). D-32 is unchanged; D-42 documents its consequence for B-07.

| ID | Default | Reason / evidence |
| --- | --- | --- |
| D-42 | D-32 limits manual back-entry: an older replacement cannot be inserted below a newer event at the same position. Back-entry is done oldest first; older work found later is recorded by Admin date-order re-entry (void later lines latest first, complete the older job, re-add the later lines), all audited. No "insert earlier event" operation in stage 1. | Keeps installation history append-only and derivable (I1, JOB09) while still allowing B-07 manual past entries; DATA_CONTRACT I2, s5.4 (R01 F3) |
| D-43 | A reopened job (ReopenCount > 0) stays protected as completed work while uncompleted: EQ Team cannot cancel it; Admin cancels it only after voiding all committed lines by correction; kind cannot become `repair` and the target cannot exclude a committed line; re-completion accepts zero new lines, checks CompletedOn against committed lines and refuses a second line at a committed position (422 `duplicate_position`). Admin corrections on a reopened job are limited to line amendments and voids. | Requirement s5 (completed job not cancellable; completed replacement not silently undone; only Admin corrects); DATA_CONTRACT J6, s4.1, s5.3 (R01 F1) |
| D-44 | Idempotent commands re-check the IdempotencyRecord after taking the aggregate lock and before the version check, so a concurrent same-key request is replayed rather than refused with 409. | JOB06; DATA_CONTRACT s5.1 step 3, s8 (R01 F2) |

### P02 additions (21 October 2026)

Evidence: `docs/UX_SPEC.md`, `docs/evidence/P02/P02_EVIDENCE.md`. All are routine implementation choices revisable at R02 or the U1 checkpoint.

| ID | Default | Reason / evidence |
| --- | --- | --- |
| D-45 | The P02 prototype is a dependency-free static app (classic scripts, no build, no CDN) in `artifacts/prototypes/p02-ui`, not the Vite prototype mode of ARCHITECTURE s6. D-21's intent stands: fixtures and the simulated rule layer exist only under `artifacts/`, never in `src/eq-web`. P04 ports the design (tokens, information architecture, copy, state catalogue) to React; the simulated rules inform P07 test cases but are not production code | Runs from a double click or `serve.mjs` with no install, so R02 and the user can review before the toolchain is chosen; avoids installing packages for a throw-away artifact |
| D-46 | Hash routes in the prototype mirror the production route table; the URL is the single selection state (`main`, `sub`, `part`, `container`, `mode`, `panel`) and uses instance/position IDs matching `[A-Za-z0-9_-]` (D-20) | One state for tree, breadcrumb, buttons and scene; deep links survive sign-in |
| D-47 | The QC model area is an SVG side-elevation placeholder with constant-pixel labels, an Assemblies button row as the text alternative to hover labels, and a legend; horizontal spans use gauge 30 m, outreach 70 m, backreach 20 m; vertical proportions are illustrative and labelled | Proves the interaction contract without WebGL; overall height is not established (U-04, U-06) and must not be set to 63 m |
| D-48 | Status is always a badge with icon, text and colour (four displays: Ready for OPS, Breakdown, Maintenance, Unreported); crane paint, selection outline and open-work markers are a separate legend group; the status badge is placed outside the geometry | S03, VIS06; red paint must not read as Breakdown |
| D-49 | Breakpoints: three columns from 1280 px, drawers below 1280 px (hidden drawers are `visibility: hidden`, Escape closes and returns focus), phone layout below 768 px, compact equipment header between 1280 and 1440 px; 1366x768 and 1920x1080 are the documented desktop layouts | S16; UX_SPEC s8 |
| D-50 | Clicking an enclosing visual group (machinery house) selects nothing in the maintenance hierarchy; it fits the container and lists its positions grouped by mechanism (`container=machinery-house`) | DATA s10.7 and s10.10 |
| D-51 | Focus ring is two-tone (2 px navy line + 4 px Portal gold ring) and the form-border token is darkened to #6c8496, deviating from the Portal's single gold ring, because the Portal ring is 2.4:1 on white | WCAG 2.2 non-text contrast; `docs/evidence/P02/contrast-report.json` |
| D-52 | Jobs have no drag and drop in stage 1: Board and Tabs layouts with explicit Start / Return to Pending / Complete / Cancel buttons; every action uses the same rule path as the forms | Requirement s7 "moving a card must still enforce the same server rules"; keyboard operability |
| D-53 | Synthetic fixture set: QC-DEMO-01..06, RTG-DEMO-01..07 (07 retired), ES-DEMO-01..04; QC-DEMO-01 and 02 share the J526A template with different history, QC-DEMO-03 has draft positions and no status, QC-DEMO-04..06 and several RTG/ES items have no verified model (RTG-DEMO-01..03 and ES-DEMO-01 use synthetic RTG/ES templates); the example position list of 27 QC positions is a placeholder for the P03/P06 drawing-derived template and is labelled as such | Covers the required states without asserting any fleet fact (U-07, U-08) |
| D-54 | The right panel has History and Technical tabs; Include cancelled lives in the History panel and the Jobs filter; the Admin link is shown only to Admin and a direct link by another role shows a 403 explanation | UX_SPEC s1, s3; review prompt 2-3 for U1 |

Contract observation UX-1 (JobSummary lacks `reopenCount`/`committedLineCount`) is carried to P07 with N1-N6; see UX_SPEC s11.

### P03 additions (21 October 2026)

Evidence: `docs/evidence/P03/P03_EVIDENCE.md`, `artifacts/models/cict-j526a-sts-scene/1/provenance.md`. Routine model and prototype choices, revisable at R02 or the U1 checkpoint.

| ID | Default | Reason / evidence |
| --- | --- | --- |
| D-55 | The QC model is produced by a deterministic Node generator (`tools/model-generator`, three 0.186.1 pinned by lockfile) from editable source in `assets/models/source/cict-j526a-sts/` (`params.json` in mm with kind/source/note per value, `build.mjs` scene definition). Output goes to `artifacts/models/cict-j526a-sts-scene/<version>/` (GLB, manifest, provenance table, landmarks, checksums). Template `CICT-J526A-STS` version 1, status draft, not assigned to any real QC | Brief s7 items 1-4; P00 conclusion 3 (no Blender/CAD); identical GLB and manifest on repeated generation |
| D-56 | Scene coordinates follow D-11: metres, Y up, +X along the boom toward the water, Z along the rails, origin on the waterside rail top at the crane centreline; side `a` = +Z, `b` = -Z, `ws`/`ls` = waterside/landside | Brief s3; documented in the source README, manifest `axes`/`origin`/`sides` |
| D-57 | Elevation interpretation: 50500 is the girder/boom underside (trolley rail then about 52.42 m); overall height with the boom lowered is the 83356 apex-head marker, the A-frame structural top 5000 + 49000 + 25640 = 79640; each portal end uses its own view (54000 waterside, 54250 landside, U-05). 63 m total lift is never a height; the validator asserts it | J526A00/J526A0100 dimensions; the aligned side overlay matched only after the 50500 reinterpretation (first iteration 1.9 m low); U-06, U-19 |
| D-58 | One fixed display pose: trolley at the 70 m outreach limit, spreader underside at the 45 m lift height, 40 ft setting, boom lowered, elevator car at the first landing. It is not live state and nothing animates | Brief s1 (no live movement); aids comparison with the GA |
| D-59 | Identity in the asset: one maintenance position = one glTF node named by its semantic key with `extras.nodeKey`; one position may hold several primitives/materials; repeated gantry wheels (32) and drives (16) use `EXT_mesh_gpu_instancing` and resolve only through the versioned `instanceMaps` list; containers (`container.*`) and decorative context carry no classification; hotspots are technical-mode markers labelled approximate | DATA_CONTRACT s10; brief s4; VIS05 demonstrated by `tools/p03/check_bindings.mjs` (reorder, v2 orphans, no fuzzy match, explicit Admin repair) |
| D-60 | Picking: in Technical mode an enclosure is transparent and not pickable, so a ray reaches the internals; in Overall mode a click on the house selects the spatial group only (D-50); decorative or background clicks keep the current selection; overlapping hits resolve by manifest `pickPriority` | Brief s5 "documented picking policy"; browser checks `transparent-enclosure-pick`, `container-click` |
| D-61 | Classification proposals for Admin review (B-08), not confirmed applicability: drum (emergency) brakes 012/032, sheaves 011/021/031, gantry wheel brakes 046, air compressor and machinery-house service crane 151, transformers/switchgear 121; load cell 013, trolley tension 022, cable/slip-contact 023, skew 111, floodlights 131, A/C 152, emergency drive 161, drives 071, PLC 081 and control power 051 are location hotspots. No node uses 043/044/045, 09x, 048 or 063 | U-08, U-10, U-11; brief s3 "applicability must be checked" |
| D-62 | Appearance: structure CICT red `#d22a33`; walkways, stairs and platforms darker red `#a9262d`; light machinery house on a red deck; headblock and spreader yellow `#e0b020`; light cabin body with dark glazing; neutral grey for machinery, drums and electrical equipment whose vendor colours are not established; logos and text panels omitted. Site photos `documents/Image_20261021*.jpg` (supplied during P03) are used for appearance only, never for dimensions | `documents/images.jpg`, `images2.jpg`, `Image_20261021165608.jpg`, `165637`, `165846`; `docs/evidence/P03/comparison/site-photo-closeups.png` |
| D-63 | The P03 prototype is a static ES-module page (`artifacts/prototypes/p03-qc-model`, three 0.186.1 vendored, localhost server on port 5313, no CDN). It is linked from the P02 QC-DEMO-01/02 detail ("Open 3D model (P03)") with equipment, main/sub and the part's semantic key (`.` written `_`, D-20); P03 resolves the exact key only and reports a P02 placeholder key instead of guessing. The P02 SVG placeholder stays in place; the production viewer replaces it in P10 | Integration "if practical without production business logic"; keeps P02 checks 50/50 |
| D-64 | Rendering is on demand (frames only for controls, transitions, selection, mode and overlay changes). Budgets of brief s6 are unchanged; P03 figures are workstation measurements (Intel UHD 630 hardware and SwiftShader in headless Chrome 155), not the agreed office reference desktop or LAN | Brief s6; `docs/evidence/P03/browser-checks-*.json` |

## 3 Unresolved source facts and open questions

None of these blocks P01. Each is modelled as configurable data or a visible source conflict rather than a guessed value.

| ID | Item | Evidence | Handling until resolved | Who resolves |
| --- | --- | --- | --- | --- |
| U-01 | Gantry speed 46 m/min vs 45.5 m/min | J526A00 p1 particulars; J526A0600 p1 main data | Store both observations; no chosen value; show conflict (SRC05) | Authorized technical decision via Admin parameter resolution |
| U-02 | Trolley motor rating 275 kW vs 270 kW | J526A00 p1 particulars; J526A0400 (title J526A04) p1 main data | Same as U-01; `major-parameters.json` currently records only 275, so P06 imports both observations | Technical decision |
| U-03 | Main hoist motor speed 750/900/1800 rpm vs application speed 750/1800 rpm | J526A00 p1; J526A0300 p1 | Keep both as observations with their source labels | Technical decision (low priority) |
| U-04 | Meaning of the 16000 below-rail dimension on the GA side view | J526A00 p1; J526A0300 gives under-rail lift 18 m (45 + 18 = 63) | Not used as model input; the 63 m total lift is explained by 45 + 18 | P03 did not identify it from the reviewed sheets; it stays unused (the model's quay slab is illustrative) |
| U-05 | Portal height 49000 (waterside view) vs 49250 (landside view) | J526A00 p1 and J526A0100 p1 views A/B | Model each end from its own view; record both. P03: waterside portal top 54.000 m, landside 54.250 m, both in `provenance.md` | Technical confirmation optional |
| U-06 | Apex height: 83356 marker vs 5000 + 49000 + 25640 = 79640 structural sum | J526A00 p1; J526A0100 p1 | Overall height derived in P03 from dimensioned views with the reference point stated; never 63 m. P03: 83.356 m = top of apex head (boom lowered), 79.64 m = A-frame structural top; both recorded (D-57) | Interpreted in P03; technical confirmation optional |
| U-07 | Current fleet: actual equipment codes, counts, which QCs belong to the J526A family, RTG/ES models | Cover "12 STS cranes" (2011 drawing set); SOW mock-up labels only | Admin enters real equipment; development fixtures use QC-DEMO-01/02, RTG-DEMO-01, ES-DEMO-01 | Business/Admin input at go-live; not needed for development |
| U-08 | Per-model applicability of entries such as 047, 154, 155, 064 for the J526A family; all applicability for RTG/ES models | Catalogue is shared; drawings do not settle every item | Candidate list in SOURCE_MAP s6; Admin confirms | Admin |
| U-09 | Spreaders are interchangeable (STS45 Bromma, "(12+4) for 12 cranes") | J526A00 p2 item 35 | Default D-16 | Business confirmation optional |
| U-10 | Drawings listed but not supplied as PDFs: J526A4100 slip-contact (trolley cable) system, J526A7200 lubrication layout, STS45 spreader, many sub-drawings | J526A00 p2; register PDF | Related positions are simplified/approximate | Supply drawings if exact geometry is ever required |
| U-11 | Exact electrical cabinet positions (drives, PLC, HV switchgear) inside machinery house/electrical room | J526A3000 p1 shows layout but not legibly labelled cabinets in P00 | "Location approximate" hotspots inside the documented room | P03 read J526A3000: two cabinet rows numbered 71-76 are visible but identities are not legible; drives (071), PLC (081), control power (051) stay approximate hotspots and the line-up is decorative (D-61). Remains open |
| U-12 | Whether the 064 over-high hanger is fitted to this crane family; parent of the J526A1300 cargo beam | J526A1300 registered; catalogue 064 description | Cargo beam not mapped to 064; no position created until Admin decides | Admin/technical |
| U-13 | Deployed `CictEng.Auth` version in each live consumer (Portal.Host, Identity, UMMS, PayPrep, Safety) | Local source: Portal/Identity/UMMS/PayPrep use a source ProjectReference to the Portal repo; Safety uses package 0.2.1. Release manifests in Portal `artifacts/` do not record the auth version | P05 records the local matrix; target versions stay unverified until an authorized operational check | Release owner |
| U-14 | Target IIS server has the ASP.NET Core 10 Hosting Bundle | Portal `docs/DEPLOYMENT_GUIDE_IIS.md` mentions only the ASP.NET Core 8 bundle | Prerequisite listed for P12 | Server owner |
| U-15 | Neighbouring apps on .NET 8 reach end of support on 10 Nov 2026 | Microsoft support policy | Out of EQ scope; reported only. EQ does not upgrade them | Portal/app owners |
| U-16 (P01) | No delivery path exists for adding a new application/roles to an **existing** Identity database (catalog seeder runs only in tests, local seeding and the one-time production bootstrap) | Portal `IdentityCatalogSeeder`, `docs/PRODUCTION_BOOTSTRAP_RUNBOOK.md` | P05 adds an idempotent Identity migration inserting the disabled EQ registry rows (PORTAL_INTEGRATION_PLAN I-5) | P05 implementation; DBA review at rollout |
| U-17 (P01) | Portal root deploy scripts mirror the site root and exclude only known child folders; an EQ folder would be deleted by a later root release | Portal `scripts/deploy-production-release.ps1` l.57/241, `build-production-packages.ps1` l.1068, `final-identity-live-deploy.ps1` l.71-74 (added by Repair-R01, F4) | P05 adds `eq-maintenance` to the exclusions (R-1, R-2, R-6) and inventories every other root-clearing script (R-3) before any EQ deployment | P05 |
| U-18 (P01) | Identity `access-status` ignores the application's enabled flag | Portal `IdentityAdministrationEndpoints.cs` `GetApplicationAccessStatusAsync` | P05 narrow fix + test (PORTAL_INTEGRATION_PLAN PI-6) | P05 |
| U-19 (P03) | Girder / trolley-rail elevation: 50500 read as the girder underside fits the side view and stay slopes, whereas lift 45000 plus the J526A0200 headblock-to-rail stack (3427 at upper limit) suggests the trolley rail near 50.5 m (about 1.9 m difference); also 6300 + 45850 + 2850 = 55000 does not close with the 54000 portal top (1 m) | J526A00 p1; J526A0100 p1 view B; J526A0200 p1 | D-57 reading used and labelled; landmarks recorded in `provenance.md`; alternative noted | Technical confirmation (structure GA detail or site measurement); low impact on navigation |

## 4 User checkpoint approvals

| Checkpoint | Date | Decision | Notes |
| --- | --- | --- | --- |
| U1 (after R02) | 2026-10-21 | CHANGES REQUESTED | See "2026-10-21 U1 CHANGES REQUESTED" below; repair U1, then U1 again |
| U2 (after P11) | not yet reached | | |

### 2026-10-21 U1 CHANGES REQUESTED

Given by the user in chat after reviewing the P02 prototype (port 5312) and P03 model (port 5313). The user's annotated screenshots are kept in `docs/evidence/U1/1.png`..`6.png`.

| ID | Change (user's words, then how it is read) | Screens |
| --- | --- | --- |
| U1-C01 | "QC icon need to be changed." Replace the generic crane icon used for QC with an icon that reads as a ship-to-shore quay crane (side outline: legs, boom reaching out, A-frame). No icon file was supplied, so the agent designs it. | 1.png |
| U1-C02 | "remove 2nd image section.. show more EQ on fleet tab.. dont use much space for other items.." Remove the Fleet page intro block ("FLEET OVERVIEW / Fleet" heading and the two explanatory lines) and make the Fleet tab denser so more equipment fits on screen; secondary elements take little space. The Unreported/no-telemetry meaning stays available in a compact form (for example a tooltip or legend), not as a large header. | 2.png |
| U1-C03 | "add back reach area, logo, stairs" On the QC view, add the back-reach area (rear girder area behind the landside leg), the CICT logo on the crane, and the stairs on the portal leg. Marked on the flat P02 schematic (3.png) and to be present in the 3D model too. Logo source: the CICT logo in the Portal source (`cict-logo-*.png` under F:\CODEX\CICT-ENG_MAIN_PAGE), placed where the real cranes carry it per the site photos; placement approximate and labelled. | 3.png |
| U1-C04 | "wire rope system, QC structure, stairs, machine house equipment, back reach area components, should be re checked in mainly in 3D view" Re-check these areas of the 3D model against the drawings and site photos and correct what is wrong or missing: rope reeving (hoist and boom hoist), main structure, stairs/access, machinery-house equipment, back-reach components. Keep unsupported dimensions labelled as estimates. | 3.png, 6.png |
| U1-C05 | "some buttons are not working in 4th view.." All 3D toolbar controls must work: Overall, Technical, Isolate machinery house, Fit selection, Reset view, Labels, Aligned view (every option). Find and fix the broken ones. | 4.png |
| U1-C06 | "re do the operator cabin 3D view.." Remodel the operator cabin so it looks like the real CICT cab (glazed cab under the trolley, with recognisable windows, seat/console and frame) instead of the current translucent box with floating panels. | 5.png |
| U1-C07 | "when click on the lable, 2nd tire components should show with all the 2nd tire components labled, when click on the 2nd tire components, relevant 3rd tire components should load. this should apply to QC-DEMO-01 (whole equipment) view as well.." Clicking a main-level (tier 1) label drills down: the view shows that main's sub-level (tier 2) components, each labelled; clicking a tier 2 component shows its tier 3 parts, labelled. The same drill-down works from the whole-equipment view of QC-DEMO-01 (and QC-DEMO-02). | 6.png |
| U1-C08 | "keep both, but 3d and flat should be identical in functionality.. fix both separately.." Keep both the flat schematic (P02 QC detail) and the 3D model (P03). Both must offer the same functions: the same tier 1 > 2 > 3 drill-down with labels, the same selection/tree sync, back-reach area, logo and stairs. Each is fixed in its own code. | 3.png, 6.png |

Defaults taken because the user did not choose: icon designed by the agent (U1-C01); logo reused from the Portal source (U1-C03).
