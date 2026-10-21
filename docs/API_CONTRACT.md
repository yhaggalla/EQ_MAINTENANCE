# API contract

Prepared in P01 on 21 October 2026. Status: **design contract for R01 review**; implemented in P04-P10. Entity rules referenced as "DATA s<n>" are in `docs/DATA_CONTRACT.md`.

## 1 Conventions

### 1.1 Base, versions, formats

- Base: `/eq-maintenance/api/v1` (D-19). Every path below is relative to it unless it starts with `/eq-maintenance/`.
- JSON (`application/json; charset=utf-8`), camelCase properties, `null` for unknown values (never empty strings or placeholders), no extra properties accepted in request bodies (400 `unknown_property`).
- IDs: lowercase canonical UUID strings. Codes: strings (`"01"`, `"011"`). Business dates: `"YYYY-MM-DD"`. Instants: ISO 8601 UTC with `Z`. Decimal quantities: JSON numbers with up to 3 decimals.
- Enum values: `operationalStatus` `readyForOps | breakdown | maintenance` (null = Unreported); `workStatus` `pending | current | completed`; `jobKind` `repair | replacement`; `targetLevel` `equipment | main | sub | part`; `positionKind` `serialized | quantityLot`; `positionState` `draft | active | deactivated`; `lifecycle` `active | retired`; `applicability` `applicable | notApplicable | unknown`; `modelAssociation` `unassigned | verified`.
- Actor objects: `{ "profileId": "...", "displayName": "..." }`.

### 1.2 Authentication, CSRF and session recovery

- Authentication is the shared HttpOnly cookie (`CictEng.Access.Dev` over local HTTP, `__Host-CictEng.Access` over HTTPS) validated by `CictEng.Auth` for audience `urn:cict-eng:eq-maintenance`. An `Authorization` header together with the cookie is rejected by the library. No other scheme exists in the runtime host.
- Every unsafe method (POST, PUT, PATCH, DELETE) on `/eq-maintenance/api/*` requires the canonical `Origin` (or `Referer`) and header `X-CICT-CSRF` matching the token's CSRF digest. Failure: 403 with `X-CICT-CSRF-Invalid: true` and problem code `csrf_invalid`. The SPA obtains the CSRF value from the Portal (`GET /auth/csrf`) and keeps it in memory only.
- 401 means "no valid EQ session" (missing/expired cookie, wrong audience, password change pending). The SPA performs one shared refresh (`GET /auth/session/csrf`, `POST /auth/session/refresh`), retries once, and otherwise asks `GET /auth/applications/eq-maintenance/access-status` which state to show.
- 403 means authenticated but not allowed: `forbidden_role` (role lacks the permission), `access_not_ready` (no active bound profile or role mismatch, DATA s7), `not_job_creator`, `csrf_invalid`.

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
- Scope: (caller profile, key). Same key + same canonical request -> the original status and body are replayed with header `Idempotent-Replayed: true` and no new change. Same key + different request -> 422 `idempotency_key_reused`. Records are kept 30 days; job completion is also protected by job state (DATA s8).
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
| 403 | `forbidden_role`, `access_not_ready`, `not_job_creator`, `csrf_invalid` |
| 404 | `not_found` (also for unknown routes under `/api`), `file_unavailable` |
| 409 | `version_conflict`, `status_changed`, `installation_changed`, `out_of_order_installation`, `later_installation_exists`, `job_completed`, `job_already_completed`, `job_cancelled`, `job_not_completed`, `equipment_retired`, `open_jobs_exist`, `duplicate_code`, `definition_in_use`, `history_exists`, `binding_orphans_unresolved`, `import_conflict` |
| 413 | `file_too_large` |
| 415 | `unsupported_media_type` |
| 422 | `validation_failed` (field `errors`), `status_unchanged`, `reason_required`, `target_not_in_equipment`, `target_inactive`, `definition_inactive`, `reserved_definition`, `position_not_active`, `position_outside_job_target`, `duplicate_position`, `replacement_after_completion`, `date_in_future`, `quantity_invalid`, `lines_not_allowed_for_repair`, `lines_required`, `idempotency_key_reused`, `code_unassigned_reserved` |
| 503 | `storage_unavailable`, `database_unavailable` |

### 1.7 Caching

JSON responses: `Cache-Control: no-store`, except `GET /fleet`, which returns an `ETag` and answers `If-None-Match` with 304 (still `private, no-cache`). Files: section 4.9. Model assets: `private, no-cache` + sha256 ETag (D-39).

## 2 Authorization policies

| Policy | Requirement |
| --- | --- |
| `EqRead` | Authenticated with the EQ audience; active bound profile whose roles equal the token's EQ roles (DATA s7); at least one of the three EQ roles |
| `EqWrite` | `EqRead` + `eq-maintenance:admin` or `eq-maintenance:eq-team` |
| `EqAdmin` | `EqRead` + `eq-maintenance:admin` |
| `ProvisioningCredential` | Only for `/eq-maintenance/internal/provisioning/*`: valid service credential header (fixed-time compare); no browser session involved |
| Fallback | Deny (any endpoint without an explicit policy fails closed) |

Resource rules applied after the policy (Application layer): EQ Team may cancel only jobs it created; evidence removal by the uploader only while the job is uncompleted; state rules from DATA s4. Management therefore receives 403 `forbidden_role` from every endpoint in the `EqWrite`/`EqAdmin` columns below.

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
  changedBy: Actor | null;
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
  equipment: { id: Id; code: string; type: string };
  target: TargetRef; kind: 'repair' | 'replacement'; title: string;
  workStatus: 'pending' | 'current' | 'completed';
  isCancelled: boolean; priority: 'low' | 'normal' | 'high' | null;
  plannedOn: DateOnly | null; completedOn: DateOnly | null;
  responsiblePerson: string | null; createdBy: Actor; createdUtc: Instant; updatedUtc: Instant;
  lineCount: number; attachmentCount: number;
};
```

## 4 Endpoints

Column "Policy" uses the names from section 2. Acceptance IDs refer to `ACCEPTANCE_CHECKLIST.md`.

### 4.1 Session

| Method and path | Policy | Purpose |
| --- | --- | --- |
| `GET /session` | `EqRead` | Bootstrap for the SPA |

Response:

```ts
{ application: { code: 'eq-maintenance'; pathBase: '/eq-maintenance'; displayName: string; apiVersion: 'v1' };
  profile: { profileId: Id; userName: string; displayName: string; email: string | null };
  roles: Array<'eq-maintenance:admin' | 'eq-maintenance:eq-team' | 'eq-maintenance:management'>;
  capabilities: { read: true; jobWrite: boolean; jobComplete: boolean; statusSet: boolean; jobCancelOwn: boolean; jobCancelAny: boolean;
                  jobCorrect: boolean; configManage: boolean; evidenceAttach: boolean; auditRead: boolean };
  portal: { csrfEndpoint: '/auth/csrf'; refreshCsrfEndpoint: '/auth/session/csrf'; refreshEndpoint: '/auth/session/refresh';
            logoutEndpoint: '/auth/session/logout'; loginPath: '/login'; accessStatusEndpoint: '/auth/applications/eq-maintenance/access-status' };
  settings: { fleetRefreshSeconds: number; businessTimeZone: 'Asia/Colombo'; maxEvidenceBytes: number };
  serverTimeUtc: Instant }
```

Capabilities are presentation hints only; the server rechecks every request (AUTH03).

### 4.2 Fleet

| Method and path | Policy | Purpose / acceptance |
| --- | --- | --- |
| `GET /fleet?type=&status=&lifecycle=active|retired|all&q=` | `EqRead` | Summary counts plus compact rows in one lightweight polled call (S02/S03, OPS01, JOB13) |

`status` accepts `readyForOps,breakdown,maintenance,unreported`. `lifecycle` defaults to `active`. `q` matches code/name (case-insensitive contains). Response:

```ts
{ generatedUtc: Instant;
  totals: { all: number; readyForOps: number; breakdown: number; maintenance: number; unreported: number };
  groups: Array<{ type: { id: Id; code: string; name: string };
                  counts: { all: number; readyForOps: number; breakdown: number; maintenance: number; unreported: number };
                  items: Array<{ id: Id; code: string; name: string | null; lifecycle: 'active' | 'retired';
                                 model: { code: string; association: 'unassigned' | 'verified' } | null;
                                 status: StatusSummary; lastActivityUtc: Instant;
                                 openJobs: { pending: number; current: number };   // distinct non-cancelled jobs
                                 thumbnail: 'qc' | 'rtg' | 'es' | 'generic'; has3dView: boolean }> }> }
```

Rules: each equipment counted once in exactly one status bucket; counts reflect the filters' type/lifecycle but **not** the `status`/`q` filters (so the badges reconcile with the full group); open-job counts use COUNT(DISTINCT job) so multi-line jobs never multiply; retired items are excluded unless `lifecycle` asks for them; a failed request never produces a client-side Ready default.

### 4.3 Equipment and operational status

| Method and path | Policy | Purpose / acceptance |
| --- | --- | --- |
| `GET /equipment?type=&lifecycle=&q=&limit=&cursor=&sort=code` | `EqRead` | Register list (admin screens, pickers) |
| `GET /equipment/{equipmentId}` | `EqRead` | Detail header: code, name, type, lifecycle, model association, `status: StatusSummary`, known attributes (null = unknown), counts, `has3dView`, `sceneUnavailableReason` (`notAvailableStage1` for RTG/ES, `noVerifiedModel`, `noActiveBinding`, null) (VIS07, SRC06) |
| `GET /equipment/{equipmentId}/status-history?limit=&cursor=` | `EqRead` | Status changes newest first: `{ id, sequence, status, previousStatus, reason, relatedJob, effectiveUtc, changedBy }` (JOB02, JOB13) |
| `POST /equipment/{equipmentId}/status` | `EqWrite`; Idempotency-Key | Set operational status (S03/S09) |

Status request and rules (DATA s4.2):

```ts
{ status: OperationalStatus; reason: string | null; relatedJobId: Id | null; expectedCurrentStatusChangeId: Id | null }
```

201 with `{ status: StatusSummary; change: {...} }`. Errors: 422 `reason_required` (breakdown/maintenance without reason), 422 `target_not_in_equipment` (related job of another equipment) or `job_cancelled`, 422 `status_unchanged`, 409 `status_changed`, 409 `equipment_retired`, 403 for Management.

### 4.4 Hierarchy, positions and technical sheet

| Method and path | Policy | Purpose / acceptance |
| --- | --- | --- |
| `GET /equipment/{equipmentId}/hierarchy?includeInactive=false` | `EqRead` | Full tree for the tree view and viewer binding (S05, VIS03) |
| `GET /equipment/{equipmentId}/positions/{positionId}` | `EqRead` | Technical sheet for a part (S07, S14, HIS04) |
| `GET /equipment/{equipmentId}/positions/{positionId}/installations` | `EqRead` | Installation lots/items and events at the position, including voided events and correction references (HIS03, JOB10) |

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
| `GET /catalog/mechanisms?includeInactive=true` | `EqRead` | All definitions with code, name, sourceName, description, sourceDescription, parent, `active`, `reserved`, `nameDecision`, `origin` (SRC01-SRC03) |
| `GET /catalog/selectable?equipmentId=` | `EqRead` | Job-target selector for one equipment: only active instances of active, non-reserved definitions (SRC02) |

### 4.6 Scoped history

| Method and path | Policy | Purpose / acceptance |
| --- | --- | --- |
| `GET /equipment/{equipmentId}/history?scope=equipment|main|sub|part&targetId=&includeCancelled=false&from=&to=&kind=repair,replacement&limit=&cursor=` | `EqRead` | De-duplicated scoped history (S07, HIS01-HIS05, JOB03) |

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
| `GET /jobs?status=pending,current,completed&includeCancelled=false&equipmentId=&type=&kind=&mainCode=&subCode=&targetLevel=&dateField=created|planned|completed&from=&to=&q=&mine=false&limit=&cursor=&sort=updated_desc` | `EqRead` | Jobs workspace lists and board columns (S08, JOB01, JOB12) |
| `GET /jobs/board-counts?…same filters…` | `EqRead` | `{ pending, current, completed, cancelled }` counts for the tabs |
| `GET /jobs/{jobId}` | `EqRead` | Full job: `JobSummary` + description, completion fields, `lines: ReplacementLineView[]`, `attachments`, `progress`, `corrections`, `cancellation` `{ reason, by, utc } | null` |

`mainCode`/`subCode` match jobs targeting that definition **or** having lines below it (same rule as DATA s9), each job listed once. Cancelled jobs appear only with `includeCancelled=true` and carry `isCancelled: true`; they are never counted in `completed`.

### 4.8 Job commands

| Method and path | Policy | Body (besides `version` where noted) | Result / errors |
| --- | --- | --- | --- |
| `POST /jobs` | `EqWrite`; Idempotency-Key | `{ equipmentId, target: { level, mainInstanceId?, subInstanceId?, partPositionId? }, kind, title, description?, priority?, plannedOn?, responsiblePerson?, initialStatus: 'pending' | 'current' }` | 201 job. 422 `target_not_in_equipment`, `target_inactive`, `definition_inactive`, `reserved_definition`; 409 `equipment_retired` (JOB01, JOB03, ADM03) |
| `PUT /jobs/{jobId}` | `EqWrite` | `{ version, target, kind, title, description, priority, plannedOn, responsiblePerson }` | 200. Only pending/current; 409 `job_completed`/`job_cancelled`; 409 `version_conflict` (JOB07) |
| `POST /jobs/{jobId}/start` | `EqWrite`; Idempotency-Key | `{ version }` | pending -> current |
| `POST /jobs/{jobId}/return-to-pending` | `EqWrite`; Idempotency-Key | `{ version }` | current -> pending |
| `POST /jobs/{jobId}/complete` | `EqWrite`; Idempotency-Key | see below | 200 completed job (JOB01, JOB04-JOB08, JOB10, JOB11) |
| `POST /jobs/{jobId}/cancel` | `EqWrite`; Idempotency-Key | `{ version, reason }` | 200. 403 `not_job_creator` (EQ Team, other creator); 409 `job_completed`; 422 `reason_required` (JOB12) |
| `POST /jobs/{jobId}/reopen` | `EqAdmin`; Idempotency-Key | `{ version, reason }` | completed -> current; installations unchanged; 409 `job_not_completed` (JOB09) |
| `POST /jobs/{jobId}/corrections` | `EqAdmin`; Idempotency-Key | see below | 200 corrected job + correction record; 409 `later_installation_exists`, `out_of_order_installation`; 422 field errors (JOB09, HIS03) |

Complete request:

```ts
{ version: Version;
  completedOn: DateOnly;          // business date; <= today in Asia/Colombo; never replaced by the entry time
  completionNote: string;         // required
  lines: Array<{                  // required (>=1) for kind=replacement; must be empty for kind=repair
    partPositionId: Id;
    mode: 'full' | 'partial';     // serialized: 'full' only
    expectedCurrentInstallationId: Id | null;    // what the user saw as currently installed; null = nothing tracked
    removedQuantity: number | null;              // partial lots only
    removedItemKnown: boolean; removedItemDescription: string | null; removedItemSerial: string | null; // only when nothing tracked
    itemDescription: string; manufacturer: string | null; modelOrPartNumber: string | null; serialNumber: string | null;
    quantity: number; uom: string;               // serialized: 1 'ea'
    replacedOn: DateOnly;                        // <= completedOn
    note: string | null; }> }
```

Validation order and refusal codes follow DATA s5.1. A whole request fails if any line fails; nothing is partially committed (JOB05, JOB08). Retrying with the same `Idempotency-Key` returns the original 200 with `Idempotent-Replayed: true` (JOB06).

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
| `POST /jobs/{jobId}/attachments` | `EqWrite`; Idempotency-Key; `multipart/form-data` (`file`, `caption?`, `replacementLineId?`) | Upload evidence to a non-cancelled job (FILE02, FILE03). 413 `file_too_large`, 415 `unsupported_media_type` (extension and signature must both be JPEG/PNG/PDF), 409 `job_cancelled` |
| `GET /jobs/{jobId}/attachments` | `EqRead` | Attachment metadata (`documentId`, sanitized name, type, bytes, caption, uploader, utc, state) |
| `POST /jobs/{jobId}/attachments/{attachmentId}/remove` | `EqWrite` (uploader while job uncompleted) or `EqAdmin`; Idempotency-Key | `{ reason }`; marks removed, content retained |
| `GET /documents/{documentId}` | `EqRead` | Metadata: kind, title, drawing number, pages, bytes, sha256, links (no storage key or path) |
| `GET /documents/{documentId}/content?disposition=inline|attachment` | `EqRead` | Streams content; range requests supported; `Content-Disposition` with sanitized RFC 6266 filename; `X-Content-Type-Options: nosniff`; PDFs/images inline, others attachment; `Cache-Control: private, no-store`; ETag = sha256. Unknown/removed/guessed IDs -> 404 `not_found`; missing file -> 404 `file_unavailable` (FILE01, FILE04, FILE05) |
| `GET /equipment-models/{modelId}/documents` | `EqRead` | Source drawings linked to a model family with page references (S14) |

There is no endpoint that accepts a file path or URL to fetch; source drawings enter only through `AdminCli import-drawings` (FILE03).

### 4.10 Technical parameters

| Method and path | Policy | Purpose / acceptance |
| --- | --- | --- |
| `GET /equipment/{equipmentId}/parameters?use=major|technical|all` | `EqRead` | Effective parameters for the equipment (S14, SRC05, SRC06) |
| `GET /equipment-models/{modelId}/parameters` | `EqRead` | Family-level observations and values (reference view) |

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
| `GET /equipment/{equipmentId}/scene` | `EqRead` | Active binding for the viewer: `{ sceneModelVersionId, modelCode, version, assetUrl, manifestUrl, assetSha256, entries: Array<{ nodeKey, partPositionId?, subInstanceId?, source }>, noVisualPositionIds: Id[] }`; or 200 `{ available: false, reason: 'notAvailableStage1' | 'noVerifiedModel' | 'noActiveBinding' }` (VIS07) |
| `GET /scene-model-versions/{versionId}/asset` | `EqRead` | `model/gltf-binary` GLB; `Cache-Control: private, no-cache`; ETag sha256; 304 on match (FILE01, D-39) |
| `GET /scene-model-versions/{versionId}/manifest` | `EqRead` | Manifest JSON (DATA s10.3) with the same caching |

A version that is `draft` is readable only by Admin (`EqAdmin`) for validation previews.

### 4.12 Admin: catalogue

All `EqAdmin`; POSTs carry Idempotency-Key; every change audited.

| Method and path | Body | Notes |
| --- | --- | --- |
| `POST /admin/catalog/main-mechanisms` | `{ code, name }` | 409 `duplicate_code`; 422 `code_unassigned_reserved` for `10` |
| `PUT /admin/catalog/main-mechanisms/{id}` | `{ version, name }` | code immutable |
| `POST /admin/catalog/sub-mechanisms` | `{ code, mainDefinitionId, name, description }` | parent immutable afterwards |
| `PUT /admin/catalog/sub-mechanisms/{id}` | `{ version, name, description }` | 422 `reserved_definition` (use define-reserved) |
| `POST /admin/catalog/sub-mechanisms/{id}/define-reserved` | `{ version, name, description, reason }` | only `048`/`063`-style reserved entries |
| `POST /admin/catalog/{main|sub}-mechanisms/{id}/deactivate` and `/activate` | `{ version, reason }` | deactivation keeps history (ADM04) |
| `GET /admin/catalog/import-report` | - | last `import-mechanisms` report (created/updated/unchanged/conflicts) (ADM05) |

### 4.13 Admin: types, models, applicability, templates, equipment, instances, positions

| Method and path | Body / purpose | Acceptance |
| --- | --- | --- |
| `GET /equipment-types`, `GET /equipment-models`, `GET /equipment-models/{id}` | read (`EqRead`) | S01 |
| `POST /admin/equipment-types`, `PUT /admin/equipment-types/{id}` | `{ code, name, sortOrder }` / `{ version, ... }` | S01 |
| `POST /admin/equipment-models`, `PUT /admin/equipment-models/{id}`, `POST .../{id}/activate|retire` | model family CRUD (no delete) | S01 |
| `GET /equipment-models/{id}/applicability` (`EqRead`); `PUT /admin/equipment-models/{id}/applicability` | `{ version, entries: [{ subDefinitionId, state, note, sourceReference }] }` full replacement; increments TemplateRevision; never touches equipment | SRC04 |
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
| `POST /admin/equipment/{id}/positions`; `PUT /admin/equipment/{id}/positions/{positionId}`; `POST .../{positionId}/deactivate|reactivate|delete` | add, rename, edit kind/UOM/key (refused with 409 `history_exists` once history exists), delete only draft without references | P2, P3 |
| `POST /admin/equipment/{id}/positions/{positionId}/baseline-installation` | `{ itemDescription, manufacturer?, modelOrPartNumber?, serialNumber?, quantity, uom, installedOn: DateOnly | null, sourceNote }` (D-36) | HIS04 |
| `POST /admin/parameters/values` | `{ parameterCode, scopeType, scopeId, value, unit, condition, selectedObservationId?, reason }` -> new current value, prior kept | ADM06, SRC05 |
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
| `GET /admin/audit?entityType=&entityId=&equipmentId=&action=&from=&to=&limit=&cursor=` | `EqAdmin` | Raw audit entries (before/after JSON) |
| `GET /admin/user-profiles?active=` | `EqAdmin` | Local profiles and roles (read-only; changes come only from central convergence) |

## 5 Internal provisioning endpoint

`PUT /eq-maintenance/internal/provisioning/users/{subjectId}` - policy `ProvisioningCredential`; enabled only when `EqProvisioning:Enabled = true` with a runtime credential of at least 32 characters (otherwise the route is not mapped and returns 404, which Identity's connector classifies as `NotSupported`). Not routed by the Portal browser proxy and exempt from browser CSRF because no session is accepted on it.

Request (exactly the body Identity's `HttpAppConvergenceConnector` sends):

```ts
{ subjectId: Id; expectedLocalUserId: Id | null; desiredRevision: number; desiredStateHash: string;  // 64 lowercase hex
  userName: string; displayName: string; email: string | null;
  appRoleCodes: Array<'eq-maintenance:admin' | 'eq-maintenance:eq-team' | 'eq-maintenance:management'>;
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
