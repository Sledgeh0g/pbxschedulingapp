# PBX Supabase Data Migration Guide

This document covers everything needed to migrate work order data from the old system's CSV export into the Supabase `tasks` table.

---

## Supabase Project

- **Project name:** pbxCalendarPrototype
- **Project ID:** `pgheozphfswowlucuarc`
- **Region:** us-east-2

---

## CSV Export Notes

- The CSV export from the old system includes a **BOM header** — always open with `utf-8-sig` encoding, not `utf-8`.
- The old system's `ID` column **does not match** Supabase task IDs. Never use it for matching. Use `created_at` timestamp instead.
- Multi-line complaint/notes fields are wrapped in quotes in the CSV and parse correctly with Python's `csv` module.

---

## Column Mapping: CSV → Supabase `tasks`

| CSV Column       | Supabase Column | Notes |
|------------------|-----------------|-------|
| `Customer`       | `customer`      | Direct copy |
| `Unit%23`        | `unit`          | Direct copy (nullable) |
| `Service Date`   | `service_date`  | Convert M/D/YYYY → YYYY-MM-DD |
| `Complaint/notes`| `complaint`     | Direct copy (nullable) |
| `Created`        | `created_at`    | Convert `M/D/YYYY H:MM AM/PM` → `YYYY-MM-DD HH:MM:00+00` |
| `Created By`     | `created_by`    | Map name → email (see table below) |
| *(derived)*      | `status`        | Derive from Confirmed/Completed/Is Waiting columns (see below) |
| *(derived)*      | `department`    | Was set manually in the app — do NOT re-derive from CSV |

---

## Status Derivation

Derive `status` from the three boolean columns in this priority order:

```python
if completed == 'True':
    status = 'completed'
elif is_waiting == 'True':
    status = 'waiting'
elif confirmed == 'True':
    status = 'confirmed'
else:
    status = 'queued'
```

> **Note:** Tasks manually set to `priority` status in the app will not be in the CSV. If preserving priority tasks, use the UPDATE approach (see below) rather than a full wipe and re-insert.

---

## Date Conversions

**Service Date** — CSV format `6/8/2026` → Supabase format `2026-06-08`:
```python
parts = date_str.split('/')
service_date = f"{parts[2]}-{int(parts[0]):02d}-{int(parts[1]):02d}"
```

**Created At** — CSV format `5/27/2026 4:21 PM` → Supabase format `2026-05-27 16:21:00+00`:
```python
from datetime import datetime
dt = datetime.strptime(raw_ts, '%m/%d/%Y %I:%M %p')
created_at = dt.strftime('%Y-%m-%d %H:%M:00+00')
```

---

## Employee Name → Email Mapping

| CSV "Created By" Name | `created_by` Email        |
|-----------------------|---------------------------|
| Ron Petkau            | rpetkau@pbxtruck.ca       |
| Wes Neufeld           | wneufeld@pbxtruck.ca      |
| Walter Wiens          | wwiens@pbxtruck.ca        |
| Gavin Koop            | gkoop@pbxtruck.ca         |
| All others            | `NULL`                    |

> When going live, confirm whether additional employees need email mappings added to this table.

---

## Migration Strategy: UPDATE via `created_at` (Recommended)

Rather than wiping and re-inserting (which loses manually-set data like `priority` status and `department`), match on `created_at` timestamp which is unique per row and present in both systems.

### Python script to generate the SQL

```python
import csv
from datetime import datetime

email_map = {
    'Ron Petkau':   'rpetkau@pbxtruck.ca',
    'Wes Neufeld':  'wneufeld@pbxtruck.ca',
    'Walter Wiens': 'wwiens@pbxtruck.ca',
    'Gavin Koop':   'gkoop@pbxtruck.ca',
}

rows = []
with open('your_export.csv', newline='', encoding='utf-8-sig') as f:
    reader = csv.reader(f)
    headers = next(reader)
    cb_idx = headers.index('Created By')
    created_idx = headers.index('Created')

    for row in reader:
        if len(row) <= cb_idx:
            continue
        name = row[cb_idx].strip()
        email = email_map.get(name)
        if not email:
            continue
        raw_ts = row[created_idx].strip()
        dt = datetime.strptime(raw_ts, '%m/%d/%Y %I:%M %p')
        ts = dt.strftime('%Y-%m-%d %H:%M:00+00')
        rows.append(f"('{ts}', '{email}')")

values = ',\n  '.join(rows)
print(f"""UPDATE tasks
SET created_by = v.email
FROM (VALUES
  {values}
) AS v(created_at, email)
WHERE tasks.created_at = v.created_at::timestamptz;""")
```

Run the printed SQL in the Supabase SQL editor or via the MCP `execute_sql` tool.

---

## Full Wipe and Re-insert (Go-Live / Fresh Import)

Use this when importing into a fresh or empty `tasks` table. This script builds a complete INSERT from the CSV.

```python
import csv
from datetime import datetime

email_map = {
    'Ron Petkau':   'rpetkau@pbxtruck.ca',
    'Wes Neufeld':  'wneufeld@pbxtruck.ca',
    'Walter Wiens': 'wwiens@pbxtruck.ca',
    'Gavin Koop':   'gkoop@pbxtruck.ca',
}

def escape(val):
    if val is None:
        return 'NULL'
    return "'" + str(val).replace("'", "''") + "'"

def parse_date(s):
    parts = s.strip().split('/')
    return f"{parts[2]}-{int(parts[0]):02d}-{int(parts[1]):02d}"

def parse_ts(s):
    dt = datetime.strptime(s.strip(), '%m/%d/%Y %I:%M %p')
    return dt.strftime('%Y-%m-%d %H:%M:00+00')

def derive_status(confirmed, completed, waiting):
    if completed == 'True': return 'completed'
    if waiting == 'True':   return 'waiting'
    if confirmed == 'True': return 'confirmed'
    return 'queued'

rows = []
with open('your_export.csv', newline='', encoding='utf-8-sig') as f:
    reader = csv.reader(f)
    headers = next(reader)

    idx = {h: i for i, h in enumerate(headers)}

    for row in reader:
        if len(row) < len(headers) - 3:
            continue

        def col(name):
            i = idx.get(name)
            return row[i].strip() if i is not None and i < len(row) else ''

        customer    = escape(col('Customer') or None)
        unit        = escape(col('Unit%23') or None)
        service_date= escape(parse_date(col('Service Date'))) if col('Service Date') else 'NULL'
        complaint   = escape(col('Complaint/notes') or None)
        created_at  = escape(parse_ts(col('Created'))) if col('Created') else 'NULL'
        created_by  = escape(email_map.get(col('Created By')))
        status      = escape(derive_status(col('Confirmed'), col('Completed'), col('Is Waiting')))

        rows.append(f"  ({customer}, {unit}, {service_date}, {status}, NULL, {complaint}, {created_at}, {created_by})")

print("DELETE FROM tasks;\n")
print("INSERT INTO tasks (customer, unit, service_date, status, department, complaint, created_at, created_by) VALUES")
print(',\n'.join(rows) + ';')
```

> `department` is set to `NULL` on import — it must be assigned manually in the app afterward, or a separate department mapping needs to be built.

---

## Known Edge Cases

- **Duplicate `created_at` timestamps:** A small number of tasks were created at the exact same second (e.g., three tasks at `2026-06-02 08:56:00`). The UPDATE approach will still set all matching rows — acceptable since most share the same creator. For the go-live import, timestamps from the real system are unlikely to collide.
- **Unmapped employees:** Kathy Watson, Ron Harder, Darryl Kehler (and any others not in the email map) will have `created_by = NULL`. Add them to `email_map` if they have app accounts at go-live.
- **Single quotes in complaints:** The `escape()` helper above doubles them (`''`) for SQL safety.
- **Employees added since June:** The new app captures `created_by` automatically via `supabase.auth.getUser()` on task creation — no manual mapping needed for those.

---

## Verification After Import

```sql
-- Count rows with created_by populated
SELECT COUNT(*) FROM tasks WHERE created_by IS NOT NULL;

-- Spot-check a few
SELECT customer, created_at, created_by FROM tasks ORDER BY created_at LIMIT 10;

-- See breakdown by creator
SELECT created_by, COUNT(*) FROM tasks GROUP BY created_by ORDER BY count DESC;
```
