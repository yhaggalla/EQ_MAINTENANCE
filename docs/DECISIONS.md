# Decisions

Created in P00 on 21 October 2026. Three separate lists: confirmed business choices (only the user changes these), routine implementation defaults (made by the implementing agent, revisable with a recorded reason), and unresolved source facts (need an authorized technical or business answer; none blocks P01).

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

## 3 Unresolved source facts and open questions

None of these blocks P01. Each is modelled as configurable data or a visible source conflict rather than a guessed value.

| ID | Item | Evidence | Handling until resolved | Who resolves |
| --- | --- | --- | --- | --- |
| U-01 | Gantry speed 46 m/min vs 45.5 m/min | J526A00 p1 particulars; J526A0600 p1 main data | Store both observations; no chosen value; show conflict (SRC05) | Authorized technical decision via Admin parameter resolution |
| U-02 | Trolley motor rating 275 kW vs 270 kW | J526A00 p1 particulars; J526A0400 (title J526A04) p1 main data | Same as U-01; `major-parameters.json` currently records only 275, so P06 imports both observations | Technical decision |
| U-03 | Main hoist motor speed 750/900/1800 rpm vs application speed 750/1800 rpm | J526A00 p1; J526A0300 p1 | Keep both as observations with their source labels | Technical decision (low priority) |
| U-04 | Meaning of the 16000 below-rail dimension on the GA side view | J526A00 p1; J526A0300 gives under-rail lift 18 m (45 + 18 = 63) | Not used as model input; the 63 m total lift is explained by 45 + 18 | P03 may identify it (quay/water level); otherwise leave unused |
| U-05 | Portal height 49000 (waterside view) vs 49250 (landside view) | J526A00 p1 and J526A0100 p1 views A/B | Model each end from its own view; record both | P03 reads detail sheets |
| U-06 | Apex height: 83356 marker vs 5000 + 49000 + 25640 = 79640 structural sum | J526A00 p1; J526A0100 p1 | Overall height derived in P03 from dimensioned views with the reference point stated; never 63 m | P03 |
| U-07 | Current fleet: actual equipment codes, counts, which QCs belong to the J526A family, RTG/ES models | Cover "12 STS cranes" (2011 drawing set); SOW mock-up labels only | Admin enters real equipment; development fixtures use QC-DEMO-01/02, RTG-DEMO-01, ES-DEMO-01 | Business/Admin input at go-live; not needed for development |
| U-08 | Per-model applicability of entries such as 047, 154, 155, 064 for the J526A family; all applicability for RTG/ES models | Catalogue is shared; drawings do not settle every item | Candidate list in SOURCE_MAP s6; Admin confirms | Admin |
| U-09 | Spreaders are interchangeable (STS45 Bromma, "(12+4) for 12 cranes") | J526A00 p2 item 35 | Default D-16 | Business confirmation optional |
| U-10 | Drawings listed but not supplied as PDFs: J526A4100 slip-contact (trolley cable) system, J526A7200 lubrication layout, STS45 spreader, many sub-drawings | J526A00 p2; register PDF | Related positions are simplified/approximate | Supply drawings if exact geometry is ever required |
| U-11 | Exact electrical cabinet positions (drives, PLC, HV switchgear) inside machinery house/electrical room | J526A3000 p1 shows layout but not legibly labelled cabinets in P00 | "Location approximate" hotspots inside the documented room | P03 closer read; otherwise remains approximate |
| U-12 | Whether the 064 over-high hanger is fitted to this crane family; parent of the J526A1300 cargo beam | J526A1300 registered; catalogue 064 description | Cargo beam not mapped to 064; no position created until Admin decides | Admin/technical |
| U-13 | Deployed `CictEng.Auth` version in each live consumer (Portal.Host, Identity, UMMS, PayPrep, Safety) | Local source: Portal/Identity/UMMS/PayPrep use a source ProjectReference to the Portal repo; Safety uses package 0.2.1. Release manifests in Portal `artifacts/` do not record the auth version | P05 records the local matrix; target versions stay unverified until an authorized operational check | Release owner |
| U-14 | Target IIS server has the ASP.NET Core 10 Hosting Bundle | Portal `docs/DEPLOYMENT_GUIDE_IIS.md` mentions only the ASP.NET Core 8 bundle | Prerequisite listed for P12 | Server owner |
| U-15 | Neighbouring apps on .NET 8 reach end of support on 10 Nov 2026 | Microsoft support policy | Out of EQ scope; reported only. EQ does not upgrade them | Portal/app owners |

## 4 User checkpoint approvals

| Checkpoint | Date | Decision | Notes |
| --- | --- | --- | --- |
| U1 (after R02) | not yet reached | | |
| U2 (after P11) | not yet reached | | |
