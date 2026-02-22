export interface CriminalRecord {
  name: string;
  reference: string;
  arrests: { date: string; charges: string }[];
}

export async function fetchCriminalRecord(url: string): Promise<CriminalRecord | null> {
  const match = url.match(/mdt\.sincity-rp\.fr\/public\/criminal_records\/(\d+)/);
  if (!match) return null;

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'LSPD-Warrant-System/1.0' },
    });

    if (!res.ok) return null;

    const html = await res.text();

    const nameMatch = html.match(/Casier Judiciaire de\s+([^<]+)/);
    const name = nameMatch ? nameMatch[1].trim() : 'Inconnu';

    const refMatch = html.match(/[Rr][ée]f[ée]rence\s*:\s*(\d+)/);
    const reference = refMatch ? refMatch[1] : match[1];

    const arrests: { date: string; charges: string }[] = [];

    const tableRegex = /<tr[^>]*>\s*<td[^>]*>([\s\S]*?)<\/td>\s*<td[^>]*>([\s\S]*?)<\/td>\s*<\/tr>/gi;
    let rowMatch;
    let isHeader = true;

    while ((rowMatch = tableRegex.exec(html)) !== null) {
      const col1 = rowMatch[1].replace(/<[^>]+>/g, '').trim();
      const col2 = rowMatch[2].replace(/<[^>]+>/g, '').trim();

      if (isHeader && (col1.toLowerCase().includes('date') || col1 === name)) {
        isHeader = false;
        continue;
      }
      isHeader = false;

      if (col1 && /\d{2}\/\d{2}\/\d{4}/.test(col1)) {
        arrests.push({ date: col1, charges: col2 || '-' });
      }
    }

    return { name, reference, arrests };
  } catch (error) {
    console.error('Error fetching criminal record:', error);
    return null;
  }
}
