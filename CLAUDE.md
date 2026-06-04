# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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

## Architecture

Single-page React app (React 19 + Vite) backed by a Supabase `tasks` table. State lives entirely in `App.jsx` and is passed down as props — there is no context or global store.

**Data flow:**
- `App.jsx` fetches all tasks from Supabase on mount, maps them through `mapTaskToEvent.js` into FullCalendar event objects, and stores them in `events` state.
- Filtering (dispatch mode, department, search) is done in `App.jsx` before passing `filteredEvents` to views.
- `Calendar` and `List` are two views of the same data — both render FullCalendar (dayGrid vs list plugins) with identical props and modal wiring.

**Task data shape (Supabase `tasks` table):**
`id, customer, unit, service_date, status, department, created_at`

**Status values:** `queued`, `confirmed`, `completed`, `waiting`  
**Department values:** `warranty`, `wash bay`, `welding`, `body shop`, `old shop`, `new shop`

**Dispatch mode:** a boolean toggle that filters to show only `queued` tasks (for dispatchers) vs all non-queued tasks.

**Key files:**
- `src/mapTaskToEvent.js` — transforms a DB row into a FullCalendar event object; also defines `statusColors`
- `src/TaskForm.jsx` — shared form used by both `AddTaskModal` and `EditDetailModal`
- `src/supabaseClient.js` — exports a single `supabase` client instance

**Mutations always follow the same pattern:** call Supabase, then optimistically update `events` state via `setEvents` without re-fetching.

## Styling

Tailwind CSS v4 (via `@tailwindcss/vite` plugin) plus custom classes in `src/app.css`. The React Compiler (`babel-plugin-react-compiler`) is enabled — avoid manual `useMemo`/`useCallback` optimizations.

**Comments from Project Owner**

The calendar library is FullCalender. For troubleshooting read documentation here https://fullcalendar.io/docs

Components should have their own files, hooks and state should be in the component file, unless multiple components need access to the state.
In this case, hooks and state should be handled in app.jsx.

**Why I am building this application**

PBX Truck Service is the truck repair shop I am building the app for and they need a scheduling tool to coordinate their work orders. Each work order can be seen as a task that needs to be managed from customer complaint, until correction and completion of work. There are multiple departments that are assigned to tasks, and multiple status categories that tasks can be labeled.

I also need to build a separate list for managing tasks created for a specific company. This is the case because two customers of PBX Truck Service have contracts that stipulate they get priority over other customers. Because of this we need to build a separate task list that shows tasks in order of creation for these customers. Their tasks can be displayed on the regular calendar, but we need a separate task list (view) in the app for managers to keep track of them. 