import csv
from datetime import datetime
from zoneinfo import ZoneInfo

INPUT = 'public/data-migration.csv'
OUTPUT = 'scripts/data-migration-insert.sql'
BATCH_SIZE = 50

CENTRAL = ZoneInfo('America/Winnipeg')
UTC = ZoneInfo('UTC')

FOREMAN_TO_DEPT = {
    'David Reimer': 'new shop',
    'James Fehr': 'old shop',
    'Walter Wiens': 'welding',
    'Brooke Penney': 'wash bay',
    'Kayla Dubell': 'body shop',
    'Ron Harder': 'body shop',
    'Triage (Todd)': 'triage',
}


def sql_str(value):
    if value is None:
        return 'NULL'
    return "'" + str(value).replace("'", "''") + "'"


def sql_str_array(values):
    if not values:
        return "'{}'"
    escaped = [v.replace("'", "''").replace('"', '\\"') for v in values]
    return "ARRAY[" + ", ".join(sql_str(v) for v in values) + "]::text[]"


def parse_service_date(raw):
    dt = datetime.strptime(raw.strip(), '%m/%d/%Y')
    return dt.strftime('%Y-%m-%d')


def parse_created_at(raw):
    dt = datetime.strptime(raw.strip(), '%m/%d/%Y %I:%M %p')
    dt = dt.replace(tzinfo=CENTRAL)
    return dt.astimezone(UTC).strftime('%Y-%m-%dT%H:%M:%SZ')


def derive_department(row):
    depts = []
    foreman = row['Foreman'].strip()
    if foreman:
        mapped = FOREMAN_TO_DEPT.get(foreman)
        if mapped:
            depts.append(mapped)
    if row['Wash Bay'].strip() == 'True':
        depts.append('wash bay')
    if row['Welding'].strip() == 'True':
        depts.append('welding')
    if row['Body Shop'].strip() == 'True':
        depts.append('body shop')
    # dedupe, preserve order
    return list(dict.fromkeys(depts))


def transform_row(row):
    unit = row['Unit%23'].strip() or None
    complaint = row['Complaint/notes'].strip() or None
    status = 'completed' if row['Completed'].strip() == 'True' else 'queued'
    return {
        'customer': row['Customer'].strip(),
        'unit': unit,
        'service_date': parse_service_date(row['Service Date']),
        'status': status,
        'department': derive_department(row),
        'created_at': parse_created_at(row['Created']),
        'complaint': complaint,
        'created_by': row['Created By'].strip() or None,
        'priority': 'scheduled',
    }


def main():
    with open(INPUT, encoding='utf-8-sig', newline='') as f:
        reader = csv.DictReader(f)
        rows = [transform_row(r) for r in reader]

    print(f'Transformed {len(rows)} rows')

    columns = ['customer', 'unit', 'service_date', 'status', 'department',
               'created_at', 'complaint', 'created_by', 'priority']

    with open(OUTPUT, 'w') as out:
        for i in range(0, len(rows), BATCH_SIZE):
            batch = rows[i:i + BATCH_SIZE]
            values_lines = []
            for r in batch:
                values = [
                    sql_str(r['customer']),
                    sql_str(r['unit']),
                    sql_str(r['service_date']),
                    sql_str(r['status']),
                    sql_str_array(r['department']),
                    sql_str(r['created_at']),
                    sql_str(r['complaint']),
                    sql_str(r['created_by']),
                    sql_str(r['priority']),
                ]
                values_lines.append('  (' + ', '.join(values) + ')')
            stmt = (
                f"INSERT INTO tasks ({', '.join(columns)}) VALUES\n"
                + ',\n'.join(values_lines)
                + ';\n'
            )
            out.write(stmt)
            out.write('\n')

    print(f'Wrote {OUTPUT}')

    # quick sanity summary
    statuses = {}
    depts_empty = 0
    for r in rows:
        statuses[r['status']] = statuses.get(r['status'], 0) + 1
        if not r['department']:
            depts_empty += 1
    print('status counts:', statuses)
    print('rows with empty department:', depts_empty)


if __name__ == '__main__':
    main()
