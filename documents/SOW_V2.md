# CICT EQ & FAC Maintenance - Scope of Work V2

Version 2.0 DRAFT, revision 4 | 22 October 2026 | For user confirmation

Supersedes SOW V1 (`documents/SOW.docx`) only on the points below. Everything in V1, in the approved requirements v1.1 and in the confirmed U1 changes (U1-C01 to U1-C16) stays valid for the EQ section unless this document says otherwise. The prompt pack is not changed until you confirm this SOW.

Revision 2 records your answers to Q1-Q8 (section 9) and adds the EQ Jobs tab changes: special jobs, daily jobs read from ZMMS, automatic EQ status and the spare-part condition register (section 4). Revision 3 records your answers to Q9-Q14: two ZMMS syncs a day, and a manual status correction that lasts for the current day only. Revision 4 records that ZMMS is a CICT-owned app, you as its owner allow the app to read it with the login, and ZMMS has no API.

## 1 What changes in V2

- The app has two main sections: **EQ** (equipment: QC, RTG, ES - the V1 scope) and **FAC** (facility maintenance: electrical, mechanical and civil inspections and services across the terminal).
- FAC has its own **FAC Dashboard** and **FAC Jobs** tab, in the same way the EQ section has the Fleet tab and the Jobs tab.
- Main user roles are assigned in the ENG Portal. Feature access inside the app (which tabs a role sees and a few optional rights) is adjusted by the app Admin.
- FAC work starts from the supplied master list (`Facility- Dashboard.xlsx`, 111 jobs). Each job can have a job picture and completion pictures; neither is mandatory.
- FAC data entry is kept short: a job has a handful of fields and the daily action is one "update progress" form.
- The FAC Dashboard is built for management: a constantly moving live board where the progress of every job is visible without clicking.
- EQ section: the Jobs tab has three parts - special jobs (manual, bound to a mechanism or part) with the daily maintenance jobs read from ZMMS listed below them, EQ status (automatic from ZMMS, with manual correction) and the condition of major spare parts. The crane view shows the current state only; work history is kept in the Jobs tab.

## 2 Application structure

```
+-- ENG Portal > EQ & FAC Maintenance ---------------- [  EQ  |  FAC  ] --- user v --+
|  EQ   :  Fleet  |  Jobs                     (equipment detail opens from Fleet)    |
|          Jobs = Special & daily jobs | EQ status | Spare parts condition           |
|  FAC  :  FAC Dashboard  |  FAC Jobs         (job detail opens from either tab)     |
|  Admin  (Admin only: EQ settings, FAC settings, Access)                            |
+------------------------------------------------------------------------------------+
```

- A section switch (EQ | FAC) sits in the top bar; each section shows its own tabs. Admin is shared by both sections.
- A user sees only the sections and tabs their permissions allow. With only one section allowed, the switch is hidden.
- Landing page: the section and tab the user used last. First visit: EQ Fleet for EQ Team, FAC Dashboard for FAC Team, EQ Fleet for Management and Admin.
- Proposed display name "EQ & FAC Maintenance". The technical identifiers stay as in V1 (`eq-maintenance`, `/eq-maintenance`), so the planned Portal integration does not have to be redesigned (question Q1).
- The two sections keep separate records and statuses. A FAC job is not linked to an EQ equipment record, even when the work is on a crane (for example QC HVAC or RTG air conditioning).

## 3 Roles and permissions

### 3.1 Portal: main role assignment

PortalAdmin assigns one or more of these roles to a user in the ENG Portal. The app has no login, password or user list of its own.

| Portal role | Code | What the role allows at most (ceiling) |
| --- | --- | --- |
| Admin | eq-maintenance:admin | Everything in both sections, plus app Admin |
| Management | eq-maintenance:management | Read-only in both sections |
| EQ Team | eq-maintenance:eq-team | Works on EQ (special jobs, status correction, spare-part condition); can read FAC |
| FAC Team | eq-maintenance:fac-team (new in V2) | Works on FAC (progress, photos, one-time jobs); can read EQ |

A user who holds both EQ Team and FAC Team works in both sections. The Portal role is the ceiling: the app can narrow what a role sees and switch on only the optional rights listed below. It can never give Management write access, and it never makes anyone an app Admin.

### 3.2 App Admin: feature permissions (Admin > Access)

A simple on/off matrix of features by role. Defaults:

| Feature | Admin | Management | EQ Team | FAC Team |
| --- | --- | --- | --- | --- |
| EQ Fleet tab and equipment detail (view) | Always | On | Always | On |
| EQ Jobs tab (view) | Always | On | Always | On |
| EQ work: special jobs, status correction, spare-part condition | Always | Not allowed | Always | Not allowed |
| FAC Dashboard (view) | Always | On | On | Always |
| FAC Jobs tab (view) | Always | On | On | Always |
| FAC work: update progress, hold, photos | Always | Not allowed | Not allowed | Always |
| FAC: add one-time jobs | Always | Not allowed | Not allowed | On |
| FAC: manage master job list (add/edit/deactivate recurring jobs) | Always | Not allowed | Not allowed | Off |
| Export to Excel | Always | On | On | On |
| Admin pages | Always | Not allowed | Not allowed | Not allowed |

"Always" = fixed by the Portal role, cannot be switched off. "Not allowed" = above the role's ceiling, shown greyed. "On"/"Off" = Admin can toggle.

Rules:

- Toggles apply to a role, not to an individual user. For a different set of rights, give the user a different Portal role.
- The server enforces the matrix. A hidden tab is also blocked on the API, on direct links and on photo links.
- Every change records who changed what and when, and takes effect at the user's next refresh (within 60 seconds).
- A user whose tabs are all switched off sees a "No access - contact the EQ & FAC Maintenance Admin" page, not an error.

## 4 EQ section

The Fleet tab, the equipment (crane) view with the QC 3D and flat views, the tier 1 > 2 > 3 drill-down and the Admin catalogue stay as in V1, the approved requirements v1.1 and the U1 changes, except for the points below.

### 4.1 Crane view: current state only

- Selecting a mechanism or part shows its current state in the right panel: open special jobs, current spare-part condition (Original/Replaced, brand, replaced date, next predicted replacement) and specifications.
- No work history is shown in the crane view. An "Open in Jobs" link opens the Jobs tab filtered to that equipment and selection, where the full history is kept.
- Fleet cards show whether the status is automatic (ZMMS) or a manual correction, and the number of today's ZMMS daily jobs.

### 4.2 EQ Jobs tab - three parts

```
EQ Jobs:  [ Special & daily jobs ]   [ EQ status ]   [ Spare parts condition ]
          +-- Special jobs (manual, per mechanism / sub-mechanism / part) ----+
          |  ...                                                              |
          +-- Daily maintenance jobs (from ZMMS, read-only) -----------------+
          |  ...                                                              |
          +-------------------------------------------------------------------+
```

All three parts share the filters equipment, type (QC/RTG/ES), date range and search, and keep their full history.

### 4.3 Special jobs (manual)

- Major or non-routine work entered and updated manually by the EQ Team. Each special job is bound to one equipment and to its main mechanism, sub-mechanism or main part (as the V1 job record).
- Fields as V1: title, Repair or Replacement, description, planned date, responsible person (optional), status Pending / Current / Completed, completion date and note, optional photos. Cancellation and Admin correction rules as V1.
- Completing a Replacement special job opens the spare-part condition form for the selected part, pre-filled (4.6).
- The list shows open jobs first; completed and cancelled jobs remain as history in this tab.

### 4.4 Daily maintenance jobs (from ZMMS)

- Source: the ZMMS (CMMS.LK) daily all-job list, `https://www.zmms.lk/?r=job/daily-alljob`. The page needs a login (checked 22 October 2026). You have provided an account for this; its details are not written into this document or the project files.
- The app server reads the list automatically twice a day (defaults 06:00 and 14:00 Asia/Colombo; Admin can change both times and press "Sync now"). Reading only - the app never writes to ZMMS.
- Each record keeps what ZMMS gives, at least: ZMMS job number, date, equipment, job description or type and job status. The exact field list is fixed once the account is available.
- ZMMS equipment names or codes are matched to app equipment through a mapping table in Admin. Rows that do not match are listed in Admin for mapping and are not lost.
- The daily jobs are listed in the Jobs tab below the special jobs, read-only, with the same filters. Every synced day is kept, so the Jobs tab holds the daily-job history. They are linked to the equipment only, not to a mechanism or part.
- Sync health: Admin sees the last sync time, rows read and any failure; users see "ZMMS data from dd Mon hh:mm". A failed sync keeps the previous data, retries, and warns Admin.
- The ZMMS account is kept in the server configuration, never in code, logs or the browser.
- Method: ZMMS is a CICT-owned app with no API. As its owner you have agreed that this app signs in with the account and reads the daily job page. If the ZMMS page layout changes, the sync reports a failure to Admin instead of saving wrong data.

### 4.5 EQ status - automatic, with manual correction

- After each sync the app sets each mapped equipment's status from the day's ZMMS plan: a breakdown job -> Breakdown; a maintenance job -> Maintenance; equipment not in the day's plan -> Ready for OPS (in operations). Which ZMMS job types and statuses mean Breakdown or Maintenance is set in Admin after the first real ZMMS data (Q11).
- If the automatic status is wrong, an EQ Team user changes it with a reason. The status then shows "Manual" for the rest of that day, including over that day's second sync. At the first sync of the next day the equipment returns to automatic status (Q12). A user can also select "Back to automatic" earlier.
- Equipment with no ZMMS mapping keeps the V1 manual status.
- The EQ status part of the Jobs tab lists every status change with its source (ZMMS sync or user), time and reason.
- This replaces the V1 rule that the status is only set by hand and the "no telemetry" note on the Fleet tab.

### 4.6 Condition of major spare parts

- Admin marks which main-part positions of the mechanism tree are major spare parts (for example hoist motors, gearboxes, brakes, wire ropes, spreader). Each equipment has its own register.
- Fields per part: Condition (Original / Replaced), brand, model or part number (optional), serial number (optional), replaced date (blank for Original), expected life in months, next predicted replacement, remarks.
- Expected life is set per part type by Admin and can be changed per equipment. Next predicted replacement = replaced date + expected life; for an Original part the equipment's commissioning date is used. If that date is unknown, no prediction is shown (Q13).
- Parts past their predicted date are marked overdue, and parts within 90 days are marked "due soon" (Admin setting).
- The EQ Team updates the register directly or through a completed Replacement special job. Each change keeps the previous values, so the replacement history of a part is visible in this tab.

## 4A Changes to V1 rules caused by section 4

| V1 / approved requirements v1.1 | V2 |
| --- | --- |
| Operational status is set only manually; no telemetry | Automatic from ZMMS daily jobs, with manual correction |
| No external system link (Maximo/EAM) | Still no Maximo/EAM link; ZMMS daily jobs are read (read-only) |
| Right panel in the equipment view shows scoped history (S07) | Right panel shows the current state; history in the Jobs tab |
| Jobs workspace: Pending / Current / Completed for all work (S08) | Special jobs keep those statuses; daily jobs come from ZMMS |
| Remaining or predicted life not in stage 1 | Simple predicted replacement date from the expected life in months |

## 5 FAC section

### 5.1 FAC job - the only fields

| Field | Required | Notes | Excel column |
| --- | --- | --- | --- |
| Discipline | Yes | Electrical, Mechanical, Civil (Admin can add more) | Internal Section |
| Type | Yes | Inspection or Service | Inspection/ Service |
| Job name | Yes | e.g. "Weighbridge government stamping" | Description |
| Frequency | Yes | See 5.2 | Frequency |
| Quantity | Yes, default 1 | Units covered in one cycle, e.g. 414 panel boards | Quantity |
| Job kind | Yes, default Recurring | Recurring, One-time or Continuous | Completion Progress |
| PIC | No | Person in charge: pick a FAC Team user or type a name | PIC |
| In-house / Outsource | No | | In-house/ Outsource |
| Last done date | No | Starting point for the next due date | Last Date |
| Job picture | No | One reference photo of the asset or area | - |
| Remarks | No | Free text | Remarks |

The app calculates, so nobody types them: next due date, completed and pending quantity, % complete, status, days overdue. The Excel "Section" column (always "Facility") becomes the FAC section itself. A job that is no longer needed is deactivated, never deleted, and keeps its history.

### 5.2 Frequency and due date

| Frequency | Interval |
| --- | --- |
| Daily | 1 day |
| Weekly | 7 days |
| Monthly | 1 calendar month |
| Quarterly | 3 months |
| Tri-annually | 4 months (3 times a year) |
| Bi-annually | 6 months (twice a year, as the sheet's +182 days) |
| Annually | 12 months |
| Once in 2 / 3 / 5 years | 24 / 36 / 60 months |
| Running hours (e.g. chiller compressor oil at 5000 h) | No automatic date: next due date is entered at each completion |
| As required (no fixed frequency) | No due date |

- When a user adds a new job, they choose its frequency from this list (Admin maintains the list).
- Recurring jobs only: next due = last done date + interval, counted in calendar months (the sheet's +30/+31 days become "1 month"). When a cycle is completed, last done = completion date and the next cycle opens automatically as Pending.
- Due soon = within 7 days of the due date (Admin setting). Daily jobs are due today.
- Overdue = past the due date and the cycle not completed; the number of days overdue is shown.
- One-time jobs close on completion. Continuous jobs have no due date and are tracked by quantity until marked completed.
- A row with two frequencies ("Daily; Monthly") is imported as two jobs.
- Daily and weekly jobs get a one-tap "Done today" / "Done this week"; the dashboard shows "today's checks x of y".

### 5.3 Status and progress

- Statuses: **Pending** (nothing done this cycle), **In progress** (part of the quantity done), **Completed** (cycle done), **On hold** (needs a reason, e.g. "Area not released by OPS").
- Flags shown on top of the status: **Due soon** and **Overdue**.
- The FAC Team's normal action is one **Update progress** form: quantity done now (or "All done"), date (default today), note (optional), completion photos (optional). Completed quantity cannot exceed the job quantity.
- Reaching the full quantity marks the cycle Completed after a confirmation.
- Every update is a timeline entry: who, when, +quantity, note, photos.
- Mistakes: a user can undo their own last update on the same day; Admin can correct any cycle (quantities, dates) with a reason. Corrections keep the previous values.

### 5.4 Pictures

- **Job picture**: optional, one per job, replaceable; shown as a thumbnail on dashboard rows and on the job detail.
- **Completion pictures**: optional, up to 5 per progress update; shown in the job timeline and in the dashboard's "Latest proof" strip.
- On phones and tablets the upload button opens the camera directly.
- JPG or PNG, up to 10 MB each; the app reduces large photos and makes thumbnails. Photos are kept in protected storage and shown only to signed-in users allowed to view FAC.
- The uploader can remove their own photo on the same day; Admin can remove any photo with a reason. Removals are recorded.

### 5.5 FAC Dashboard - for management

Purpose: a manager in front of the screen sees, without clicking, what work is moving, what is stuck and what is coming due.

```
+--------------------------------------------------------------------------------------+
| 111 jobs | 68 completed | 14 in progress | 9 OVERDUE | 12 due in 7 d | on time 87 %   |
+---------------------------+----------------------------+-----------------------------+
| ELECTRICAL         (78 %) | MECHANICAL          (64 %) | CIVIL                (52 %) |
|  ^ slowly moving list ^   |  ^ slowly moving list ^    |  ^ slowly moving list ^     |
| [img] Panel board service | [img] Fire pump test run   | [img] Bollard inspection    |
|  ######---  345/414  83 % |  DONE today                |  OVERDUE 12 d   0/60        |
|  Annually  Mahesh  In-h.  |  Monthly  In-house         |  Quarterly                  |
| [img] Converter stations  | ...                        | ...                         |
|  ON HOLD: area not        |                            |                             |
|  released by OPS          |                            |                             |
+---------------------------+----------------------------+-----------------------------+
| LIVE  10:42 Mahesh +3 Weighbridge maintenance - completed  |  10:15 STP check done ... |
+------------------------------------------+-------------------------------------------+
| Latest proof: completion photo carousel  | Due in the next 8 weeks (bars per week)   |
+------------------------------------------+-------------------------------------------+
```

1. **KPI strip**: total active jobs, completed this cycle, in progress, overdue, due in 7 days, on-time completion % (last 30 days). Clicking a KPI filters the board.
2. **Three discipline lanes** (Electrical, Mechanical, Civil), each a slowly and continuously scrolling list like an airport departures board. Order: Overdue, On hold, In progress, Due soon, Pending, then jobs completed in the last 7 days. Each row: inspection/service icon, job name, frequency, progress bar with quantity and %, due countdown ("Due in 5 d" / "Overdue 12 d"), PIC, in-house/outsource, job picture thumbnail. Status uses colour plus icon plus text. A ring in each lane header shows the lane's completion %.
3. **Live ticker**: the latest progress updates run across the screen (time, who, job, +quantity, completed). A new update slides in and is highlighted briefly.
4. **Latest proof**: a rotating carousel of the newest completion photos with job name, date and who.
5. **Due load**: number of jobs due per week for the next 8 weeks, stacked by discipline, so workload peaks are visible in advance.
6. **Motion rules**: the lists loop continuously; they pause on mouse hover, on keyboard focus and with a Pause button. If the computer asks for reduced motion, the lists flip a page every 8 seconds instead. When a job changes status it glows briefly and moves to its new place.
7. Clicking any row opens the job detail (read-only for Management).
8. **TV mode**: a full-screen button hides the navigation and enlarges text for 1920 x 1080 office screens. The screen is signed in as a normal Management user; there is no anonymous view.
9. Refreshes every 60 seconds (Admin setting) and shows "Updated hh:mm"; if a refresh fails, the last data stays with a warning.
10. Filters: discipline, type, in-house/outsource, PIC; kept in the link, so a filtered board can be shared.
11. Phone: KPI strip and one combined list without auto-scroll.

### 5.6 FAC Jobs tab - for the FAC Team

- Opens on **My work**: overdue, due soon and in-progress jobs, the user's own (PIC) jobs first.
- Board or list by status: Pending, In progress, On hold, Completed (this cycle). Filters as on the dashboard plus frequency and search.
- Each card has one-tap actions: Update progress, Done today (daily/weekly jobs), Hold.
- Job detail: the fields, job picture, current cycle progress, timeline of updates with photos, and previous cycles (completion date, on time or late by n days).
- Add a one-time job (if allowed by 3.2) with the same short form.
- Phone-first: the update form and camera upload fit on a phone, because FAC staff update from the field.
- Export the filtered list to Excel, with the source sheet's columns plus the calculated ones.

### 5.7 FAC settings in Admin

- Master job list: add, edit, deactivate, reactivate.
- One-time import of the supplied Excel with a preview: each row shows how it will be saved and the problems found (Appendix A). Nothing is saved until Admin confirms; the import can be repeated with a corrected sheet until the first progress is recorded.
- Lists: disciplines, types, frequencies and their intervals; due-soon window; refresh interval; dashboard scroll speed.
- Cycle corrections with a reason (see 5.3).
- The Access matrix (3.2).

## 6 Shared rules (both sections)

- Sign-in only through the ENG Portal; permission checks on the server for every page, API call and photo.
- Audit: create, update, progress, hold, correction and permission changes keep who, when and old -> new values. Records are never hard-deleted.
- Times shown in Asia/Colombo; work dates are kept as business dates.
- Screens: desktop 1920 x 1080 and 1366 x 768, tablet, phone. FAC Jobs is fully usable on a phone; the EQ 3D view stays optional on phones.
- Intranet only: fonts, icons and libraries are bundled, no external internet services.
- Own SQL Server database; no Maximo/EAM link. The only external system the app reads is ZMMS (4.4).

## 7 Not in V2

- FAC: email/SMS/WhatsApp reminders (possible later), automatic running-hour readings, contractor management, costs and budgets, spare parts and stock, detailed per-item inspection checklists, maps/GIS, links from FAC jobs to EQ equipment, offline mode.
- EQ: writing anything back to ZMMS; reading ZMMS jobs other than the daily job list; linking ZMMS daily jobs to mechanisms or parts; predictions from running hours, sensors or AI; spare-part stock and purchasing. Other V1 exclusions unchanged.

## 8 Effect on the implementation plan (information only - the prompt pack is not changed yet)

After you confirm this SOW, the pack is updated as follows. Completed work (P00-P03 and the U1 repairs) stays valid.

| Area | Planned change |
| --- | --- |
| Approved requirements | Version 2.0: FAC scope items, FAC Team role, feature-permission matrix, EQ changes of section 4A, ZMMS read-only import, FAC exclusions |
| P01 contracts | Addendum: FAC tables (jobs, cycles, updates, photos), FAC API, permission matrix, ZMMS daily jobs, status source, spare-part register |
| P02 prototype | Section switch, FAC Dashboard and FAC Jobs prototype with the imported list; EQ Jobs tab in three parts; crane view without history |
| P05 Portal integration | Fourth role code `eq-maintenance:fac-team` and the display name; P05 has not started, so nothing is redone |
| P06 Admin | Access matrix, FAC master list and Excel import, ZMMS equipment mapping and status rules, major spare-part selection and expected life |
| P07 | Special jobs, automatic/manual status, spare-part register |
| New ZMMS phase | Daily sync with the separate account, mapping, sync health, automatic status |
| New FAC build phase | FAC jobs, cycles, progress updates, photos |
| P09 / P10 | FAC Dashboard beside the EQ Fleet tab; right panel shows the current state only |
| Reviews and acceptance | FAC and ZMMS acceptance cases; reviews cover both |
| Checkpoints | Planned when the prompt pack is updated |

## 9 Decisions

### 9.1 Confirmed by you (22 October 2026)

| No. | Question | Your answer |
| --- | --- | --- |
| Q1 | App name | Display "EQ & FAC Maintenance"; technical code stays `eq-maintenance` |
| Q2 | Who manages the FAC master list? | Admin; Admin can give the right to FAC Team in Access |
| Q3 | Frequencies | Tri-annually = every 4 months; bi-annually = every 6 months; the user sets the frequency when adding a new job |
| Q4 | Next due date | From the actual completion date, for recurring jobs only |
| Q5 | Gaps in the sheet | Import with blanks and complete them in Admin |
| Q6 | Daily and weekly checks | One-tap "Done today" / "Done this week" |
| Q7 | Management access to FAC | Both FAC tabs, read-only; tab visibility adjustable in Admin |
| Q8 | U1 checkpoint | Not decided now; this revision only updates the SOW |

### 9.2 Confirmed by you (22 October 2026, revision 3)

| No. | Question | Your answer |
| --- | --- | --- |
| Q9 | ZMMS access | Account provided (details kept out of the documents; entered only in the server configuration at implementation) |
| Q10 | ZMMS sync timing | Twice a day; Admin can change the times |
| Q11 | Which ZMMS jobs mean Breakdown or Maintenance | Set in Admin after the first real ZMMS data |
| Q12 | How long a manual status correction lasts | The current day only; next day the ZMMS plan decides, and equipment not in the plan is Ready for OPS |
| Q13 | Basis for the next predicted replacement | Replaced date + expected life in months; Original parts count from the commissioning date |
| Q14 | Which parts are "major spare parts" | Admin selects them from the mechanism-tree part positions |

### 9.3 ZMMS ownership and access (revision 4)

- ZMMS is a CICT-owned app; you are its owner and have agreed to this app reading it with the login.
- ZMMS has no API or export, so the app signs in and reads the daily job page (4.4).

## Appendix A - supplied FAC list (`documents/Facility- Dashboard.xlsx`)

111 jobs: Electrical 18, Mechanical 52, Civil 41. Inspection 69, Service 42.

| Frequency in sheet | Jobs |
| --- | --- |
| Annually | 41 |
| Bi-annually | 12 |
| Daily | 11 |
| Tri-annually | 10 |
| Quarterly | 9 |
| Monthly | 7 |
| Weekly | 5 |
| Once in 2 years (incl. "Onece in two years") | 5 |
| Once in 3 years | 2 |
| Once in 5 years | 1 |
| Daily; Monthly / Daily; Bi-annually (split into two jobs) | 3 |
| Upon reaching 5000 running hours | 1 |
| No specific frequency | 1 |
| Multiple frequencies - refer to source ledger | 1 |
| Blank | 2 |

Gaps and points found (the import preview shows each one):

| Item | Rows | Proposed handling |
| --- | --- | --- |
| Quantity blank | 73 | Import as 1; Admin corrects |
| PIC blank | 93 | Import unassigned |
| In-house/Outsource blank | 58 | Import blank |
| Last date blank or N/A | 93 | No due date until first completion or Admin enters a date |
| Kind blank (only 16 filled) | 95 | Import as Recurring; "As required" becomes One-time |
| Frequency blank: QC HVAC service, RTG air conditioning service | 55, 57 | Needs frequency from you |
| "Multiple frequencies - refer to source ledger": Building HVAC service | 21 | Needs the breakdown from you |
| Bollards and fenders: quarterly, but next date is 6 months after last | 80, 82 | Recalculated as quarterly; confirm |
| Diesel generators: next date 12 Aug 2026 has passed while status is Completed | 12 | Shows Overdue after import unless a newer date is given |
| Converter stations: on hold since Jul 2024; completed 4 and pending 4 of 4 | 14 | Imported On hold with the remark; confirm completed quantity |
| Status blank on 97 rows | - | Calculated from quantity and dates |
| Possible duplicates: "Evacuation of oil separator's connected workshop area" / "Oil separator waste evacuation"; "FM-200 suppression cylinder and actuation inspection" / "FM200 systems" | 35/50, 38/39 | Imported separately; confirm or merge |
| Broken characters in two texts | 21, 35 | Corrected on import |

## Appendix B - FAC job list as it will be imported

<!-- APPENDIX_B -->
| Row | Discipline | Type | Job | Frequency | Qty | Kind | PIC | In/Out | Last done |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 2 | Electrical | Service | Electrical Panel Board | Annually | 414 | Recurring | Mahesh | In-house |  |
| 3 | Electrical | Inspection | Weighbridge maintenance | Monthly | 3 | Recurring | Mahesh | Outsource | 2026-10-14 |
| 4 | Electrical | Service | Weighbridge government stamping | Annually | 3 | Recurring | Mahesh | Outsource | 2026-09-08 |
| 5 | Electrical | Inspection | Elevator & Dumb waiter maintenance | Monthly | 3 | Recurring | Mahesh | Outsource | 2026-10-01 |
| 6 | Electrical | Service | Elevator & Dumb waiter maintenance | Monthly | 3 | Recurring | Mahesh | Outsource | 2026-10-01 |
| 7 | Electrical | Inspection | Over-head crane | Monthly | 2 | Recurring | Mahesh | Outsource | 2026-09-27 |
| 8 | Electrical | Service | Over-head crane | Bi-annually | 2 | Recurring | Mahesh | Outsource | 2026-09-30 |
| 9 | Electrical | Service | EV charging piles | Tri-annually | 14 | Recurring | Mahesh | In-house |  |
| 10 | Electrical | Service | Human body electrostatic discharge ball touch releaser device | Bi-annually | 9 | Recurring | Mahesh | In-house |  |
| 11 | Electrical | Inspection | Substations | Daily | 3 | Recurring | Mahesh | In-house |  |
| 12 | Electrical | Service | Deisel generators | Annually | 3 | Recurring | Mahesh | In-house | 2025-08-12 |
| 13 | Electrical | Service | Substations | Once in 2 years | 3 | Recurring | Mahesh | Outsource | 2025-05-03 |
| 14 | Electrical | Service | Converter stations | Annually | 4 | Continuous | Mahesh | In-house | 2024-07-20 |
| 15 | Electrical | Service | Compact substations | Annually | 2 | Recurring | Mahesh | Outsource | 2026-06-24 |
| 16 | Electrical | Service | Earth resistence testing- entire terminal | Annually | 1 | Recurring | Mahesh | Outsource | 2026-01-20 |
| 17 | Electrical | Service | Earth resistence testing- DG yard & fuel station | Bi-annually | 1 | Recurring | Mahesh | Outsource | 2026-06-16 |
| 18 | Electrical | Service | Substations generators & fire engine emission test | Annually | 4 | Recurring | Mahesh | Outsource | 2026-10-21 |
| 19 | Electrical | Service | Lux level testing | Annually | 1 * | Recurring | Mahesh | In-house |  |
| 20 | Mechanical | Inspection | Building HVAC / air conditioning | Daily | 414 | Recurring |  | In-house |  |
| 21 | Mechanical | Service | Building HVAC / air conditioning | Multiple frequencies — refer to source ledger | 414 | Recurring |  | In-house |  |
| 22 | Mechanical | Inspection | Checking external water supply distribution network | Annually | 1 * | Recurring |  | In-house |  |
| 23 | Mechanical | Inspection | Checking of STP functions and chemicals | Weekly | 1 * | Recurring |  | In-house |  |
| 24 | Mechanical | Inspection | Checking of cold rooms | Daily | 1 * | Recurring |  | In-house |  |
| 25 | Mechanical | Service | Cleaning of water tanks | Once in 2 years | 1 * | Recurring |  | Outsource |  |
| 26 | Mechanical | Service | Cold room refrigeration preventive service | Tri-annually | 1 * | Recurring |  | In-house |  |
| 27 | Mechanical | Inspection | Cold room temperature monitoring | Daily | 1 * | Recurring |  | In-house |  |
| 28 | Mechanical | Inspection | Cold room unit functional inspection | Monthly | 1 * | Recurring |  | In-house |  |
| 29 | Mechanical | Inspection | Compressor oil changing in water chiller | Upon reaching 5000 running hours | 1 * | Recurring |  | In-house |  |
| 30 | Mechanical | Inspection | Cooling tower daily operating inspection | Daily | 1 * | Recurring |  | In-house |  |
| 31 | Mechanical | Inspection | Cooling tower inspections | Daily | 1 * | Recurring |  | In-house |  |
| 32 | Mechanical | Service | Cooling tower preventive maintenance | Tri-annually | 1 * | Recurring |  | In-house |  |
| 33 | Mechanical | Inspection | Diesel fire pump test run | Monthly | 1 * | Recurring |  | In-house |  |
| 34 | Mechanical | Service | Fire deisel engine service | Annually | 1 | Recurring |  | Outsource | 2026-10-15 |
| 35 | Mechanical | Service | Evacuation of oil separator’s connected workshop area | Quarterly | 2 | Recurring |  |  |  |
| 36 | Mechanical | Service | Evacuation of septic tanks connected manholes | Quarterly | 6 | Recurring |  | Outsource | 2026-10-07 |
| 37 | Mechanical | Service | FCU / VRV / packaged / split AC preventive service | Tri-annually | 1 * | Recurring |  |  |  |
| 38 | Mechanical | Inspection | FM-200 suppression cylinder and actuation inspection | Bi-annually | 1 * | Recurring |  | Outsource |  |
| 39 | Mechanical | Inspection | FM200 systems | Bi-annually | 1 * | Recurring |  | Outsource |  |
| 40 | Mechanical | Inspection | Fire alarm control panels operational condition inspection | Weekly | 1 * | Recurring |  | In-house |  |
| 41 | Mechanical | Service | Fire alarm detection and fire-fighting system service | Bi-annually | 1 * | Recurring |  | Outsource |  |
| 42 | Mechanical | Inspection | Fire facilities checking and servicing | Bi-annually | 1 * | Recurring |  | Outsource |  |
| 43 | Mechanical | Inspection | Fire facilities in yards | Annually | 1 * | Recurring |  | In-house |  |
| 44 | Mechanical | Inspection | Fire protection equipment (detectors, alarms, and associated devices) | Annually | 1020 | Recurring |  | Outsource |  |
| 45 | Mechanical | Service | Fire protection equipment (detectors, alarms, and associated devices) | Annually | 1020 | Recurring |  | Outsource |  |
| 46 | Mechanical | Inspection | Fire pump house / pump controls inspection | Daily | 1 * | Recurring |  | In-house |  |
| 47 | Mechanical | Service | General service and maintenance of fire hydrant | Annually | 1 * | Recurring |  | In-house |  |
| 48 | Mechanical | Inspection | MEP STP | Weekly | 2 | Recurring |  | In-house |  |
| 49 | Mechanical | Inspection | Washing bay | Weekly | 1 | Recurring |  | In-house |  |
| 50 | Mechanical | Service | Oil separator waste evacuation | Quarterly | 1 | Recurring |  | Outsource |  |
| 51 | Mechanical | Inspection | Potable water storage tank level inspection | Daily | 2 | Recurring |  | In-house |  |
| 52 | Mechanical | Inspection | Pressure meter testing | Annually | 1 * | Recurring |  | In-house |  |
| 53 | Mechanical | Inspection | Pump house inspection | Daily | 1 * | Recurring |  | In-house |  |
| 54 | Mechanical | Inspection | QC HVAC | Daily | 98 | Recurring |  |  |  |
| 54 | Mechanical | Inspection | QC HVAC | Monthly | 98 | Recurring |  |  |  |
| 55 | Mechanical | Service | QC HVAC | (blank) | 98 | Recurring |  |  |  |
| 56 | Mechanical | Inspection | RTG air conditioning | Daily | 138 | Recurring |  |  |  |
| 56 | Mechanical | Inspection | RTG air conditioning | Monthly | 138 | Recurring |  |  |  |
| 57 | Mechanical | Service | RTG air conditioning | (blank) | 138 | Recurring |  |  |  |
| 58 | Mechanical | Inspection | STP treated effluent laboratory testing | Quarterly | 3 | Recurring |  | Outsource |  |
| 59 | Mechanical | Service | Service and maintenance of FCUs | Tri-annually | 1 * | Recurring |  |  |  |
| 60 | Mechanical | Service | Service and maintenance of VRV system | Tri-annually | 1 * | Recurring |  |  |  |
| 61 | Mechanical | Service | Service and maintenance of cold rooms | Tri-annually | 1 * | Recurring |  |  |  |
| 62 | Mechanical | Service | Service and maintenance of cooling towers | Tri-annually | 1 * | Recurring |  |  |  |
| 63 | Mechanical | Service | Service and maintenance of package system | Tri-annually | 1 * | Recurring |  |  |  |
| 64 | Mechanical | Service | Service and maintenance of split units in buildings | Tri-annually | 1 * | Recurring |  |  |  |
| 65 | Mechanical | Service | Service and maintenance of split units in cranes | Quarterly | 1 * | Recurring |  |  |  |
| 66 | Mechanical | Service | Service and maintenance of water chiller | Annually | 1 * | Recurring |  |  |  |
| 67 | Mechanical | Inspection | Water chiller and pumps periodic inspection | Bi-annually | 1 * | Recurring |  |  |  |
| 68 | Mechanical | Inspection | Water chiller daily operating parameters | Daily | 1 * | Recurring |  |  |  |
| 69 | Mechanical | Inspection | Water chiller inspections | Daily | 1 * | Recurring |  |  |  |
| 69 | Mechanical | Inspection | Water chiller inspections | Bi-annually | 1 * | Recurring |  |  |  |
| 70 | Mechanical | Inspection | Water level checking | Daily | 1 * | Recurring |  | In-house |  |
| 71 | Mechanical | Inspection | Portable water quality sampling and testing | Quarterly | 2 | Recurring |  | Outsource |  |
| 72 | Civil | Inspection | Water storage tank wall condition inspection | Once in 2 years | 1 * | Recurring |  |  |  |
| 73 | Civil | Service | Water tank external painting | Once in 3 years | 1 * | Recurring |  |  |  |
| 74 | Civil | Service | External wall painting | Once in 3 years | 1 * | Recurring |  |  |  |
| 75 | Civil | Inspection | Inspection of vertical walls | Once in 2 years | 1 * | Recurring |  |  |  |
| 76 | Civil | Inspection | Bathymetric survey | Annually | 1 * | Recurring |  |  |  |
| 77 | Civil | Service | Bollard painting | Bi-annually | 1 * | Recurring |  |  |  |
| 78 | Civil | Inspection | Building stability inspection | Annually | 1 * | Recurring |  |  |  |
| 79 | Civil | Inspection | Ceiling structure & sheets inspections | Annually | 1 * | Recurring |  |  |  |
| 80 | Civil | Inspection | Bollards facilities | Quarterly | 60 | Recurring |  |  | 2026-06-05 |
| 81 | Civil | Inspection | Caisson joint Inspection | Monthly | 3 | Recurring |  |  | 2026-06-05 |
| 82 | Civil | Inspection | Fenders facilities | Quarterly | 85 | Recurring |  |  | 2026-06-05 |
| 83 | Civil | Inspection | PowerPit Qc | Weekly | 19 | Recurring |  |  |  |
| 84 | Civil | Inspection | Container yard / RTG track pavement condition inspection | Annually | 1 * | Recurring |  |  |  |
| 85 | Civil | Inspection | Dredging works | No specific frequency | 1 * | One-time |  |  |  |
| 86 | Civil | Inspection | External wall inspection | Annually | 1 * | Recurring |  |  |  |
| 87 | Civil | Inspection | Fixing bolts | Quarterly | 1 * | Recurring |  |  |  |
| 88 | Civil | Inspection | ILB inspection | Annually | 1 * | Recurring |  |  |  |
| 89 | Civil | Inspection | Internal wall inspection | Annually | 1 * | Recurring |  |  |  |
| 90 | Civil | Inspection | Manholes and draw pit cover | Annually | 1 * | Recurring |  |  |  |
| 91 | Civil | Inspection | Outdoor Fencing | Annually | 1 * | Recurring |  |  |  |
| 92 | Civil | Inspection | Outdoor steel ladders inspection | Annually | 1 * | Recurring |  |  |  |
| 93 | Civil | Service | PM line painting | Annually | 1 * | Recurring |  |  |  |
| 94 | Civil | Inspection | Plumbing inspections | Bi-annually | 1 * | Recurring |  |  |  |
| 95 | Civil | Inspection | QC Rail Beam inspection | Annually | 1 * | Recurring |  |  |  |
| 96 | Civil | Inspection | Quay crane storm and tie-down anchor pit inspection | Bi-annually | 1 * | Recurring |  |  |  |
| 97 | Civil | Inspection | Quay wall breast wall / concrete face visual inspection | Annually | 1 * | Recurring |  |  |  |
| 98 | Civil | Inspection | Quay wall settlement and horizontal displacement monitoring | Annually | 1 * | Recurring |  |  |  |
| 99 | Civil | Inspection | Quay wall structural underwater inspection | Once in 5 years | 1 * | Recurring |  |  |  |
| 100 | Civil | Inspection | RTG align marking | Annually | 1 * | Recurring |  |  |  |
| 101 | Civil | Inspection | RTG tracks inspection | Annually | 1 * | Recurring |  |  |  |
| 102 | Civil | Service | RTG tracks painting | Annually | 1 * | Recurring |  |  |  |
| 103 | Civil | Inspection | Road marking | Annually | 1 * | Recurring |  |  |  |
| 104 | Civil | Inspection | Road pavement and drainage condition inspection | Annually | 1 * | Recurring |  |  |  |
| 105 | Civil | Inspection | Roof inspections | Annually | 1 * | Recurring |  |  |  |
| 106 | Civil | Inspection | Settlement monitoring | Once in 2 years | 1 * | Recurring |  |  |  |
| 107 | Civil | Inspection | Stairs, landings and handrails inspection | Annually | 1 * | Recurring |  |  |  |
| 108 | Civil | Inspection | Visual inspection in tie down pits | Annually | 1 * | Recurring |  |  |  |
| 109 | Civil | Inspection | Visual inspection to grout layer | Bi-annually | 1 * | Recurring |  |  |  |
| 110 | Civil | Inspection | Water leakages in roof slabs inspection | Annually | 1 * | Recurring |  |  |  |
| 111 | Civil | Inspection | Windows and doors inspections | Annually | 1 * | Recurring |  |  |  |
| 112 | Civil | Service | Yard marking painting | Annually | 1 * | Recurring |  |  |  |

\* quantity blank in the sheet, imported as 1. Rows 54, 56 and 69 each become two jobs (one per frequency).
