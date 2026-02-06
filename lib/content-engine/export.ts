interface ContentItem {
  scheduled_date: string;
  time_slot: string;
  funnel_stage: string;
  storybrand_stage: string;
  format: string;
  topic: string | null;
  hook: string | null;
  script_body: string | null;
  cta: string | null;
  caption: string | null;
  hashtags: string[] | null;
  platforms: string[];
  status: string;
}

export function exportToCSV(items: ContentItem[]): string {
  const headers = [
    'Date',
    'Time Slot',
    'Funnel Stage',
    'StoryBrand Stage',
    'Format',
    'Topic',
    'Hook',
    'Script',
    'CTA',
    'Caption',
    'Hashtags',
    'Platforms',
    'Status',
  ];

  const rows = items.map(item => [
    item.scheduled_date,
    item.time_slot,
    item.funnel_stage,
    item.storybrand_stage,
    item.format.replace(/_/g, ' '),
    item.topic || '',
    item.hook || '',
    item.script_body || '',
    item.cta || '',
    item.caption || '',
    (item.hashtags || []).join(' '),
    item.platforms.join(', '),
    item.status,
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row =>
      row.map(cell => {
        // Escape quotes and wrap in quotes if contains comma or newline
        const escaped = String(cell).replace(/"/g, '""');
        return /[,\n"]/.test(escaped) ? `"${escaped}"` : escaped;
      }).join(',')
    ),
  ].join('\n');

  return csvContent;
}

export function downloadCSV(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
