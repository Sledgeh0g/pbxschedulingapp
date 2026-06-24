import fs from 'fs';
import Papa from 'papaparse';

const inputPath = 'public/wo_test.csv';
const outputPath = 'public/wo_test_with_created_at.csv';

const csvContent = fs.readFileSync(inputPath, 'utf8');

const parsed = Papa.parse(csvContent, {
  header: true,
  skipEmptyLines: true,
});

function randomMay2026Timestamp() {
  const day = Math.floor(Math.random() * 31) + 1;
  const hour = Math.floor(Math.random() * 24);
  const minute = Math.floor(Math.random() * 60);
  const second = Math.floor(Math.random() * 60);

  const dd = String(day).padStart(2, '0');
  const hh = String(hour).padStart(2, '0');
  const mm = String(minute).padStart(2, '0');
  const ss = String(second).padStart(2, '0');

  return `2026-05-${dd}T${hh}:${mm}:${ss}-06:00`;
}

const rowsWithCreatedAt = parsed.data.map(row => {
  return {
    ...row,
    created_at: randomMay2026Timestamp()
  };
});

const headers = [...parsed.meta.fields, 'created_at'];

// Quote all string fields for better compatibility (similar to original)
const output = Papa.unparse({
  fields: headers,
  data: rowsWithCreatedAt
}, {
  quotes: true,           // quote all fields
  quoteChar: '"',
  escapeChar: '"'
});

fs.writeFileSync(outputPath, output);

console.log(`Created ${outputPath} with ${rowsWithCreatedAt.length} rows (including header)`);
console.log('\nHeader row:');
console.log(headers.join(','));
console.log('\nFirst 3 data rows (created_at column):');
rowsWithCreatedAt.slice(0, 3).forEach((r, i) => {
  console.log(`${i + 1}. ${r.created_at}`);
});
