# API contract

Prepared in P01 on 21 October 2026. Status: **design contract for R01 review**, revised by Repair-R01 on 21 October 2026 (findings F1, F2, F5 of `docs/evidence/R01/review-20261021-1357.md`); implemented in P04-P10. Entity rules referenced as "DATA s<n>" are in `docs/DATA_CONTRACT.md`.

**U1 round 6 addendum (23 October 2026, U1-C23..U1-C26).** Changed sections: s4.2 (fleet `openJobs` exclude hidden jobs), s4.7 (`display` filter, `showOnDashboard` in `JobSummary`), s4.8 (new `PUT /jobs/{jobId}/display`, `F:eq.work`), s4.16 (Projects/Special returns open **and completed** jobs as `jobs`, `CurrentSpecialJob` adds `completedOn` and `listedOn`; hidden jobs excluded from every tab, count and badge), s4.22 (`showOnDashboard` in `FacJobSummary`, `display` filter; dashboard-only detail excludes hidden jobs), s4.23 (new `PUT /fac/jobs/{jobId}/display`, `F:fac.work`), s4.24 (dashboard-only photo reads: active and shown jobs), s4.25 (population excludes hidden jobs; new lane group `upToDate`). DATA_CONTRACT round 6 addendum gives the rules (J7, F7, s18.1, s18.4).

**U1 round 5 addendum (23 October 2026, U1-C20..U1-C22).** Changed sections: s4.12 (catalogue add/edit bodies and refusals), s4.13 (positions add/edit, parameter definitions and value source), s4.17 (daily jobs in the Daily work (CMMS) tab), s4.18 (new `POST /equipment/{equipmentId}/spare-parts`, `F:eq.work`: EQ Team and Admin add spare parts), s4.19 (type retire rule). DATA_CONTRACT round 5 addendum gives the rules.

**P01B addendum (22 October 2026, SOW V2 revision 4).** Changed sections: s1.1, s1.2, s1.6, s1.7, s2 (feature policies replace the three role policies), s3, s4.1, s4.2, s4.3, s4.6, s4.7, s4.8, s4.9, s4.13, s5, s7. New endpoint groups: s4.16 crane-view current state, s4.17 EQ Jobs tab (daily jobs, status board, status history, spare-part register), s4.18 spare-part register commands, s4.19 Admin spare parts and EQ settings, s4.20 Admin ZMMS, s4.21 Admin Access matrix, s4.22 FAC queries, s4.23 FAC commands, s4.24 FAC photos, s4.25 FAC Dashboard, s4.26 Admin FAC, s4.27 Excel exports. Implemented in P06-P10 (P07B ZMMS, P08B FAC).

## 1 Conventions

### 1.1 Base, versions, formats

- Base: `/eq-maintenance/api/v1` (D-19). Every path below is relative to it unless it starts with `/eq-maintenance/`.
- JSON (`application/json; charset=utf-8`), camelCase properties, `null` for unknown values (never empty strings or placeholders), no extra properties accepted in request bodies (400 `unknown_property`).
- IDs: lowercase canonical UUID strings. Codes: strings (`"01"`, `"011"`). Business dates: `"YYYY-MM-DD"`. Instants: ISO 8601 UTC with `Z`. Decimal quantities: JSON numbers with up to 3 decimals.
- Enum values: `operationalStatus` `readyForOps | breakdown | maintenance` (null = Unreported); `workStatus` `pending | current | completed`; `jobKind` `repair | replacement`; `targetLevel` `equipment | main | sub | part`; `positionKind` `serialized | quantityLot`; `positionState` `draft | active | deactivated`; `lifecycle` `active | retired`; `applicability` `applicable | notApplicable | unknown`; `modelAssociation` `unassigned | verified`.
- V2 enums: `statusSource` `zmms | manual`; `statusMode` `manualOnly | automatic | manualOverride | manualOverrideExpired`; `statusChangeKind` `manualSet | manualCorrection | automatic | backToAutomatic | overrideEnded`; `roleCode` `eq-maintenance:admin | eq-maintenance:management | eq-maintenance:eq-team | eq-maintenance:fac-team`; `feature` (DATA s6) `eq.fleet.view | eq.jobs.view | eq.work | eq.work.admin | fac.dashboard.view | fac.jobs.view | fac.work | fac.oneTimeJobs.add | fac.masterList.manage | fac.work.admin | export.excel | admin.access`; `sparePartCondition` `original | replaced` (null = not recorded); `sparePartFlag` `overdue | dueSoon`; `zmmsMatchState` `matched | unmatched | ignored`; `zmmsRunOutcome` `running | succeeded | failed | abandoned`; `facKind` `recurring | oneTime | continuous`; `facStatus` `pending | inProgress | onHold | completed`; `facFlag` `overdue | dueSoon`; `facJobState` `active | closed | deactivated`; `facMode` `inHouse | outsource`.
- Actor objects: `{ "profileId": "...", "displayName": "..." }`.

### 1.2 Authentication, CSRF and session recovery

- Authentication is the shared HttpOnly cookie (`CictEng.Access.Dev` over local HTTP, `__Host-CictEng.Access` over HTTPS) validated by `CictEng.Auth` for audience `urn:cict-eng:eq-maintenance`. An `Authorization` header together with the cookie is rejected by the library. No other scheme exists in the runtime host.
- Every unsafe method (POST, PUT, PATCH, DELETE) on `/eq-maintenance/api/*` requires the canonical `Origin` (or `Referer`) and header `X-CICT-CSRF` matching the token's CSRF digest. Failure: 403 with `X-CICT-CSRF-Invalid: true` and problem code `csrf_invalid`. The SPA obtains the CSRF value from the Portal (`GET /auth/csrf`) and keeps it in memory only.
- 401 means "no valid EQ session" (missing/expired cookie, wrong audience, password change pending). The SPA performs one shared refresh (`GET /auth/session/csrf`, `POST /auth/session/refresh`), retries once, and otherwise asks `GET /auth/applications/eq-maintenance/access-status` which state to show.
- 403 means authenticated but not allowed: `forbidden_role` (no held role's ceiling allows the feature), `feature_disabled` (V2: the ceiling allows it but the Access matrix switched it off; the SPA re-reads `/session`), `access_not_ready` (no active bound profile or role mismatch, DATA s7), `not_job_creator`, `not_update_author` (V2, FAC undo/photo removal), `csrf_invalid`.

### 1.3 Pagination, filtering, sorting

- List endpoints use cursor pagination: `?limit=` (default 50, maximum 200) and `?cursor=` (opaque). Responses: `{ "items": [...], "nextCursor": "..." | null, "total": n | null }`. `total` is returned where the count is cheap (fleet, jobs board counts).
- Filters are explicit query parameters (listed per endpoint); unknown parameters return 400 `unknown_parameter`. Multi-value filters are comma-separated tokens (`status=pending,current`). Query values used in deep links contain only `[A-Za-z0-9_-]` (D-20).
- Sorting: `?sort=` with a documented token per endpoint; default stated per endpoint; every sort ends with `id` for stability.

### 1.4 Concurrency tokens

- Every mutable resource representation contains `version` (base64 rowversion) and the response has a matching `ETag`.
- Every update or command on an existing resource requires `version` in the body, except the operational-status command, whose concurrency token is `expectedCurrentStatusChangeId` (so unrelated Admin edits of the equipment record cannot cause status conflicts). Missing -> 400 `version_required`; stale -> **409 `version_conflict`** with `extensions.current` (the current representation) so the client can show what changed and offer reload/review (JOB07).
- Status changes additionally carry `expectedCurrentStatusChangeId` (409 `status_changed`); replacement lines carry `expectedCurrentInstallationId` (409 `installation_changed`).

### 1.5 Idempotency

- Every POST that creates or changes records requires header `Idempotency-Key: <uuid>` (D-27). Missing -> 400 `idempotency_key_required`.
- Scope: (caller profile, key). Same key + same canonical request -> the original status and body are replayed with header `Idempotent-Replayed: true` and no new change. Same key + different request -> 422 `idempotency_key_reused`. A same-key request that arrives while the first is still running waits on the aggregate lock and is then replayed (the record is re-checked under the lock before the version check, DATA s5.1 step 3), so a double-click never yields a 409. Records are kept 30 days; job completion is also protected by job state (DATA s8).
- PUT is idempotent by definition (full replacement with `version`); DELETE is not used (removals are POST state changes).

### 1.6 Errors

RFC 7807 problem details, `Content-Type: application/problem+json`:

```json
{
  "type": "https://internal.cict/errors/version_conflict",
  "title": "The record changed before your update was saved.",
  "status": 409,
  "detail": "Job EQJ-2026-000012 was updated by another user.",
  "code": "version_conflict",
  "correlationId": "00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-00",
  "errors": { "lines[1].quantity": ["Quantity must be 1 for a serialized position."] },
  "current": { }
}
```

Problems never contain stack traces, SQL, storage paths, connection strings, tokens or other users' private data.

| Status | Codes |
| --- | --- |
| 400 | `malformed_request`, `unknown_property`, `unknown_parameter`, `version_required`, `idempotency_key_required`, `invalid_cursor` |
| 401 | `unauthenticated` |
| 403 | `forbidden_role`, `feature_disabled`, `access_not_ready`, `not_job_creator`, `not_update_author`, `csrf_invalid` |
| 404 | `not_found` (also for unknown routes under `/api`), `file_unavailable` |
| 409 | `version_conflict`, `status_changed`, `installation_changed`, `out_of_order_installation`, `later_installation_exists`, `job_completed`, `job_already_completed`, `job_cancelled`, `job_not_completed`, `job_previously_completed`, `job_has_committed_replacements`, `committed_lines_outside_target`, `position_key_frozen`, `equipment_retired`, `open_jobs_exist`, `duplicate_code`, `definition_in_use`, `history_exists`, `binding_orphans_unresolved`, `import_conflict`; V2: `not_in_manual_override`, `sync_in_progress` (only for non-Sync-now callers), `zmms_disabled`, `position_has_installation_history`, `job_not_active`, `job_on_hold`, `cycle_already_completed`, `completion_confirmation_required`, `undo_window_passed`, `not_latest_update`, `later_progress_exists`, `quantity_below_progress`, `import_preview_stale`, `import_locked_by_progress` |
| 413 | `file_too_large` (EQ evidence 20 MiB; FAC photos 10 MiB) |
| 415 | `unsupported_media_type` |
| 422 | `validation_failed` (field `errors`), `status_unchanged`, `reason_required`, `target_not_in_equipment`, `target_inactive`, `definition_inactive`, `reserved_definition`, `position_not_active`, `position_outside_job_target`, `duplicate_position`, `replacement_after_completion`, `date_in_future`, `quantity_invalid`, `lines_not_allowed_for_repair`, `lines_required`, `idempotency_key_reused`, `code_unassigned_reserved`; V2: `access_cell_not_toggleable`, `equipment_not_zmms_mapped`, `zmms_mapping_incomplete`, `not_major_spare_part`, `kind_frequency_mismatch`, `date_outside_cycle`, `date_before_previous_completion`, `quantity_exceeds_remaining`, `next_due_required`, `too_many_photos`, `upload_invalid`, `export_too_large` |
| 503 | `storage_unavailable`, `database_unavailable`; V2: `zmms_not_configured` (Sync now when keys are missing; the body lists the missing **key names** only) |

### 1.7 Caching

JSON responses: `Cache-Control: no-store`, except `GET /fleet`, which returns an `ETag` and answers `If-None-Match` with 304 (still `private, no-cache`). Files: section 4.9. Model assets: `private, no-cache` + sha256 ETag (D-39).

V2: `GET /fac/dashboard` uses the same pattern with the ETag of DATA s18.4 (FacDataVersion, business date, filters, AccessPolicyVersion); a 304 costs two single-row reads. The fleet ETag now also includes the latest succeeded ZMMS run ID and the business date (D-127). FAC photos: `private, no-cache` + sha256 ETag, revalidated through authorization on every request. Exports: `Cache-Control: no-store`, `Content-Disposition: attachment`.

## 2 Authorization policies

V2 (S19): every endpoint is authorized by **feature policies** evaluated against the Access matrix (DATA s6, s14). The P01 policies `EqRead`, `EqWrite` and `EqAdmin` are superseded; their names survive only as shorthand in older text, mapped as shown.

| Policy | Requirement |
| --- | --- |
| `EqSession` | Authenticated with the EQ audience; active bound profile whose roles equal the token's role codes (DATA s7); at least one of the four role codes. Used only by `GET /session` (so a user with every tab switched off still gets the No-access page) |
| `Feature(f1 [, f2 ...])` | `EqSession` + the effective feature set (DATA s14.3) contains **every** listed feature. Written `F:x` below |
| `AnyFeature(f1, f2 ...)` | `EqSession` + the effective feature set contains **at least one** listed feature. Written `F:x|y` below |
| `ProvisioningCredential` | Only for `/eq-maintenance/internal/provisioning/*`: valid service credential header (fixed-time compare); no browser session involved |
| Fallback | Deny (any endpoint without an explicit policy fails closed) |

Former names: `EqRead` on an EQ read endpoint = `F:eq.fleet.view` (fleet, equipment, hierarchy, parameters, drawings, scene/model assets, crane current state) or `F:eq.jobs.view` (jobs, scoped history, status history, daily jobs, spare-part register) as stated per endpoint. `F:eq.fleet.view|eq.jobs.view` is used only for identity and reference data that both tabs need (equipment header, catalogue, register list, ZMMS freshness); no work record (special job, replacement line, progress, correction, attachment, EQ work evidence, installation event, scoped history) is served under `eq.fleet.view` alone. The crane view's only work data are the open-job summaries and counts of the current-state endpoints (s4.16), which carry no completed job, correction, attachment or evidence (Repair-R02B, D-139). `EqWrite` = `F:eq.work`. `EqAdmin` = `F:admin.access` for configuration and `F:eq.work.admin` for completed-work corrections, reopen, cancel-any and register voids (both held only by Admin).

Failure responses: 401 without a valid EQ session; 403 `access_not_ready` for a profile problem; 403 `forbidden_role` when no held role's ceiling allows the feature; 403 `feature_disabled` when a ceiling allows it but the matrix switched it off for every held role.

Resource rules applied after the policy (Application layer): EQ Team may cancel only jobs it created and never a reopened job; evidence removal by the uploader only while the job is uncompleted; FAC undo and photo removal by the author on the same business day; one-time FAC job edits by their creator before any progress; state rules from DATA s4, s15-s17. Management therefore receives 403 from every unsafe endpoint (no write feature exists in its ceiling), FAC Team from every EQ write and EQ Team from every FAC write (AUTH03, FAC11, ACC03).

## 3 Common shapes (TypeScript notation)

```ts
type Id = string; type DateOnly = string; type Instant = string; type Version = string;
type Actor = { profileId: Id; displayName: string };
type OperationalStatus = 'readyForOps' | 'breakdown' | 'maintenance';

type StatusSummary = {
  current: OperationalStatus | null;          // null = Unreported
  sinceUtc: Instant | null;                   // null when Unreported
  currentChangeId: Id | null;
  reason: string | null;
  relatedJob: { id: Id; number: string; title: string } | null;
  changedBy: Actor | null;                    // null for ZMMS-applied changes
  // V2 (S03, S21)
  source: 'zmms' | 'manual' | null;           // null when Unreported
  mode: 'manualOnly' | 'automatic' | 'manualOverride' | 'manualOverrideExpired';
  zmmsMapped: boolean;
  overrideOn: DateOnly | null;                // business day of an active/expired correction
  syncRun: { id: Id; endedUtc: Instant } | null;          // the run that produced an automatic value
  causes: Array<{ zmmsJobNumber: string; jobDate: DateOnly; effect: 'breakdown' | 'maintenance'; jobType: string | null; description: string | null }>;
};

type TargetRef = {
  level: 'equipment' | 'main' | 'sub' | 'part';
  mainInstanceId: Id | null; subInstanceId: Id | null; partPositionId: Id | null;
  breadcrumb: Array<{ level: string; id: Id; code: string | null; name: string }>;
};

type InstallationView = {
  id: Id; state: 'open' | 'closed' | 'voided';
  itemDescription: string; manufacturer: string | null; modelOrPartNumber: string | null;
  serialNumber: string | null;                // null = Unknown
  installedQuantity: number; remainingQuantity: number; uom: string;
  installedOn: DateOnly | null; closedOn: DateOnly | null;
  installedByJob: { id: Id; number: string } | null;   // null for baselineRecorded
};

type ReplacementLineView = {
  id: Id; version: Version; state: 'committed' | 'voided';
  position: { id: Id; semanticKey: string; displayName: string; subCode: string; kind: 'serialized' | 'quantityLot' };
  mode: 'full' | 'partial'; replacedOn: DateOnly;
  removed: { installation: InstallationView | null; quantity: number | null; itemKnown: boolean; description: string | null; serial: string | null };
  installed: InstallationView;
  note: string | null; installationEventId: Id;
};

type JobSummary = {
  id: Id; number: string; version: Version;
  equipment: { id: Id; code: string; type: string } | null; // null for a type-wide shared job (U1-C51)
  equipmentTypeCode: string | null; // set only for type-wide scope; exactly one of this and equipment
  target: TargetRef; kind: 'repair' | 'replacement' | 'project'; title: string;
  workStatus: 'pending' | 'current' | 'completed';
  isCancelled: boolean; priority: 'low' | 'normal' | 'high' | null;
  plannedOn: DateOnly | null; completedOn: DateOnly | null;
  responsiblePerson: string | null; createdBy: Actor; createdUtc: Instant; updatedUtc: Instant;
  lineCount: number; attachmentCount: number;
  progressPercent: number | null; progressUpdatedOn: DateOnly | null; progressNote: string | null; // U1-C50, jobs-view scope only
  showOnDashboard: boolean;   // U1-C26: the shared "Show on dashboard / 3D" switch (DATA J7)
};
```

## 4 Endpoints

Column "Policy" uses the names from section 2. Acceptance IDs refer to `ACCEPTANCE_CHECKLIST.md`.

### 4.1 Session

| Method and path | Policy | Purpose |
| --- | --- | --- |
| `GET /session` | `EqSession` | Bootstrap for the SPA |

Response:

```ts
{ application: { code: 'eq-maintenance'; pathBase: '/eq-maintenance'; displayName: 'EQ & FAC Maintenance'; apiVersion: 'v1' };
  profile: { profileId: Id; userName: string; displayName: string; email: string | null };
  roles: Array<'eq-maintenance:admin' | 'eq-maintenance:management' | 'eq-maintenance:eq-team' | 'eq-maintenance:fac-team'>;
  // V2 (S18, S19): effective Access-matrix result for this user (presentation hint only)
  access: { policyVersion: number;
            features: Feature[];                                   // DATA s14.3
            sections: Array<{ code: 'eq' | 'fac'; tabs: Array<'fleet' | 'jobs' | 'dashboard'> }>;   // only permitted tabs, in display order
            admin: boolean;
            noAccess: boolean;                                     // true -> No-access page (ACC05)
            defaultLanding: '/eq/fleet' | '/eq/jobs/special' | '/fac/dashboard' | '/fac/jobs' | null };   // role default (DATA s14.1)
  capabilities: { read: true; jobWrite: boolean; jobComplete: boolean; statusSet: boolean; jobCancelOwn: boolean; jobCancelAny: boolean;
                  jobCorrect: boolean; configManage: boolean; evidenceAttach: boolean; auditRead: boolean;
                  // V2
                  sparePartUpdate: boolean; facWork: boolean; facOneTimeAdd: boolean; facMasterList: boolean; facCorrect: boolean; export: boolean };
  portal: { csrfEndpoint: '/auth/csrf'; refreshCsrfEndpoint: '/auth/session/csrf'; refreshEndpoint: '/auth/session/refresh';
            logoutEndpoint: '/auth/session/logout'; loginPath: '/login'; accessStatusEndpoint: '/auth/applications/eq-maintenance/access-status' };
  settings: { fleetRefreshSeconds: number; businessTimeZone: 'Asia/Colombo'; maxEvidenceBytes: number;
              sessionRefreshSeconds: 60; facDashboardRefreshSeconds: number; maxFacPhotoBytes: number; maxFacPhotosPerUpdate: 5 };
  businessDate: DateOnly;
  serverTimeUtc: Instant }
```

Capabilities and `access` are presentation hints only; the server rechecks every request (AUTH03, ACC02). The SPA re-reads `/session` every 60 seconds and after any 403 `feature_disabled`, so a matrix change reaches the UI within 60 seconds (DATA s14.5). `GET /session` itself needs only `EqSession`, so a user with every tab switched off receives `noAccess: true` instead of an error (ACC05).

### 4.2 Fleet

| Method and path | Policy | Purpose / acceptance |
| --- | --- | --- |
| `GET /fleet?type=&status=&lifecycle=active|retired|all&q=` | `F:eq.fleet.view` | Summary counts plus compact rows in one lightweight polled call (S02/S03, OPS01, JOB13) |

`status` accepts `readyForOps,breakdown,maintenance,unreported`. `lifecycle` defaults to `active`. `q` matches code/name (case-insensitive contains). Response:

```ts
{ generatedUtc: Instant;
  totals: { all: number; readyForOps: number; breakdown: number; maintenance: number; unreported: number };
  groups: Array<{ type: { id: Id; code: string; name: string };
                  counts: { all: number; readyForOps: number; breakdown: number; maintenance: number; unreported: number };
                  items: Array<{ id: Id; code: string; name: string | null; lifecycle: 'active' | 'retired';
                                 model: { code: string; association: 'unassigned' | 'verified' } | null;
                                 status: StatusSummary; lastActivityUtc: Instant;
                                 openJobs: { pending: number; current: number };   // distinct non-cancelled jobs shown on the dashboard / 3D (U1-C26)
                                 thumbnail: 'qc' | 'rtg' | 'es' | 'generic'; has3dView: boolean;
                                 zmmsToday: { count: number } | null }> }>;      // V2: today's present daily jobs; null when not ZMMS-mapped
  // V2 (S20): ZMMS freshness for "ZMMS data from <date time>"
  zmms: { enabled: boolean; lastSucceededRunEndUtc: Instant | null; lastRunOutcome: 'succeeded' | 'failed' | 'abandoned' | 'running' | null; stale: boolean } }
```

V2: each item's `status` carries `source` and `mode` (s3) so cards show Auto/Manual; the counts are unchanged.

Rules: each equipment counted once in exactly one status bucket; counts reflect the filters' type/lifecycle but **not** the `status`/`q` filters (so the badges reconcile with the full group); open-job counts use COUNT(DISTINCT job) so multi-line jobs never multiply; retired items are excluded unless `lifecycle` asks for them; a failed request never produces a client-side Ready default.

### 4.3 Equipment and operational status

| Method and path | Policy | Purpose / acceptance |
| --- | --- | --- |
| `GET /equipment?type=&lifecycle=&q=&limit=&cursor=&sort=code` | `F:eq.fleet.view|eq.jobs.view|admin.access` | Register list (admin screens, pickers) |
| `GET /equipment/{equipmentId}` | `F:eq.fleet.view|eq.jobs.view` | Detail header: code, name, type, lifecycle, model association, `status: StatusSummary`, known attributes (null = unknown), counts, `has3dView`, `sceneUnavailableReason` (`notAvailableStage1` for RTG/ES, `noVerifiedModel`, `noActiveBinding`, null) (VIS07, SRC06) |
| `GET /equipment/{equipmentId}/status-history?limit=&cursor=` | `F:eq.jobs.view` | Status changes newest first: `{ id, sequence, status, previousStatus, reason, relatedJob, effectiveUtc, changedBy }` plus V2 `source`, `kind`, `syncRun { id, businessDate, endedUtc } | null`, `overrideOn`, `causes[]` (JOB02, JOB13, ZM05, ZM06). Served to the EQ Jobs tab (EQ status part); the crane view shows only the current `StatusSummary` |
| `POST /equipment/{equipmentId}/status` | `F:eq.work`; Idempotency-Key | Set operational status (S03/S09); V2: a current-day correction on ZMMS-mapped equipment (DATA s4.2) |
| `POST /equipment/{equipmentId}/status/back-to-automatic` | `F:eq.work`; Idempotency-Key | V2 (S21): end the current-day correction; body `{ expectedCurrentStatusChangeId: Id; reason: string | null }`; 201 `{ status: StatusSummary; change }`; 409 `not_in_manual_override`, 409 `status_changed`, 422 `equipment_not_zmms_mapped` (DATA s15.7 step 6, ZM06) |

Status request and rules (DATA s4.2):

```ts
{ status: OperationalStatus; reason: string | null; relatedJobId: Id | null; expectedCurrentStatusChangeId: Id | null }
```

201 with `{ status: StatusSummary; change: {...} }`. Errors: 422 `reason_required` (breakdown/maintenance without reason; V2: **any** status on ZMMS-mapped equipment without reason), 422 `target_not_in_equipment` (related job of another equipment) or `job_cancelled`, 422 `status_unchanged` (V2: only when the same value is already a manual value for today, DATA s4.2), 409 `status_changed`, 409 `equipment_retired`, 403 for Management and FAC Team.

### 4.4 Hierarchy, positions and technical sheet

| Method and path | Policy | Purpose / acceptance |
| --- | --- | --- |
| `GET /equipment/{equipmentId}/hierarchy?includeInactive=false` | `F:eq.fleet.view` | Full tree for the tree view and viewer binding (S05, VIS03) |
| `GET /equipment/{equipmentId}/positions/{positionId}` | `F:eq.jobs.view` | Technical sheet for a part (S07, S14, HIS04). V2: used by the EQ Jobs tab part view and Admin; it includes the latest installation event, so it is Jobs-tab data (Repair-R02B, D-139). The crane view uses the current-state Technical tab (s4.16, `F:eq.fleet.view`), which omits the latest event |
| `GET /equipment/{equipmentId}/positions/{positionId}/installations` | `F:eq.jobs.view` | Installation lots/items and events at the position, including voided events and correction references (HIS03, JOB10). V2: history, so EQ Jobs tab only |

Hierarchy response (one call; sized for a few hundred positions):

```ts
{ equipmentId: Id; templateRevision: number | null;
  mains: Array<{ instanceId: Id; code: string; name: string; state: 'active' | 'deactivated'; definitionActive: boolean;
                 openJobCount: number;
                 subs: Array<{ instanceId: Id; code: string; name: string; description: string; state: string; definitionActive: boolean;
                               openJobCount: number; hotspotNodeKeys: string[];
                               positions: Array<{ id: Id; semanticKey: string; displayName: string; kind: 'serialized' | 'quantityLot';
                                                  category: string; uom: string; nominalQuantity: number | null;
                                                  state: 'draft' | 'active' | 'deactivated'; openJobCount: number;
                                                  current: { summary: string; knownQuantity: number | null; unknown: boolean };
                                                  nodeKey: string | null; visual: 'bound' | 'noVisual' | 'unbound' }> }> }> }
```

Technical sheet: identity (equipment code, breadcrumb, semantic key, display name, kind, UOM, nominal quantity), current installation(s) (`InstallationView[]`, empty = "Installed item unknown"), latest event, `openJobs`, `sourceReferences` (drawing number/page with document IDs where registered), applicable `parameters` (section 4.10, filtered by the position's mechanism), and `provenance` of its visual node (approximate/estimated labels). No health or originality fields exist.

### 4.5 Catalogue (read)

| Method and path | Policy | Purpose / acceptance |
| --- | --- | --- |
| `GET /catalog/mechanisms?includeInactive=true` | `F:eq.fleet.view|eq.jobs.view|admin.access` | All definitions with code, name, sourceName, description, sourceDescription, parent, `active`, `reserved`, `nameDecision`, `origin` (SRC01-SRC03) |
| `GET /catalog/selectable?equipmentId=` | `F:eq.fleet.view|eq.jobs.view|admin.access` | Job-target selector for one equipment: only active instances of active, non-reserved definitions (SRC02) |

### 4.6 Scoped history

| Method and path | Policy | Purpose / acceptance |
| --- | --- | --- |
| `GET /equipment/{equipmentId}/history?scope=equipment|main|sub|part&targetId=&includeCancelled=false&from=&to=&kind=repair,replacement&limit=&cursor=` | `F:eq.jobs.view` | De-duplicated scoped history (S07, S08, HIS01-HIS06, JOB03). V2: consumed by the EQ Jobs tab (special-jobs part, including "Open in Jobs" from the crane view); the crane view never calls it (DATA s9, s18.1). Rules and shape unchanged |

`targetId` is required unless `scope=equipment` and must belong to the equipment (422 `target_not_in_equipment`). `from`/`to` filter `completedOn` (completed section) and `createdUtc` converted to the Colombo date (open section). Response (sections, D-40, DATA s9):

```ts
{ equipmentId: Id; scope: 'equipment' | 'main' | 'sub' | 'part'; targetId: Id | null;   // echoed for the client race guard (HIS05)
  openJobs: Array<JobSummary & { matchingLines: ReplacementLineView[] }>;
  completedJobs: { items: Array<JobSummary & { matchingLines: ReplacementLineView[]; progress: JobStatusEventView[]; corrections: JobCorrectionView[] }>;
                   nextCursor: string | null };
  installationEvents: Array<InstallationEventView> | null;   // part scope only
  statusChanges: Array<StatusChangeView> | null;             // equipment scope only (first page)
  emptyState: 'noWorkRecorded' | null }
```

Each job appears once per response even when several of its lines match; `matchingLines` lists only lines inside the scope.

### 4.7 Jobs (queries)

| Method and path | Policy | Purpose / acceptance |
| --- | --- | --- |
| `GET /jobs?status=pending,current,completed&includeCancelled=false&equipmentId=&type=&kind=&mainCode=&subCode=&targetLevel=&dateField=created|planned|completed&from=&to=&q=&mine=false&display=all|shown|hidden&limit=&cursor=&sort=updated_desc` | `F:eq.jobs.view` | Jobs workspace lists and board columns (S08, JOB01, JOB12) |
| `GET /jobs/board-counts?…same filters…` | `F:eq.jobs.view` | `{ pending, current, completed, cancelled }` counts for the tabs |
| `GET /jobs/{jobId}` | `F:eq.jobs.view` | Full job: `JobSummary` + description, completion fields, `lines: ReplacementLineView[]`, `attachments`, `progress`, `corrections`, `cancellation` `{ reason, by, utc } | null` |

`mainCode`/`subCode` match jobs targeting that definition **or** having lines below it (same rule as DATA s9), each job listed once. V2: these are the special jobs of the EQ Jobs tab; the list adds `reopenCount` and `committedLineCount` to `JobSummary` (UX-1, so the UI can explain cancel refusals before a request). Cancelled jobs appear only with `includeCancelled=true` and carry `isCancelled: true`; they are never counted in `completed`.

V2 (Repair-R02B, D-139): every endpoint of this section, the job attachments (s4.9) and EQ work-evidence content need `eq.jobs.view`, because they are the EQ Jobs tab's records (special jobs, their history, corrections and evidence). A user whose matrix switches EQ Jobs off while EQ Fleet stays on receives 403 `feature_disabled` here and still sees the crane view's open-job summaries through s4.16. The crane view does not call these endpoints; its job numbers and "Open in Jobs" links are rendered only when the session holds `eq.jobs.view` (otherwise the number is plain text).

### 4.8 Job commands

| Method and path | Policy | Body (besides `version` where noted) | Result / errors |
| --- | --- | --- | --- |
| `POST /jobs` | `F:eq.work`; Idempotency-Key | `{ equipmentId: Id | null, equipmentTypeCode?: string | null, target: { level, mainInstanceId?, subInstanceId?, partPositionId? }, kind: 'repair' | 'replacement' | 'project', title, description?, priority?, plannedOn?, responsiblePerson?, initialStatus: 'pending' | 'current' }` | 201 one job. U1-C51: choose one equipment or a type-wide scope; type-wide requires at least one active member and equipment-level target. Includes later active members. 422 invalid kind/type/scope, `target_not_in_equipment`, `target_inactive`, `definition_inactive`, `reserved_definition`; 409 `equipment_retired` (JOB01, JOB03, ADM03) |
| `PUT /jobs/{jobId}` | `F:eq.work` | `{ version, target, kind, title, description, priority, plannedOn, responsiblePerson }` | 200. Only pending/current; 409 `job_completed`/`job_cancelled`; 409 `version_conflict` (JOB07). Reopened job with committed, non-voided lines (DATA J6): 409 `job_has_committed_replacements` for kind -> `repair`, 409 `committed_lines_outside_target` for a target that excludes a committed line's position (JOB09) |
| `POST /jobs/{jobId}/start` | `F:eq.work`; Idempotency-Key | `{ version }` | pending -> current |
| `POST /jobs/{jobId}/return-to-pending` | `F:eq.work`; Idempotency-Key | `{ version }` | current -> pending |
| `POST /jobs/{jobId}/progress` (U1-C50) | `F:eq.work`; job-scoped Idempotency-Key | `{ version, percent: integer 0..100, workDate: DateOnly, note: string (required, <=2000), lines?: CompleteRequest.lines }` | 200 job. 1..99 starts Pending work; 0 preserves current work state. 100 uses the existing atomic completion path and required replacement fields. 403 read-only; 404 missing; 409 `job_not_editable`, `equipment_retired`, `version_conflict`; 422 invalid percentage/date/note/replacement details. Replay is checked after authorization but before version/state checks; no duplicate progress, completion or installation. |
| `POST /jobs/{jobId}/complete` | `F:eq.work`; Idempotency-Key | see below | 200 completed job (JOB01, JOB04-JOB08, JOB10, JOB11) |
| `POST /jobs/{jobId}/cancel` | `F:eq.work`; Idempotency-Key | `{ version, reason }` | 200. 403 `not_job_creator` (EQ Team, other creator); 409 `job_completed`; 409 `job_previously_completed` (EQ Team, reopened job); 409 `job_has_committed_replacements` (Admin, reopened job still holding committed lines; void them by correction first); 422 `reason_required` (JOB12, JOB09) |
| `POST /jobs/{jobId}/reopen` | `F:eq.work.admin`; Idempotency-Key | `{ version, reason }` | completed -> current; installations unchanged; 409 `job_not_completed` (JOB09) |
| `PUT /jobs/{jobId}/display` (U1-C26) | `F:eq.work` (EQ Team and Admin; Management and FAC Team 403 `forbidden_role`) | `{ version, showOnDashboard: boolean, reason: string | null }` (reason <= 500) | 200 `JobSummary`. Any special job, whatever its creator, work state or cancellation; an unchanged value writes nothing; 409 `version_conflict`; 422 `validation_failed`. Changes no work field or status; `JobStatusEvent` `displayShown`/`displayHidden` and `AuditEntry` `job.display` (DATA J7). A hidden job leaves s4.16 and the s4.2 counts and stays in s4.6, s4.7 and the export |
| `POST /jobs/{jobId}/corrections` | `F:eq.work.admin`; Idempotency-Key | see below | 200 corrected job + correction record; 409 `later_installation_exists`, `out_of_order_installation`; 422 field errors (JOB09, HIS03). Allowed on completed jobs and, for line amendments and voids only, on reopened jobs (DATA s4.1, s5.3) |

Complete request:

```ts
{ version: Version;
  completedOn: DateOnly;          // business date; <= today in Asia/Colombo; never replaced by the entry time
  completionNote: string;         // required
  lines: Array<{                  // kind=replacement: new lines + the job's committed, non-voided lines >= 1
                                  //   (a reopened job may send []); must be empty for kind=repair; optional for kind=project;
                                  //   a position already committed in this job -> 422 duplicate_position
    partPositionId: Id;
    mode: 'full' | 'partial';     // serialized: 'full' only
    expectedCurrentInstallationId: Id | null;    // what the user saw as currently installed; null = nothing tracked
    removedQuantity: number | null;              // partial lots only
    removedItemKnown: boolean; removedItemDescription: string | null; removedItemSerial: string | null; // only when nothing tracked
    itemDescription: string; manufacturer: string | null; modelOrPartNumber: string | null; serialNumber: string | null;
    quantity: number; uom: string;               // serialized: 1 'ea'
    replacedOn: DateOnly;                        // <= completedOn (completedOn must also be >= every committed line's replacedOn)
    note: string | null;
    conditionRemarks?: string | null; }> }   // V2: register remarks for a designated position (DATA s16.4)
```

Validation order and refusal codes follow DATA s5.1 (V2: including step 6a, the spare-part register write for designated positions, SP02). A whole request fails if any line fails; nothing is partially committed (JOB05, JOB08). Retrying with the same `Idempotency-Key` returns the original 200 with `Idempotent-Replayed: true` (JOB06).

Correction request (one atomic correction, DATA s5.3):

```ts
{ version: Version; reason: string;
  job?: { title?: string; description?: string; priority?: string | null; plannedOn?: DateOnly | null;
          responsiblePerson?: string | null; completionNote?: string; completedOn?: DateOnly; kind?: 'repair' | 'replacement' };
  lineAmendments?: Array<{ lineId: Id; lineVersion: Version; itemDescription?: string; manufacturer?: string | null;
                           modelOrPartNumber?: string | null; serialNumber?: string | null; note?: string | null;
                           removedItemDescription?: string | null; removedItemSerial?: string | null;
                           replacedOn?: DateOnly; quantity?: number }>;
  voidLines?: Array<{ lineId: Id; lineVersion: Version }>;
  addLines?: Array<CompleteLine> }   // same shape as complete lines
```

### 4.9 Evidence and protected documents

| Method and path | Policy | Purpose / acceptance |
| --- | --- | --- |
| `POST /jobs/{jobId}/attachments` | `F:eq.work`; Idempotency-Key; `multipart/form-data` (`file`, `caption?`, `replacementLineId?`) | Upload evidence to a non-cancelled job (FILE02, FILE03). 413 `file_too_large`, 415 `unsupported_media_type` (extension and signature must both be JPEG/PNG/PDF), 409 `job_cancelled` |
| `GET /jobs/{jobId}/attachments` | `F:eq.jobs.view` | Attachment metadata (`documentId`, sanitized name, type, bytes, caption, uploader, utc, state) |
| `POST /jobs/{jobId}/attachments/{attachmentId}/remove` | `F:eq.work` (uploader while job uncompleted) or `F:eq.work.admin`; Idempotency-Key | `{ reason }`; marks removed, content retained |
| `GET /documents/{documentId}` | by kind (DATA s14.4): drawings, reference photos, model assets `F:eq.fleet.view`; work evidence `F:eq.jobs.view` (Repair-R02B, D-139) | Metadata: kind, title, drawing number, pages, bytes, sha256, links (no storage key or path) |
| `GET /documents/{documentId}/content?disposition=inline|attachment` | as metadata, by kind; FAC photo kinds are not served here (s4.24) | Streams content; range requests supported; `Content-Disposition` with sanitized RFC 6266 filename; `X-Content-Type-Options: nosniff`; PDFs/images inline, others attachment; `Cache-Control: private, no-store`; ETag = sha256. Unknown/removed/guessed IDs -> 404 `not_found`; missing file -> 404 `file_unavailable` (FILE01, FILE04, FILE05) |
| `GET /equipment-models/{modelId}/documents` | `F:eq.fleet.view` | Source drawings linked to a model family with page references (S14) |

There is no endpoint that accepts a file path or URL to fetch; source drawings enter only through `AdminCli import-drawings` (FILE03).

### 4.10 Technical parameters

| Method and path | Policy | Purpose / acceptance |
| --- | --- | --- |
| `GET /equipment/{equipmentId}/parameters?use=major|technical|all` | `F:eq.fleet.view` | Effective parameters for the equipment (S14, SRC05, SRC06) |
| `GET /equipment-models/{modelId}/parameters` | `F:eq.fleet.view` | Family-level observations and values (reference view) |

Response item:

```ts
{ code: string; label: string; unit: string | null; use: 'major' | 'technical';
  effective: { value: number | string | null; unit: string | null; condition: string | null;
               basis: 'equipmentOverride' | 'modelValue' | 'singleObservation' | 'unresolvedConflict' | 'none' };
  observations: Array<{ id: Id; value: number | string; unit: string | null; condition: string | null;
                        drawingNumber: string; pdfPage: number; documentId: Id | null; verification: string }>;
  decision: { reason: string; by: Actor; utc: Instant; selectedObservationId: Id | null } | null }
```

`effective.basis = 'none'` with an explanation when the equipment has no verified model. `total-lift-height` always carries the condition "Not overall crane height".

### 4.11 Scene models and protected model assets

| Method and path | Policy | Purpose / acceptance |
| --- | --- | --- |
| `GET /equipment/{equipmentId}/scene` | `F:eq.fleet.view` | Active binding for the viewer: `{ sceneModelVersionId, modelCode, version, assetUrl, manifestUrl, assetSha256, entries: Array<{ nodeKey, partPositionId?, subInstanceId?, source }>, noVisualPositionIds: Id[] }`; or 200 `{ available: false, reason: 'notAvailableStage1' | 'noVerifiedModel' | 'noActiveBinding' }` (VIS07) |
| `GET /scene-model-versions/{versionId}/asset` | `F:eq.fleet.view` | `model/gltf-binary` GLB; `Cache-Control: private, no-cache`; ETag sha256; 304 on match (FILE01, D-39) |
| `GET /scene-model-versions/{versionId}/manifest` | `F:eq.fleet.view` | Manifest JSON (DATA s10.3) with the same caching |

A version that is `draft` is readable only by Admin (`F:admin.access`) for validation previews.

### 4.12 Admin: catalogue

All `F:admin.access`; POSTs carry Idempotency-Key; every change audited.

| Method and path | Body | Notes |
| --- | --- | --- |
| `POST /admin/catalog/main-mechanisms` | `{ code, name, description?, reason? }` | two-digit string code (U1-C22); 409 `duplicate_code`; 422 `code_unassigned_reserved` for `10`; 422 `validation_failed` for another format or `00` |
| `PUT /admin/catalog/main-mechanisms/{id}` | `{ version, name, description, reason? }` | code immutable; prior values kept in the audit (DATA s3.1 C2a) |
| `POST /admin/catalog/sub-mechanisms` | `{ code, mainDefinitionId, name, description, reason? }` | code = parent main code + one digit, unique across the catalogue; 409 `duplicate_code`; 422 `parent_inactive`; parent immutable afterwards |
| `PUT /admin/catalog/sub-mechanisms/{id}` | `{ version, name, description, reason? }` | 422 `reserved_definition` (use define-reserved); 409 `approved_name_locked` when the name of `061` Spreader or `062` Headblock would change (description editable) |
| `POST /admin/catalog/sub-mechanisms/{id}/define-reserved` | `{ version, name, description, reason }` | only `048`/`063`-style reserved entries |
| `POST /admin/catalog/{main|sub}-mechanisms/{id}/deactivate` and `/activate` | `{ version, reason }` | deactivation keeps history (ADM04) |
| `GET /admin/catalog/import-report` | - | last `import-mechanisms` report (created/updated/unchanged/conflicts) (ADM05) |

### 4.13 Admin: types, models, applicability, templates, equipment, instances, positions

Every `/admin/...` endpoint in s4.13 and s4.14 requires `F:admin.access` (resolves R01 N4); POSTs carry an Idempotency-Key; every change is audited.

| Method and path | Body / purpose | Acceptance |
| --- | --- | --- |
| `GET /equipment-types`, `GET /equipment-models`, `GET /equipment-models/{id}` | read (`F:eq.fleet.view|eq.jobs.view|admin.access`) | S01 |
| `POST /admin/equipment-types`, `PUT /admin/equipment-types/{id}` | `{ code, name, sortOrder }` / `{ version, ... }` | S01 |
| `POST /admin/equipment-models`, `PUT /admin/equipment-models/{id}`, `POST .../{id}/activate|retire` | model family CRUD (no delete) | S01 |
| `GET /equipment-models/{id}/applicability` (`F:eq.fleet.view|admin.access`); `PUT /admin/equipment-models/{id}/applicability` | `{ version, entries: [{ subDefinitionId, state, note, sourceReference }] }` full replacement; increments TemplateRevision; never touches equipment | SRC04 |
| `GET /admin/equipment-models/{id}/position-templates` | list with source references and status | B-08 |
| `POST /admin/equipment-models/{id}/position-templates/generate-from-scene` | `{ sceneModelVersionId }` -> creates `draft` templates for manifest `position` nodes (key, classification, label, provenance, sources); existing keys reported, not overwritten | B-08, T3 |
| `POST /admin/equipment-models/{id}/position-templates`, `PUT .../{templateId}`, `POST .../{templateId}/confirm|deactivate` | edit/confirm templates | T2 |
| `POST /admin/equipment` | `{ code, name?, equipmentTypeId, serialNumber?, manufacturer?, commissionedOn? }` -> Unreported, no model | ADM01, SRC06 |
| `PUT /admin/equipment/{id}` | `{ version, code, name, serialNumber, manufacturer, commissionedOn }` | 409 `duplicate_code` |
| `POST /admin/equipment/{id}/retire` / `/reactivate` | `{ version, reason }`; 409 `open_jobs_exist` | ADM04 |
| `POST /admin/equipment/{id}/model-association` | `{ version, equipmentModelId | null, note }` -> `verified`/`unassigned` | SRC06 |
| `POST /admin/equipment/{id}/instantiation/preview` | `{ templateRevision }` -> additions (sub instances, positions), unknown-applicability items needing a decision, nothing written | ADM02 |
| `POST /admin/equipment/{id}/instantiation` | `{ templateRevision, includeUnknownSubDefinitionIds: Id[] }` -> creates `draft` instances/positions only | ADM02, P2, P4 |
| `POST /admin/equipment/{id}/positions/confirm` | `{ positionIds: Id[] }` (with each `version`) -> `active` | B-08 |
| `POST /admin/equipment/{id}/mechanism-instances`, `POST .../{instanceId}/deactivate|activate` | equipment-specific additions/removals, audited | S10 |
| `POST /admin/equipment/{id}/positions`; `PUT /admin/equipment/{id}/positions/{positionId}`; `POST .../{positionId}/deactivate|reactivate|delete` | add (U1-C22: `{ name, subInstanceId, semanticKey, kind, uom?, sourceReference? }` -> a `draft` position of this equipment only; 409 `duplicate_semantic_key`; 422 for the s10.2 grammar, a `container.` key or an inactive/reserved definition), rename; edit SemanticKey and the sub instance only while the position is `draft` without references (409 `position_key_frozen` / `ancestors_frozen` once confirmed); edit kind/UOM until history exists (409 `history_exists`); delete only draft without references (DATA s3.4 P2/P3) | P2, P3 |
| `POST /admin/equipment/{id}/positions/{positionId}/baseline-installation` | `{ itemDescription, manufacturer?, modelOrPartNumber?, serialNumber?, quantity, uom, installedOn: DateOnly | null, sourceNote }` (D-36) | HIS04 |
| `POST /admin/parameters/values` | `{ parameterCode, scopeType, scopeId, value, unit, condition, selectedObservationId?, reason, sourceNote? }` -> new current value, prior kept (superseded, IsCurrent = 0); Basis `resolvedConflict` for a conflicting parameter, else `adminEntered` (U1-C22) | ADM06, SRC05 |
| `POST /admin/parameters/definitions` (U1-C22) | `{ label, unit, condition?, use: major|technical, equipmentModelId, mechanismCode?, value, sourceNote, reason? }` -> an Admin-entered ParameterDefinition (Origin `admin`) and its first value in one transaction; 409 `duplicate_code` for an existing label/code; 422 without `sourceNote` | ADM06 |
| `PUT /admin/parameters/definitions/{code}` (U1-C22) | `{ version, label, unit, condition, use, mechanismCode }` - Admin-entered rows only (409 `source_definition_fixed` for drawing-derived rows); prior definition kept in the audit | ADM06 |
| `POST /admin/parameters/observations` | manual observation with source document/page | S14 |

All IDs in bodies are verified to belong to the equipment/model in the route (422 `target_not_in_equipment`) (ADM03).

### 4.14 Admin: scene versions and bindings

| Method and path | Body / purpose | Acceptance |
| --- | --- | --- |
| `GET /admin/scene-models`, `GET /admin/scene-model-versions/{id}` | versions with status and validation report | VIS09 |
| `POST /admin/equipment/{id}/scene-binding/validate` | `{ sceneModelVersionId, mappings: [{ nodeKey, partPositionId?, subInstanceId?, note }], noVisual: [{ partPositionId, note }] }` -> report per DATA s10.5 (proposed exact matches, orphans, changed, unbound, errors); writes a `draft` binding | VIS05 |
| `POST /admin/equipment/{id}/scene-binding/activate` | `{ bindingId, version }` -> 409 `binding_orphans_unresolved` while B3/B6 fail; supersedes previous active binding atomically | VIS05 |

Scene versions are registered only by `AdminCli register-scene-version` (no browser upload of model files in stage 1).

### 4.15 Admin: audit and lookups

| Method and path | Policy | Purpose |
| --- | --- | --- |
| `GET /admin/audit?entityType=&entityId=&equipmentId=&action=&from=&to=&limit=&cursor=` | `F:admin.access` | Raw audit entries (before/after JSON) |
| `GET /admin/user-profiles?active=` | `F:admin.access` | Local profiles and roles (read-only; changes come only from central convergence) |

### 4.16 Crane view current state (V2: S07, U1-C19, HIS06)

The four right-panel tabs of the crane view (DATA s18.1, D-122). All `F:eq.fleet.view`. Common query: `scope=equipment|main|sub|part&targetId=` (targetId required unless `scope=equipment`; 422 `target_not_in_equipment`). Every response starts with the echo `{ equipmentId, scope, targetId, tab }` for the race guard (HIS05). No endpoint here returns installation events, status changes, corrections, job progress, register history or earlier ZMMS days; `special` lists completed special jobs as the allowlisted projection only (U1-C23, D-155). Special jobs whose display switch is off (DATA J7) are in no response, count or badge here (U1-C26).

| Method and path | Response (after the echo) |
| --- | --- |
| `GET /equipment/{equipmentId}/current-state/summary?scope=&targetId=` | `{ status: StatusSummary; badges: { maintenanceToday: number | null; specialOpen: number; sparePartsOverdue: number; sparePartsDueSoon: number } }` (`specialOpen` = open, shown jobs; the same count feeds the tree and flat/3D label work badges) |
| `GET /equipment/{equipmentId}/current-state/maintenance?scope=&targetId=` | `{ zmmsMapped: boolean; businessDate: DateOnly; dataFrom: Instant | null; stale: boolean; equipmentLevelNote: true; jobs: ZmmsDailyJobView[] }` - today's present rows only; `jobs: []` with `zmmsMapped: false` for unmapped equipment |
| `GET /equipment/{equipmentId}/current-state/special?scope=&targetId=` | `{ jobs: CurrentSpecialJob[]; moreCompleted: boolean; counts: { pending: number; current: number; completed: number; cancelled: number }; openInJobs: { equipment: Id; scope: string; target: Id | null } | null }` - DATA s9 scope rule, de-duplicated; U1-C23: `jobs` holds every open job and the 50 most recent completed jobs of the scope (cancelled jobs counted only), newest first by `listedOn` then number desc; `moreCompleted` when older completed jobs exist (they are in the Jobs tab); hidden jobs (U1-C26) are in neither `jobs` nor `counts`. Uses the separate allowlisted DTO below, never `JobSummary` or `ReplacementLineView`, including for reopened jobs. `openInJobs` is null when the caller lacks `eq.jobs.view` (the panel then shows no Open in Jobs link and no job-record links, D-139) |
| `GET /equipment/{equipmentId}/current-state/technical?scope=&targetId=` | `{ identity: {...}; model: {...} | null; attributes: { commissionedOn: DateOnly | null; serialNumber: string | null; manufacturer: string | null } | null; definition: { code: string; name: string; description: string | null } | null; positionCounts: { serialized: number; quantityLot: number } | null; currentInstallations: InstallationView[] | null; sourceReferences: [...]; provenance: {...} | null; parameters: ParameterItem[]; sceneUnavailableReason: string | null }` - fields per scope as DATA s18.1; `ParameterItem` = s4.10 item |
| `GET /equipment/{equipmentId}/current-state/spare-parts?scope=&targetId=` | `{ rows: SparePartRow[]; notMajorSparePart: boolean }` (`notMajorSparePart` true for a part scope whose position is not designated) |

```ts
// Fleet current-state projection; these are the only fields allowed, even with eq.jobs.view.
type CurrentSpecialJob = {
  id: Id; number: string; equipment: { id: Id; code: string; type: string };
  equipmentTypeCode?: string; // U1-C51: shared type scope; equipment above is the requested page context
  target: TargetRef; kind: 'repair' | 'replacement' | 'project'; title: string;
  workStatus: 'pending' | 'current' | 'completed'; plannedOn: DateOnly | null;
  completedOn: DateOnly | null;   // U1-C23: completion business date of a completed job; null for open and reopened jobs
  listedOn: DateOnly;             // U1-C23: sort date = completedOn, or the Asia/Colombo business date of CreatedUtc for an open job
  matchingPositions: { id: Id; displayName: string }[];
};
// No description, completion note, completer, cancellation fields, actors/audit timestamps, events,
// corrections, attachments/evidence, or replacement installation/removal details (completed jobs too).
// Matching positions identify scope membership only; they are not replacement events.
// The prototype represents target/equipment as scalar IDs and matchingPositions as
// matchingLines: [{ positionId }], with the same allowlist and detached value semantics.
type ZmmsDailyJobView = { id: Id; zmmsJobNumber: string; jobDate: DateOnly; equipment: { id: Id; code: string } | null;
  equipmentText: string; jobType: string | null; jobStatus: string | null; description: string | null;
  typeEffect: 'breakdown' | 'maintenance' | 'none' | 'unmapped'; statusEffect: 'open' | 'closed' | 'unmapped';
  sourceState: 'present' | 'absentFromSource'; extra: Record<string, string>;      // provisional fields (DATA s20)
  lastSeenUtc: Instant };
type SparePartRow = { equipment: { id: Id; code: string; type: string }; position: { id: Id; semanticKey: string; displayName: string;
  mainCode: string; subCode: string; kind: 'serialized' | 'quantityLot' };
  sparePartType: { code: string; name: string };
  condition: 'original' | 'replaced' | null;  // null = Not recorded
  brand: string | null; modelOrPartNumber: string | null; serialNumber: string | null; itemDescription: string | null;
  replacedOn: DateOnly | null; replacedPartial: boolean;
  expectedLifeMonths: number | null; expectedLifeSource: 'position' | 'type' | null;
  nextPredictedReplacement: DateOnly | null;
  predictionUnavailableReason: 'conditionNotRecorded' | 'commissioningDateUnknown' | 'expectedLifeNotSet' | null;
  flag: 'overdue' | 'dueSoon' | null; remarks: string | null; version: Version; updatedUtc: Instant | null };
```

### 4.17 EQ Jobs tab (V2: S08, S20, S21, S22)

Shared filters on every list here: `equipmentId=`, `type=QC|RTG|ES` (equipment type code), `from=`, `to=` (business dates), `q=`. Special jobs use s4.6-s4.8 unchanged.

| Method and path | Policy | Purpose / acceptance |
| --- | --- | --- |
| `GET /zmms/daily-jobs?equipmentId=&type=&from=&to=&q=&sourceState=present,absentFromSource&limit=&cursor=&sort=date_desc` | `F:eq.jobs.view` | Read-only daily jobs shown in the Daily work (CMMS) tab (U1-C20); matched rows only; every synced day; `{ items: ZmmsDailyJobView[]; nextCursor; dataFrom: Instant | null; stale: boolean }` (ZM07). Default range: today |
| `GET /zmms/freshness` | `F:eq.fleet.view|eq.jobs.view` | `{ enabled, lastSucceededRunEndUtc, businessDate, stale }` for "ZMMS data from" |
| `GET /status-board?type=&q=&source=zmms,manual&mode=` | `F:eq.jobs.view` | EQ status part: one row per active equipment `{ equipment, status: StatusSummary }` with Correct / Back to automatic offered by capabilities (S21) |
| `GET /status-changes?equipmentId=&type=&from=&to=&source=&kind=&limit=&cursor=` | `F:eq.jobs.view` | Status history across equipment, newest first, same item shape as s4.3 status history (ZM05, ZM06, JOB02) |
| `GET /spare-parts?equipmentId=&type=&mainCode=&subCode=&flag=overdue,dueSoon,notRecorded&q=&limit=&cursor=&sort=predicted_asc` | `F:eq.jobs.view` | Spare-part register rows (`SparePartRow`) (SP01, SP03) |
| `GET /equipment/{equipmentId}/positions/{positionId}/spare-part` | `F:eq.jobs.view` | `{ current: SparePartRow; history: Array<{ revision, source, before, after, job: {id, number} | null, reason, by: Actor | null, utc }> }` - per-part history, newest first (SP04) |

### 4.18 Spare-part register commands (V2: S22)

All `F:eq.work`, Idempotency-Key, body `version` = the register row's version (null when the position has no register row yet). 422 `not_major_spare_part` for an undesignated position; 409 `equipment_retired`; 422 `position_not_active`. Responses return the new `SparePartRow`. Rules: DATA s16.3.

| Method and path | Body |
| --- | --- |
| `POST /equipment/{equipmentId}/spare-parts` (U1-C21) | `{ positionId, sparePartTypeId, expectedLifeMonthsOverride: number | null, condition: 'original' | 'replaced' | 'keep', replacedOn?: DateOnly, itemDescription?, brand?, modelOrPartNumber?, serialNumber?, remarks? }` - EQ Team and Admin add a not-yet-designated active position of this equipment to its register with its first condition in one transaction (DATA s16.3 "Add spare part"); 422 `target_not_in_equipment`, `position_not_active`, `validation_failed` (inactive type, life outside 1..600, missing description, `keep` without an installation), `date_in_future`; 409 `already_major_spare_part`, `position_has_installation_history`, `out_of_order_installation`, `equipment_retired`. Response `SparePartRow`; history source `registerAdd` |
| `POST /equipment/{equipmentId}/positions/{positionId}/spare-part/record-original` | `{ version, itemDescription, brand?, modelOrPartNumber?, serialNumber?, remarks? }` -> 409 `position_has_installation_history` |
| `POST /equipment/{equipmentId}/positions/{positionId}/spare-part/record-replacement` | `{ version, expectedCurrentInstallationId: Id | null, replacedOn: DateOnly, itemDescription, brand?, modelOrPartNumber?, serialNumber?, removedItemKnown: boolean, removedItemDescription?, removedItemSerial?, quantity, uom, remarks? }` -> 409 `installation_changed`, `out_of_order_installation`; 422 `date_in_future`, `quantity_invalid` |
| `POST /equipment/{equipmentId}/positions/{positionId}/spare-part/amend` | `{ version, itemDescription?, brand?, modelOrPartNumber?, serialNumber?, reason }` (amends the current installation; no event) |
| `POST /equipment/{equipmentId}/positions/{positionId}/spare-part/remarks` | `{ version, remarks }` |
| `POST /equipment/{equipmentId}/positions/{positionId}/spare-part/void-latest` | `F:eq.work.admin`; `{ version, reason }` -> 409 `later_installation_exists` |

Job completion (s4.8): each line may carry `conditionRemarks: string | null`; for a line at a designated position the response `lines[n].sparePart` contains the written `SparePartRow`. The completion dialog pre-fills the condition form from the same line fields (DATA s16.4, SP02).

### 4.19 Admin: spare parts and EQ settings (V2)

All `F:admin.access`; Idempotency-Key on POST; audited.

| Method and path | Body / purpose | Acceptance |
| --- | --- | --- |
| `GET /admin/spare-part-types`; `POST /admin/spare-part-types`; `PUT /admin/spare-part-types/{id}`; `POST .../{id}/deactivate|activate` | `{ code, name, defaultExpectedLifeMonths | null, sortOrder }` / `{ version, name, defaultExpectedLifeMonths, sortOrder }`; 409 `duplicate_code`; a deactivated (retired) type is refused for new designations and additions, designated positions keep it (U1-C22) | SP01 |
| `PUT /admin/equipment-models/{id}/position-templates/{templateId}/spare-part` | `{ version, sparePartTypeId | null }` (template designation; existing positions unchanged) | SP01 |
| `PUT /admin/equipment/{id}/positions/{positionId}/spare-part` | `{ version, isMajorSparePart, sparePartTypeId | null, expectedLifeMonthsOverride | null }` (history row `designation`). Admin-only type/life changes and undesignation; adding a part with its condition is `POST /equipment/{equipmentId}/spare-parts` (s4.18, `F:eq.work`, U1-C21) | SP01, SP03 |
| `GET /admin/settings/eq`; `PUT /admin/settings/eq` | `{ version, sparePartDueSoonDays, fleetRefreshSeconds }` | SP03 |
| `PUT /admin/equipment/{id}` (s4.13) | `commissionedOn` is the commissioning date used for Original parts | SP03 |

### 4.20 Admin: ZMMS (V2: S20, S21)

All `F:admin.access`; Idempotency-Key on POST; audited. No endpoint accepts, returns or echoes the ZMMS account.

| Method and path | Body / purpose | Acceptance |
| --- | --- | --- |
| `GET /admin/zmms/health` | `{ configured: boolean; missingConfigurationKeys: string[] /* names only */; enabled: boolean; lastRun: RunSummary | null; lastSucceeded: RunSummary | null; stale: boolean; state: 'ok' | 'failing' | 'notConfigured' | 'disabled'; nextScheduledUtc: Instant | null; nextRetryUtc: Instant | null }` | ZM02, ZM04, ZM08 |
| `GET /admin/zmms/settings`; `PUT /admin/zmms/settings` | `{ version, syncTime1: 'HH:mm', syncTime2: 'HH:mm', automaticStatusEnabled: boolean, staleAfterHours }`; 422 `zmms_mapping_incomplete` when enabling with unmapped values (DATA s15.8) | ZM05 |
| `POST /admin/zmms/sync-now` | `{}` -> 202 `{ runId, alreadyRunning: boolean }` (a concurrent request returns the running run, never a second run, ZM01); 409 `zmms_disabled`; 503 `zmms_not_configured` with key names | ZM01, ZM08 |
| `GET /admin/zmms/runs?outcome=&from=&to=&limit=&cursor=`; `GET /admin/zmms/runs/{runId}` | run records (DATA s15.5) with counters, failure code/detail and, for succeeded runs, per-equipment evaluations | ZM01, ZM02 |
| `GET /admin/zmms/equipment-keys?state=unmatched|mapped|ignored&q=` | unmatched queue and mapped keys with row counts and first/last date | ZM03 |
| `POST /admin/zmms/equipment-mappings` | `{ equipmentKey, action: 'map' | 'ignore', equipmentId: Id | null }` -> attaches existing rows in the same transaction; 409 `duplicate_code` for an active key | ZM03 |
| `POST /admin/zmms/equipment-mappings/{id}/retire` | `{ version, reason }` | ZM03 |
| `GET /admin/zmms/values?field=jobType|jobStatus` | distinct values with raw text, effect, counts, first/last seen | ZM05 |
| `PUT /admin/zmms/value-mappings` | `{ version, field, entries: [{ sourceKey, effect }] }` full replacement for that field | ZM05 |
| `GET /admin/zmms/daily-jobs?matchState=unmatched&...` | all rows including unmatched, for mapping work | ZM03 |

```ts
type RunSummary = { id: Id; trigger: string; businessDate: DateOnly; startedUtc: Instant; endedUtc: Instant | null;
  outcome: 'running' | 'succeeded' | 'failed' | 'abandoned'; failureCode: string | null; failureDetail: string | null;
  rowsRead: number; rowsNew: number; rowsUpdated: number; rowsUnmatched: number; statusChangesApplied: number };
```

### 4.21 Admin: Access matrix (V2: S19)

| Method and path | Policy | Body / purpose | Acceptance |
| --- | --- | --- | --- |
| `GET /admin/access` | `F:admin.access` | `{ version, policyVersion, roles: [...], features: [...], cells: [{ roleCode, featureKey, state: 'fixedOn' | 'notAllowed' | 'toggle', isOn: boolean, isDefault: boolean, updatedBy: Actor | null, updatedUtc: Instant | null }] }` | ACC02, ACC03 |
| `PUT /admin/access` | `F:admin.access`; Idempotency-Key | `{ version, changes: [{ roleCode, featureKey, isOn }], reason: string | null }` -> applied atomically; 422 `access_cell_not_toggleable` (any fixed or not-allowed cell; nothing applied); 409 `version_conflict` | ACC02, ACC03, ACC04 |
| `GET /admin/access/changes?roleCode=&featureKey=&from=&to=&limit=&cursor=` | `F:admin.access` | change history: actor, time, old -> new, reason | ACC02 |

### 4.22 FAC queries (V2: S24, S25, S28)

```ts
type FacJobSummary = { id: Id; number: string; version: Version;
  discipline: { code: string; name: string }; type: { code: string; name: string; icon: string };
  name: string; frequency: { code: string; label: string } | null; quantity: number; kind: 'recurring' | 'oneTime' | 'continuous';
  pic: { profileId: Id | null; name: string } | null; mode: 'inHouse' | 'outsource' | null;
  state: 'active' | 'closed' | 'deactivated'; status: 'pending' | 'inProgress' | 'onHold' | 'completed';
  flags: Array<'overdue' | 'dueSoon'>; holdReason: string | null;
  currentCycle: { id: Id | null; version: Version | null; basis: 'rolling' | 'period'; periodStart: DateOnly | null; periodEnd: DateOnly | null;
                  dueOn: DateOnly | null; dueBasis: string; noDueReason: string | null; daysOverdue: number | null; dueInDays: number | null;
                  completedQuantity: number; targetQuantity: number; percent: number };
  lastDoneOn: DateOnly | null; jobPicture: { photoId: Id; thumbUrl: string } | null; remarks: string | null;
  origin: 'facImport' | 'user'; sourceRow: number | null; updatedUtc: Instant; statusChangedUtc: Instant | null;
  showOnDashboard: boolean };   // U1-C26: the shared "Show on dashboard" switch (DATA F7)
```

| Method and path | Policy | Purpose / acceptance |
| --- | --- | --- |
| `GET /fac/jobs?view=mywork|all&status=pending,inProgress,onHold,completed&flag=overdue,dueSoon&discipline=&type=&mode=&pic=&frequency=&kind=&state=active|closed|deactivated|all&display=all|shown|hidden&q=&sort=&limit=&cursor=` | `F:fac.jobs.view` | FAC Jobs board/list and My work (own PIC first) (FAC10). `pic` = a profile ID or `name-<slug>` of a typed name. Counts per status in `totals` |
| `GET /fac/jobs/{jobId}` | `F:fac.jobs.view|fac.dashboard.view` | `FacJobSummary` + timeline (newest first: updates with photos and undo marks, holds/releases, corrections, master edits) + the 14 most recent previous cycles `{ sequence, periodOrDue, completedOn, onTime: 'onTime' | 'late' | 'missed' | 'noDueDate', lateDays }` and `moreCycles: boolean` (read-only for Management). Resource rule (D-140): a caller with `fac.dashboard.view` but without `fac.jobs.view` may read only an **active** job (the population of the dashboard, s4.25), because this is the detail a dashboard row opens (SOW V2 5.5.7); a closed or deactivated job, or one whose display switch is off (U1-C26, D-159), then returns 404 `not_found` |
| `GET /fac/jobs/{jobId}/cycles?limit=&cursor=` | `F:fac.jobs.view` | all cycles (paged); FAC Jobs tab only (D-140) |
| `GET /fac/lists` | `F:fac.jobs.view|fac.dashboard.view|admin.access` | active disciplines, types, frequencies and the FAC Team users selectable as PIC (display names only) |

### 4.23 FAC commands (V2: S23-S25, S28)

All POSTs carry an Idempotency-Key. Concurrency: job `version` for master/hold commands; `cycleVersion` for progress (DATA s17.5). Responses return the updated `FacJobSummary` (and the update).

| Method and path | Policy | Body | Result / errors |
| --- | --- | --- | --- |
| `POST /fac/jobs` | kind `oneTime`: `F:fac.oneTimeJobs.add` or `F:fac.masterList.manage`; other kinds: `F:fac.masterList.manage` | `{ disciplineCode, typeCode, name, frequencyCode, quantity = 1, kind, picProfileId?, picName?, mode?, lastDoneOn?, remarks?, jobPictureUploadId? }` | 201; 422 `validation_failed`, `kind_frequency_mismatch`; opens cycle 1 (ACC04) |
| `PUT /fac/jobs/{jobId}` | `F:fac.masterList.manage`; or the creator of a one-time job without progress with `F:fac.oneTimeJobs.add` | `{ version, disciplineCode, typeCode, name, frequencyCode, quantity, kind, picProfileId, picName, mode, lastDoneOn, remarks }` | 200; 409 `quantity_below_progress`, `version_conflict`; 422 rules DATA s17.2 F2-F6 (ACC04) |
| `POST /fac/jobs/{jobId}/deactivate` / `reactivate` | `F:fac.masterList.manage` | `{ version, reason }` | never deletes (S23) |
| `POST /fac/jobs/{jobId}/progress` | `F:fac.work` | `{ cycleId: Id | null; cycleVersion: Version | null; periodStart: DateOnly | null; quantity: number | null; allDone: boolean; workDate: DateOnly; note: string | null; photoUploadIds: Id[]; confirmCompletion: boolean; nextDueOn: DateOnly | null }` | 201 update; 409 `job_on_hold`, `job_not_active`, `version_conflict`, `completion_confirmation_required`, `cycle_already_completed`; 422 `quantity_exceeds_remaining`, `quantity_invalid`, `date_in_future`, `date_outside_cycle`, `date_before_previous_completion`, `next_due_required`, `too_many_photos`, `upload_invalid` (FAC05-FAC07, FAC09) |
| `POST /fac/jobs/{jobId}/done-today` | `F:fac.work` | `{ periodStart: DateOnly; cycleVersion: Version | null; note?: string; photoUploadIds?: Id[] }` (Daily jobs only; 422 `validation_failed` otherwise) | 201; 409 `cycle_already_completed` on a repeat tap (FAC05) |
| `POST /fac/jobs/{jobId}/done-this-week` | `F:fac.work` | same (Weekly jobs only) | same |
| `POST /fac/jobs/{jobId}/hold` / `release` | `F:fac.work` | `{ version, reason }` / `{ version }` | 422 `reason_required` (FAC08) |
| `POST /fac/progress-updates/{updateId}/undo` | `F:fac.work` (author only) | `{ reason: string | null }` | 403 `not_update_author`; 409 `undo_window_passed`, `not_latest_update`, `later_progress_exists` (FAC07) |
| `POST /fac/jobs/{jobId}/job-picture` | `F:fac.work` or `F:fac.masterList.manage` | `{ version, photoUploadId }` | replaces the active picture (FAC09) |
| `PUT /fac/jobs/{jobId}/display` (U1-C26) | `F:fac.work` (FAC Team and Admin; EQ Team and Management 403 `forbidden_role`) | `{ version, showOnDashboard: boolean, reason: string | null }` (reason <= 500) | 200 `FacJobSummary`. Any FAC job of any kind (recurring, one-time, continuous) and state; an unchanged value writes nothing; 409 `version_conflict`; 422 `validation_failed`. Changes no master field, cycle, progress or photo; timeline entry, `AuditEntry` `fac.job.display`, FacDataVersion + 1 (DATA F7) |

### 4.24 FAC photos (V2: S26)

| Method and path | Policy | Purpose / acceptance |
| --- | --- | --- |
| `POST /fac/photo-uploads` | `F:fac.work|fac.masterList.manage|fac.oneTimeJobs.add`; Idempotency-Key; `multipart/form-data` (`file`) | Stage one photo: `{ uploadId, expiresUtc, width, height, bytes }`; 413 `file_too_large` (> 10 MiB); 415 `unsupported_media_type` (extension and signature must both be JPEG or PNG); 422 `validation_failed` (undecodable, > 50 MP, unsafe filename) (FAC09). The phone UI uses `<input type="file" accept="image/jpeg,image/png" capture="environment">` |
| `GET /fac/photos/{photoId}/content?size=full|thumb` | `F:fac.dashboard.view|fac.jobs.view`; removed photos `F:fac.work.admin`; with `fac.dashboard.view` alone only photos of active jobs shown on the dashboard (D-140, D-159) | Streams the re-encoded image; `private, no-cache`, sha256 ETag, `nosniff`; unknown/guessed/removed IDs 404 `not_found` (FAC09, FDB06) |
| `POST /fac/photos/{photoId}/remove` | `F:fac.work` (uploader, same business day) or `F:fac.work.admin` (any, reason required) | `{ reason: string | null }`; marks removed; content retained (FAC09) |

### 4.25 FAC Dashboard (V2: S27)

| Method and path | Policy | Purpose / acceptance |
| --- | --- | --- |
| `GET /fac/dashboard?discipline=&type=&mode=&pic=&focus=overdue|dueSoon|inProgress|completed|onHold` | `F:fac.dashboard.view` | One summary call for the 60-second poll (DATA s18.4). Population: jobs whose display switch is on (U1-C26). `ETag` + `If-None-Match` -> 304 (D-120). TV mode and the phone layout use the same call. There is no anonymous or token-in-URL variant (FDB05) |

Response:

```ts
{ generatedUtc: Instant; businessDate: DateOnly; dataVersion: number;
  filters: { discipline: string | null; type: string | null; mode: string | null; pic: string | null; focus: string | null };
  settings: { refreshSeconds: number; scrollPixelsPerSecond: number; reducedMotionPageSeconds: 8; dueSoonDays: number };
  kpis: { totalActive: number; completedThisCycle: number; inProgress: number; onHold: number; overdue: number; dueSoon: number;
          onTimePercent30d: number | null; onTimeBasis: { onTime: number; total: number }; todaysChecks: { done: number; total: number } };
  lanes: Array<{ discipline: { code: string; name: string }; completionPercent: number | null; counts: { active: number; completed: number };
                 rows: Array<{ group: 'overdue' | 'onHold' | 'inProgress' | 'dueSoon' | 'pending' | 'completedRecently' | 'upToDate';   // upToDate: U1-C24
                               job: Pick<FacJobSummary, 'id' | 'number' | 'type' | 'name' | 'frequency' | 'pic' | 'mode' | 'status' | 'flags' | 'holdReason' | 'jobPicture' | 'statusChangedUtc'>;
                               progress: { completed: number; target: number; percent: number };
                               due: { label: 'dueInDays' | 'overdueDays' | 'dueToday' | 'dueThisWeek' | 'none'; days: number | null; dueOn: DateOnly | null } }> }>;
  ticker: Array<{ utc: Instant; who: string; job: { id: Id; name: string }; kind: 'progress' | 'completed' | 'hold' | 'release'; quantity: number | null }>;
  latestProof: Array<{ photoId: Id; thumbUrl: string; job: { id: Id; name: string }; workDate: DateOnly; who: string }>;
  dueLoad: { excludes: 'dailyAndWeeklyChecks'; weeks: Array<{ weekStart: DateOnly; byDiscipline: Record<string, number> }> } }
```

The `discipline`, `type`, `mode` and `pic` predicates apply to both `onTimeBasis` counts and every other block (DATA s18.4). With no eligible completed cycle, `onTimePercent30d` is null and `onTimeBasis` is `{ onTime: 0, total: 0 }`; the UI shows no percentage. Matching completed rolling cycles remain eligible if their job has since closed or deactivated. `focus` narrows lane rows only.

Rows are in display order (group order, then the in-group sort of DATA s18.4). U1-C24: every active, shown job of a lane is a row; jobs completed more than 7 days ago that are not yet due soon or overdue are the last group, `upToDate` ("Done, up to date" with `due.dueOn` = the next due date, or `due.label` `none`); `focus=completed` includes them. The client keeps its scroll position and only patches changed rows on refresh (FDB04); on failure it keeps the last data with "Updated hh:mm" and a warning.

### 4.26 Admin: FAC (V2: S23-S25)

All `F:admin.access` unless stated; Idempotency-Key on POST; audited.

| Method and path | Body / purpose | Acceptance |
| --- | --- | --- |
| `POST /admin/fac/import/uploads` | `multipart/form-data` (`file`: JSON, <= 2 MiB) -> `{ uploadId, sha256 }` (staging, 24 h) | FAC01 |
| `POST /admin/fac/import/preview` | `{ source: 'bundled' | { uploadId } }` -> `{ previewHash, sourceSha256, sheetSha256, counts, locked: boolean, rows: [{ sourceRow, splitIndex, action, savedForm, openingState, issues: string[] }], knownSourceIssues }`; writes nothing | FAC01, FAC02 |
| `POST /admin/fac/import/confirm` | `{ source, previewHash, resolutions: [{ sourceRow, splitIndex, resolution: 'keepAdmin' | 'takeSource' }] }` -> batch report; 409 `import_preview_stale`, `import_locked_by_progress` | FAC01 |
| `GET /admin/fac/import/batches` | confirmed batches | FAC01 |
| `GET/POST/PUT /admin/fac/disciplines`, `/admin/fac/types`, `/admin/fac/frequencies` (+ `/{id}/deactivate|activate`) | list maintenance; codes immutable; frequency interval changes apply to cycles opened afterwards | S24 |
| `GET /admin/fac/settings`; `PUT /admin/fac/settings` | `{ version, dueSoonDays, dashboardRefreshSeconds, dashboardScrollPixelsPerSecond }` | FAC04, FDB04 |
| `POST /admin/fac/cycles/{cycleId}/corrections` | `F:fac.work.admin`; `{ version, reason, cycle?: { completedOn?, targetQuantity?, dueOn?, reopen?: boolean, complete?: boolean }, updates?: [{ updateId, quantity?, workDate?, void?: boolean }] }` -> rules DATA s17.10; previous values returned in the correction record | FAC07 |
| `POST /admin/fac/jobs/{jobId}/due-date` | `F:fac.work.admin`; `{ version, dueOn, reason }` (Admin-entered due date for the current cycle) | FAC04 |

### 4.27 Excel exports (V2: S29)

All need `F:export.excel` **plus** the list's view feature (DATA s14.4, s19). Each takes exactly the filter parameters of its list endpoint; unknown parameters 400. Response `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`, `Content-Disposition: attachment; filename="<list>-<yyyymmdd-hhmm>.xlsx"`, `Cache-Control: no-store`; 422 `export_too_large` above 10 000 rows; audited.

| Method and path | View feature | Columns |
| --- | --- | --- |
| `GET /exports/fac-jobs.xlsx?<s4.22 filters>` | `fac.jobs.view` | DATA s19 FAC jobs. The export belongs to the FAC Jobs tab (SOW V2 5.6); the dashboard has no export (SOW V2 5.5), so `fac.dashboard.view` alone does not allow it (D-140) |
| `GET /exports/eq-special-jobs.xlsx?<s4.7 filters>` | `eq.jobs.view` | DATA s19 EQ special jobs |
| `GET /exports/zmms-daily-jobs.xlsx?<s4.17 daily-job filters>` | `eq.jobs.view` | DATA s19 ZMMS daily jobs |
| `GET /exports/spare-parts.xlsx?<s4.17 spare-part filters>` | `eq.jobs.view` | DATA s19 spare-part register |

A user whose matrix hides a tab gets 403 `feature_disabled` on that tab's export, so an export never contains rows from a tab the user cannot view (FAC12, ACC02).

## 5 Internal provisioning endpoint

`PUT /eq-maintenance/internal/provisioning/users/{subjectId}` - policy `ProvisioningCredential`; enabled only when `EqProvisioning:Enabled = true` with a runtime credential of at least 32 characters (otherwise the route is not mapped and returns 404, which Identity's connector classifies as `NotSupported`). Not routed by the Portal browser proxy and exempt from browser CSRF because no session is accepted on it.

Request (exactly the body Identity's `HttpAppConvergenceConnector` sends):

```ts
{ subjectId: Id; expectedLocalUserId: Id | null; desiredRevision: number; desiredStateHash: string;  // 64 lowercase hex
  userName: string; displayName: string; email: string | null;
  appRoleCodes: Array<'eq-maintenance:admin' | 'eq-maintenance:management' | 'eq-maintenance:eq-team' | 'eq-maintenance:fac-team'>;   // V2: four codes
  active: boolean; attributes: Record<string, string> | null }
```

Response 200: `{ outcome: 'created' | 'updated' | 'unchanged', subjectId, localUserId, appliedRevision, appliedStateHash, userName, displayName, email, appRoleCodes, active }` (echo must match, or Identity marks the projection InvalidResponse). Errors: 400 `subject_mismatch` / `invalid_provisioning_request`; 401 missing/invalid credential; 409 `local_user_missing`, `local_user_mismatch`, `stale_revision`, `revision_hash_conflict`, `revision_state_conflict`, `username_conflict`. Rules: DATA s7. EQ declares no provisioning attributes (`ProvisionAttributes = []`).

## 6 Health

| Path | Auth | Response |
| --- | --- | --- |
| `GET /eq-maintenance/health/live` | anonymous | `{ status: 'Healthy' }` (process up) |
| `GET /eq-maintenance/health/ready` | anonymous | `{ status, database: 'Healthy' | 'Unavailable', storage: 'Healthy' | 'Unavailable' }`, 503 when not ready; no versions, paths or counts |

A health response is never acceptance evidence on its own (Master control).

## 7 Endpoint-to-acceptance map

| Area | Endpoints | Cases |
| --- | --- | --- |
| Session/auth | 4.1, section 2, 5 | AUTH01-AUTH06, OPS04 |
| Fleet/status | 4.2, 4.3 | OPS01, JOB02, JOB13, ADM01 |
| Hierarchy/catalogue | 4.4, 4.5, 4.12 | SRC01-SRC03, ADM03, ADM04, VIS03 |
| History | 4.4, 4.6 | HIS01-HIS05, JOB03 |
| Jobs | 4.7, 4.8 | JOB01, JOB03-JOB12, AUTH03 |
| Files | 4.9 | FILE01-FILE05 |
| Parameters | 4.10, 4.13 | SRC05, SRC06, ADM06 |
| Scene | 4.11, 4.14 | VIS05, VIS07, VIS08, VIS09 |
| Admin config | 4.13 | ADM01, ADM02, ADM04, ADM05, SRC04 |
| (V2) Session, sections, Access matrix | 4.1, 2, 4.21 | ACC01, ACC02, ACC03, ACC04, ACC05 |
| (V2) Crane view current state | 4.16 | HIS06, SP04, VIS03 (U1-C23, U1-C26) |
| (U1 round 6) Display switch | 4.8 `PUT /jobs/{jobId}/display`, 4.23 `PUT /fac/jobs/{jobId}/display` | ACC03, AUTH03, FDB01, HIS06 (U1-C26) |
| (V2) EQ Jobs tab: daily jobs, status, spare parts | 4.3, 4.17, 4.18 | ZM05, ZM06, ZM07, SP01, SP02, SP03, SP04, JOB02 |
| (V2) Admin spare parts | 4.19 | SP01, SP03 |
| (V2) Admin ZMMS | 4.20 | ZM01, ZM02, ZM03, ZM04, ZM05, ZM08 |
| (V2) FAC jobs, commands, photos | 4.22, 4.23, 4.24 | FAC03, FAC04, FAC05, FAC06, FAC07, FAC08, FAC09, FAC10, FAC11, ACC04 |
| (V2) FAC Dashboard | 4.25 | FDB01, FDB02, FDB03, FDB04, FDB05, FDB06 |
| (V2) Admin FAC | 4.26 | FAC01, FAC02, FAC07 |
| (V2) Exports | 4.27 | FAC12 |


## U1-C50 special-job progress addendum (24 October 2026)

The new progress command is implemented only in the synthetic prototype (`EQ.api.updateJobProgress`) at U1; the HTTP contract above guides later application phases. No production endpoint or database migration is claimed. Update progress uses the existing completion form at 100%, showing completion date/note and replacement positions/items/quantities/dates in that same dialog. Successful updates return the latest progress summary; history records who, when, work date, percentage, previous percentage and note. Audit records before/after values.

The command requires the live `eq.work` policy, even for a cached replay; Management and FAC Team are refused. All detailed reads continue to require `eq.jobs.view`. Existing CurrentSpecial DTOs do not acquire progress fields, history or notes. RowVersion conflicts preserve the other user's save. A decreased estimate appends a new dated note; completion and committed installation history remain protected. Existing Complete entry points also record 100% and keep completion notes in their timeline; completion cannot precede recorded progress or a replacement line date. Reopened replacements may complete with their existing committed lines, with no duplicate installation.

## U1-C51 projects and type-wide special jobs (24 October 2026)

The user confirmed one shared progress/completion record and automatic inclusion of later equipment. A type-wide job stores one identity with EquipmentTypeCode and no single equipment owner. JobSummary, Jobs filters/counts/search and export each return it once, including when filtering by any current member. Single-equipment jobs keep their existing scope. EQ type filters the create form's Equipment options, including All [type] equipment. Project supports optional replacement lines; Replacement still requires at least one committed or new line and Repair forbids lines.

A type-wide scope matches active equipment of that type at read/command time. Adding equipment makes existing open and completed shared records visible immediately, with the same progress/completion; it creates no job copy, progress event or installation. Retired equipment is excluded from the live type scope. Open shared work prevents member retirement. Equipment scope is immutable after creation. Shared edits, Show, cancellation, completion and Admin reopening affect the one record on every current member page; creator/role limits and version checks remain.

GET /equipment/{id}/current-state/special projects the same job ID with the requested equipment context and an optional equipmentTypeCode. It remains a detached current-state allowlist: no progress notes, events, corrections, completion notes or installation detail. Type-wide work appears at equipment level, plus relevant component scopes only when actual replacement lines exist there. Matching positions are limited to the requested equipment. EQ Jobs detail can link all current members and retains the authorized full shared record.

For completion, each replacement position identifies its actual equipment. Validate every line against the selected type and target, then commit all lines/installations/spare-register changes together or none. Shared completion never creates installations for other members or equipment added later, and never changes operational statuses. Related-status commands accept the shared job only for a relevant member. The prototype accepts `equipmentId: 'all'` as its form selector, or null with equipmentTypeCode; its single-equipment form also sends the chosen type as a validation filter. HTTP callers choose exactly one scope as above. This is a synthetic U1 prototype/contract extension; production endpoints, persistence, uploads and migration remain later work.
