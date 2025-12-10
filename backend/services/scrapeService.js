const fetch = require('node-fetch');

// simple utility to strip tags and collapse whitespace
function stripTags(html) {
  return html.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<!--([\s\S]*?)-->/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

async function fetchAndExtract(link, instituteHint) {
  try {
    const res = await fetch(link, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; AlumniScraper/1.0)' } });
    if (!res.ok) return null;
    const html = await res.text();

    // Try meta tags first
    const metaTitleMatch = html.match(/<meta\s+property=(?:"|')og:title(?:"|')\s+content=(?:"|')([^"']+)(?:"|')/i)
      || html.match(/<meta\s+name=(?:"|')title(?:"|')\s+content=(?:"|')([^"']+)(?:"|')/i);
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const h1Match = html.match(/<h1[^>]*>([^<]+)<\/h1>/i) || html.match(/<h2[^>]*>([^<]+)<\/h2>/i);

    const nameCandidates = [];
    if (metaTitleMatch) nameCandidates.push(metaTitleMatch[1].trim());
    if (titleMatch) nameCandidates.push(titleMatch[1].trim());
    if (h1Match) nameCandidates.push(h1Match[1].trim());

    // Fallback: look for patterns like "Name: John Doe" or lines with two words capitalized
    const text = stripTags(html);
    const personMatch = text.match(/\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3})\b/);
    if (personMatch) nameCandidates.push(personMatch[1]);

    const name = nameCandidates.length ? nameCandidates[0] : '';

    // Institute: prefer instituteHint, else try to find explicit institute mention
    let institute = '';
    if (instituteHint && String(text).toLowerCase().includes(String(instituteHint).toLowerCase())) institute = instituteHint;
    else {
      const instMatch = text.match(/(IIT\s+[A-Za-z]+|VIT\s+[A-Za-z]+|College of Engineering Pune|COEP|University of [A-Za-z]+)/i);
      if (instMatch) institute = instMatch[0];
    }

    // Percentage: find patterns like 85% or 85.5% or '85 percent' or 'CGPA 8.5'
    let percentage = '';
    const percMatch = text.match(/(\d{1,3}(?:\.\d+)?)(?:\s?%|\s?(?:percent|percentage|% marks))/i);
    if (percMatch) percentage = percMatch[1] + '%';
    else {
      const cgpaMatch = text.match(/CGPA[:\s]+(\d(?:\.\d+)?)/i);
      if (cgpaMatch) {
        const cg = parseFloat(cgpaMatch[1]);
        if (!isNaN(cg)) percentage = Math.round(cg * 9.5 * 100) / 100 + '%';
      }
    }

    return { name, institute, percentage };
  } catch (err) {
    console.error('[fetchAndExtract] failed for', link, err && err.message ? err.message : err);
    return null;
  }
}

/**
 * scrapeAlumni
 * - Attempts to discover public alumni entries for a given institute and passing year.
 * - If GOOGLE_CSE_API_KEY and GOOGLE_CSE_CX are provided, it will query Google Custom Search
 *   and return lightweight structured results (title/snippet/link). Parsing names reliably
 *   from arbitrary pages is non-trivial; this service returns candidate results to review.
 * - If no API key is configured, the function returns mock demo data so the admin UI can
 *   be tested locally.
 *
 * NOTE: Scraping third-party sites (LinkedIn, social platforms) may violate their Terms of Service.
 * Always review legal/ToS requirements and prefer official APIs or licensed data providers.
 */
async function scrapeAlumni(institute, passingYear, maxResults = 50, parsePages = true) {
  if (!institute) throw new Error('Missing institute');
  passingYear = Number(passingYear) || new Date().getFullYear();

  const apiKey = process.env.GOOGLE_CSE_API_KEY;
  const cx = process.env.GOOGLE_CSE_CX;

  // If Google Custom Search API is configured, use it to find public pages mentioning alumni
  if (apiKey && cx) {
    const query = `${institute} alumni ${passingYear}`;
    const url = `https://www.googleapis.com/customsearch/v1?key=${encodeURIComponent(apiKey)}&cx=${encodeURIComponent(cx)}&q=${encodeURIComponent(query)}&num=${Math.min(maxResults,10)}`;
    console.log('[scrapeService] Google CSE URL:', url);
    let resp;
    try {
      resp = await fetch(url);
    } catch (netErr) {
      console.error('[scrapeService] network error when calling Google CSE', netErr);
      throw new Error('Network error calling Google Custom Search API: ' + (netErr.message || String(netErr)));
    }
    if (!resp.ok) {
      const txt = await resp.text();
      console.error('[scrapeService] Google CSE returned non-OK', resp.status, txt);
      throw new Error(`Google CSE failed: ${resp.status} ${txt}`);
    }
    const json = await resp.json();
    console.log('[scrapeService] Google CSE returned items:', Array.isArray(json.items) ? json.items.length : 0);
    if (Array.isArray(json.items) && json.items.length > 0) {
      const first = json.items[0];
      console.log('[scrapeService] first item preview:', { title: first.title, link: first.link, snippet: first.snippet });
    }
    const items = (json.items || []).map((it, idx) => ({
      source: it.displayLink || it.link,
      title: it.title,
      snippet: it.snippet,
      link: it.link,
      inferredInstitute: institute,
      inferredPassingYear: passingYear,
      // percentage/name are best-effort – consumer of this API should parse pages or ask for manual review
      nameGuess: it.title ? it.title.split('-')[0].trim() : undefined,
      id: `gcs-${idx}-${Date.now()}`,
    }));
    if (parsePages && items.length > 0) {
      const enhanced = [];
      // limit number of pages to fetch to avoid long waits
      const toFetch = items.slice(0, Math.min(items.length, 10));
      for (const it of toFetch) {
        try {
          const parsed = await fetchAndExtract(it.link, institute);
          if (parsed) enhanced.push({ ...it, ...parsed });
          else enhanced.push(it);
        } catch (err) {
          enhanced.push(it);
        }
      }
      // append any remaining items without page parsing
      if (items.length > enhanced.length) enhanced.push(...items.slice(enhanced.length));
      return enhanced;
    }
    return items;
  }

  // Fallback: return mock data for local testing/demo
  const demos = [];
  const count = Math.min(30, maxResults || 30);
  for (let i = 0; i < count; i++) {
    const year = passingYear - Math.floor(Math.random() * 6); // passingYear and below
    demos.push({
      id: `mock-${i}-${Date.now()}`,
      name: `${institute.split(' ')[0] || 'Alum'} Person ${i + 1}`,
      institute,
      passingYear: year,
      percentage: (Math.random() * 30 + 60).toFixed(2),
      source: 'mock-data',
      note: 'This is simulated demo data — configure GOOGLE_CSE_API_KEY and GOOGLE_CSE_CX for real search results or implement an approved scraping pipeline.',
    });
  }
  return demos;
}

module.exports = { scrapeAlumni };
