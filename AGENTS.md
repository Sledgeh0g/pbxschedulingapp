# AGENTS.md

Guidance for any coding agent working in this repository.

## What this is

"Schedule" — an internal work-order board for PBX Truck Service, a truck repair
shop. Each work order is a task tracked from customer complaint to completion,
with department assignment and dispatch-set urgency. Background on product
intent lives in `PRODUCT.md`; visual rules live in `DESIGN.md`; historical
data-migration notes live in `MIGRATION.md`.

## Commands

```bash
npm run dev       # start dev server (Vite HMR)
npm run build     # production build to dist/
npm run lint      # ESLint
npm run preview   # preview production build
```

No test suite is configured.

## Environment

Requires a `.env` file with:

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

## Stack

React 19 + Vite 8 (SPA, no SSR), Tailwind CSS v4 via `@tailwindcss/vite`,
FullCalendar 6 (daygrid + list + interaction plugins), Supabase
(`@supabase/supabase-js`), `@tanstack/react-table` for tables, jsPDF +
jspdf-autotable for PDF export, `react-router-dom` 7. The React Compiler
(`babel-plugin-react-compiler`) is enabled — do not add manual
`useMemo`/`useCallback` optimizations.

## Architecture

Single-page app; routing in `src/main.jsx` (BrowserRouter) and `src/App.jsx`:

- `/` and `/calendar` → `Calendar` (FullCalendar dayGrid)
- `/list` → `List` (FullCalendar list plugin) — same data, same modal wiring as Calendar
- `/contractcustomers` → `ContractCustomers` (TanStack table)
- `/reports` → `Reports` (completed work by month + PDF export)
- `/diagnostics` → `Diagnostics` (operational log viewer)

### Auth

- Supabase email OTP; `LoginPage.jsx` restricts sign-in to `@pbxtruck.ca`.
- After login, `App.jsx` requires a row in `public.profiles` for the user —
  no row → "Pending approval" gate. The role value (`admin`/`user`) is only
  logged to diagnostics; it does not gate features today.
- To grant access: the user signs in once (creates the auth user), then insert
  a `profiles` row with their `id` and email.

### State model

Shared state lives in `App.jsx` and is passed down as props — no context or
global store. Per the owner's convention: components keep their own hooks/state
in their own file unless multiple components need the same state, in which case
it belongs in `App.jsx`.

### Data flow (Calendar/List)

- `Calendar` and `List` report their visible date range via FullCalendar
  `datesSet` (`onVisibleRangeChange`). `App.jsx` fetches tasks for that range
  padded by `FETCH_PAD_DAYS` (7, in `src/constants.js`), plus all incomplete
  tasks regardless of date (so overdue work clamped to today still appears).
  Completed tasks outside the padded range are not fetched.
- Results are merged into `events` by id; already-covered ranges skip the
  network (`fetchedRangesRef` + `dateRange.js` interval helpers). Ordering is
  `created_at`, then `id`.
- Filtering (department, search) happens in `App.jsx` before `filteredEvents`
  go to the views. Completed tasks are hidden from Calendar/List.
- `Calendar` caps each day at `DAY_CAP` (15) with a `+N` overflow chip
  (`applyEventCap.js`, `OverflowChip.jsx`); `List` shows the first
  `LIST_DAY_CAP` (3) occupied days of the current view. Caps are disabled
  while search is active.
- Incomplete tasks with a past `service_date` are clamped to today
  (`clampToToday` in `mapTaskToEvent.js`).
- `ContractCustomers` and `Reports` fetch their own data directly from
  Supabase (they do not reuse the `App.jsx` events cache), and write edits
  back through `appSetEvents` so the calendar cache stays in sync.

### Mutations

Always the same pattern: call Supabase, then optimistically update `events`
state via `setEvents` without re-fetching. Event ids are `String(task.id)`.

### Diagnostics

`src/diagnostics.js` records privacy-limited operational events (fetch
start/success/fail, auth changes, day-cap overflow, etc.) into the
`app_diagnostics` table, queued in localStorage and flushed in batches. New
fetch/mutation paths should record diagnostics the same way. Never log task
content, customer data, or auth tokens — ids and counts only.

## Database (Supabase)

**`tasks`** — `id, customer, unit, phone, service_date, status, priority,
department (text[]), created_at, complaint, created_by, authorized_estimate (numeric)`

- Status: `queued`, `confirmed`, `completed`, `waiting`
- Priority: `scheduled` (green), `end of day` (yellow), `urgent` (red) — a
  dispatch-set heat map. Canonical strings/colors: `PRIORITY_LABELS` /
  `priorityColors` / `PRIORITY_ORDER` in `src/mapTaskToEvent.js`.
- Department (array, a task may have several): `warranty`, `wash bay`,
  `welding`, `body shop`, `old shop`, `new shop`, `triage`, `mobile service`,
  `external vendor`. Colors in `departmentColors`; `external vendor` renders as
  a `×` glyph badge (`departmentIcons`).
- Contract customers (priority contracts, shown on their own manager view):
  Canada Packers and Trouw — matched case-insensitively by substring in
  `ContractCustomers.jsx` (`CONTRACT_CUSTOMERS = ['canada packers', 'trouw']`).

**`profiles`** — `id (FK auth.users), email, role, created_at`. Existence of a
row = approved.

**`app_diagnostics`** — privacy-limited operational logs (see Diagnostics
above). Schema in `scripts/diagnostics-schema.sql`.

Customer names are free-text — historic duplicates/casing variants exist.
Reconcile at the database level (UPDATE ... SET customer = ...) rather than in
app code.

## Styling

`DESIGN.md` is the design authority — read it before any visual work. Summary
of the non-negotiables:

- Hardcopy-terminal aesthetic: Open Sans single weight, square corners
  everywhere (only department dots are round), 1px hairlines / 3px double
  rules, reverse-video hover, no shadows, no animation except the blinking
  block cursor.
- Priority colors and department dots/icons are data — never retune them,
  and never let chrome red `#f40604` touch task data (ribbon chrome only).

Tailwind v4 plus custom classes in `src/app.css`.

## Key files

- `src/App.jsx` — routing, auth gate, shared state, task fetching, filtering
- `src/mapTaskToEvent.js` — DB row → FullCalendar event; priority/department
  colors, `PRIORITY_ORDER`, `eventOrderComparator`, `clampToToday`
- `src/TaskForm.jsx` — shared form used by `AddTaskModal` and `EditDetailModal`
- `src/Calendar.jsx` / `src/List.jsx` — the two schedule views
- `src/applyEventCap.js`, `src/OverflowChip.jsx` — day-cap overflow logic
- `src/dateRange.js` — `padRange`, `mergeIntervals`, `rangeContains`, `toDateStr`
- `src/ContractCustomers.jsx` — contract-customer priority queue (TanStack table)
- `src/Reports.jsx` + `src/generateWorkOrderReport.js` — monthly completed-work
  table + landscape-letter PDF export
- `src/LegendBar.jsx` (`ColorLegend`, `DepartmentLegend`) — collapsible legend
  with live `N ACTIVE · N URGENT` counts
- `src/diagnostics.js`, `src/Diagnostics.jsx` — logging client + viewer
- `src/supabaseClient.js` — the single shared `supabase` client instance
- `src/constants.js` — `DAY_CAP`, `LIST_DAY_CAP`, `FETCH_PAD_DAYS`, `OVERFLOW_ID_PREFIX`
- `scripts/` — one-off data-migration utilities (CSV → SQL etc.), not part of the app

## Conventions

- FullCalendar is the calendar library — consult https://fullcalendar.io/docs
  when troubleshooting.
- One component per file; hooks/state colocated unless shared (then `App.jsx`).
- Make minimal changes; follow existing code style.
- Keep `DESIGN.md` / `PRODUCT.md` in sync with changes that alter visual rules
  or product behavior.
