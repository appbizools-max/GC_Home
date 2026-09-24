/**
 * Utility function to convert an array of objects to CSV and trigger browser download.
 */
export function exportToCSV<T extends Record<string, any>>(
  filename: string,
  rows: T[],
  headers?: { key: keyof T; label: string }[]
): void {
  if (!rows || rows.length === 0) {
    alert('No data available to export.');
    return;
  }

  // Determine headers
  const keys = headers ? headers.map(h => h.key) : (Object.keys(rows[0]) as (keyof T)[]);
  const headerLabels = headers ? headers.map(h => h.label) : (keys as string[]);

  // Format headers line
  const csvLines: string[] = [];
  csvLines.push(headerLabels.map(label => `"${String(label).replace(/"/g, '""')}"`).join(','));

  // Format row lines
  for (const row of rows) {
    const values = keys.map(key => {
      let val: any = row[key];
      if (val === null || val === undefined) {
        return '""';
      }
      // Format ISO timestamp strings if key contains Date/At/Created/Time
      if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:/.test(val)) {
        try {
          val = new Date(val).toLocaleString('en-IN', {
            dateStyle: 'medium',
            timeStyle: 'short',
          });
        } catch {}
      }
      if (typeof val === 'object') {
        return `"${JSON.stringify(val).replace(/"/g, '""')}"`;
      }
      return `"${String(val).replace(/"/g, '""')}"`;
    });
    csvLines.push(values.join(','));
  }

  const csvString = csvLines.join('\n');
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
