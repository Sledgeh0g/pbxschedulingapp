# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary: dispatch / service writers at PBX Truck Service. They sit at office desks or shop PCs, take incoming work, create work orders, assign departments, and set urgency.

Secondary: shop managers who watch contract-customer priority and completed-work reports. Shop-floor techs may look; they are not the primary users.

## Product Purpose

Internal scheduling tool for PBX Truck Service, a truck repair shop. Each work order is a task managed from customer complaint through correction and completion.

Success is three jobs at once:
- One live shop board — everyone sees the same work orders, urgency, and departments instead of hunting the old system or a shared calendar.
- A contract-first queue — Canada Packers and Trouw never get lost behind other customers; managers can see those jobs in creation order.
- Dispatch to done — intake → queued → assigned → completed, with reports of finished work.

## Positioning

A shop-specific work-order board for this yard: department assignment, dispatch-set urgency, and a dedicated contract-customer queue. A generic calendar or neighboring shop software cannot truthfully claim those three together for PBX.

## Operating Context

Used on desktop in the shop office, not as a phone-first floor app. Replaces an older work-order system; historical jobs arrive via CSV export into the Supabase `tasks` table. Staff sign in with company email. New accounts wait for manager approval before they can use the app.

Views in use: Calendar, List, Contract Customers, Reports.

## Capabilities and Constraints

- Auth is internal only: `@pbxtruck.ca` email OTP. No public signup.
- A `profiles` row (role) is required; unapproved accounts see a pending-approval gate.
- Task fields: customer, unit, phone, service date, status, priority, department(s), complaint, created_at, created_by.
- Statuses: queued, confirmed, completed, waiting.
- Priorities (dispatch-set heat map): scheduled, end of day, urgent.
- Departments (a task may have more than one): warranty, wash bay, welding, body shop, old shop, new shop, triage, mobile service, external vendor.
- Contract customers: Canada Packers and Trouw. They appear on the regular calendar and on a separate manager list ordered by creation (then priority).
- Calendar and List are two views of the same non-completed work. Reports is completed work by month, with export.
- Stack is already chosen: React 19 + Vite + Tailwind + FullCalendar + Supabase. Do not treat this as a greenfield stack decision.

## Brand Commitments

Product name in the shop: Schedule. Company: PBX Truck Service (`pbxtruck.ca`). No other brand voice, assets, or visual identity were made binding.

## Evidence on Hand

- Owner notes in `CLAUDE.md` (why the app exists, contract-customer requirement, dispatch heat map).
- Migration facts in `MIGRATION.md` (old-system CSV, employee email map). Do not invent additional customers, testimonials, or performance claims.
- Live data lives in Supabase `tasks` / `profiles`; do not fabricate sample work orders as if they were real jobs.

## Product Principles

- Dispatch can see and move the whole shop from one board.
- Urgency and department are first-class, not buried in notes.
- Contract-customer priority is visible and auditable.
- Only PBX staff get in; unapproved accounts stay out.
- Desktop shop-office use beats mobile-first flourishes.
