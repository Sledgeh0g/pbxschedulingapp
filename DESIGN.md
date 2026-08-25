---
mode: operate
world: hardcopy-terminal
palette:
  paper: "#ffffff"
  ink: "#171717"
  ink-soft: "#4d4d4d"
  ink-faint: "#6b6b6b"
  rule: "#d6d6d6"
  red: "#f40604"
  red-dark: "#b90302"
data-colors-pinned:
  priority:
    scheduled: "#16a34a"
    end of day: "#f59e0b"
    urgent: "#dc2626"
  department:
    warranty: "#dc2626"
    wash bay: "#06b6d4"
    body shop: "#ea580c"
    welding: "#92400e"
    triage: "#ec4899"
    old shop: "#1e3a5f"
    new shop: "#eab308"
    mobile service: "#000000"
    external vendor: "× glyph badge, #4b5563"
typography:
  stack: "'DEC Terminal Modern', 'VT323', 'Courier New', ui-monospace, monospace"
  embedded-face: VT323 Regular (SIL OFL 1.1 — src/assets/fonts/, license in OFL.txt)
  base: 17px
  scale:
    data: 15-17px
    chrome-labels: 13-15px uppercase, letter-spacing 0.06-0.12em
    toolbar-title: 24px uppercase
    metric-count: 30px
  weight: 400 only (single-weight face; hierarchy = size, case, rules, reverse video)
geometry:
  border-radius: 0 everywhere
  exceptions: pinned department dots (50%) — user-locked icon form
  rules: 1px ink or #d6d6d6 hairlines; 3px double ink for title/header separations
  shadows: none
state-language:
  hover: reverse video (ink field, paper text)
  active-primary: red field, white text
  focus: 1px red outline; red caret; blinking block cursor on text fields
  disabled: faded ink, dashed-rule gray border
known-exceptions:
  - "White on brand red #f40604 measures 4.31:1 — kept per pinned brand red; used
    only for short uppercase chrome labels (tabs, primary buttons), never body text."
  - "Priority rail (3px left border in priority color) on calendar tickets and
    contract-table rows is brief-approved and carries pinned heat-map data."
---

# Design — Schedule, PBX Truck Service

## World

A DECwriter hardcopy terminal. Monospace ink on white fanfold paper, red ribbon
for emphasis. Chosen because the product is a shop board dispatch reads for
eight hours: nothing decorative, everything printed, all of it scannable.

The world decision was user-pinned (terminal aesthetic, white/red, no radius,
mono everywhere) — no concept roll was run; the brief was the authority.

## Non-negotiables (user-locked)

- Priority colors and department dots/icons are data. Never retune, never
  replace, never let chrome red `#f40604` touch a task.
- Workflows are fixed. Views, modals, drag/drop, filters, fetch/cap logic
  are out of scope for visual work.
- `#f40604` is ribbon only: brand mark, active view tab, primary actions,
  focus/selection. It never appears inside task data.

## Grammar

- **Square everything.** Radius 0 across chrome, forms, tables, modals,
  FullCalendar. The only circles are the pinned department dots.
- **Hairlines and double rules.** `1px solid` divides content;
  `3px double var(--ink)` is the terminal `═` — used under the shop bar,
  the calendar toolbar, column headers, and table heads.
- **Reverse video = state.** Hover inverts to ink/paper; the active view tab
  and submit buttons are red/paper. There are no gray hover states.
- **One typeface, one weight.** Hierarchy is size, uppercase tracking, rules,
  and reverse video — never a second family or a bold that doesn't exist.

## Structure

- **Shop bar:** one flush strip — red SCHEDULE block + PBX TRUCK SERVICE,
  `SHOP:` department select, search (with blinking block cursor), view tabs.
  Active tab is red reverse video.
- **Legend bar:** user-expandable (`[ LEGEND + / – ]`, persisted to
  localStorage `pbx-legend-open`, default open). One panel holds both keys:
  PRIORITY (square swatches) and DEPARTMENT (pinned round dots + × badge).
  Right side is a live status line (`N ACTIVE · N URGENT`) from loaded events.
- **Calendar:** day headers uppercase on a double rule; today's header cell is
  red reverse video; tickets are white squares with a 1px priority border and
  3px left rail (priority comes from FullCalendar's inline borderColor — the
  data path is untouched); hover inverts to ink. Department dots unchanged.
- **Tables:** 1px ink container, double-rule head, hairline rows, priority
  left rail per row, reverse-video row hover. No pastel row washes.
- **Modals:** TUI window — ink title bar (title left, `[×]` right, hover red),
  square white body, square inputs, department chips keep their pinned colors.
  Edit/Delete are text buttons; no emoji icons.
- **Login:** bordered sign-on panel — ink title bar (`PBX TRUCK SERVICE` /
  white-on-red `SCHEDULE`), labeled fields, red submit, footer noting
  `@pbxtruck.ca` restriction.

## Typography

VT323 (OFL 1.1) is embedded at `src/assets/fonts/` with its license. The stack
leads with `DEC Terminal Modern` so a locally licensed copy takes precedence —
that face is "free for personal use" (© 2015 Dan Mecklenburg) and is **not**
bundled; VT323 supplies the same DEC VT320 letterforms for everyone else.

## Motion

One authored behavior: the 1s steps() blinking block cursor in focused text
fields. Everything else is instant state change. No entrances, no choreography.

## Build verification record

- `npm run build` clean; `npm run lint` — 2 pre-existing TanStack Table /
  React Compiler warnings, zero errors.
- Direction contract comment lives in `index.html` (survives `vite build`;
  verified in `dist/index.html`).
- Detector ran in degraded regex mode: one warning (the 3px priority rail),
  documented above as brief-pinned.
- Screenshot review was not possible in this environment (no system browser
  libraries, no sudo); visual verification was code-level. First real-browser
  check on a workstation should confirm: VT323 loading, today-header red
  inversion, ticket rails, legend toggle persistence.
