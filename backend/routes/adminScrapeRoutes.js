const express = require('express');
const router = express.Router();
const { scrapeAlumni } = require('../services/scrapeService');

// Protect this route in production (ensure admin auth). For now, it is available but should be
// guarded by middleware (e.g., JWT/auth) in a real deployment.

function toCSV(items) {
  // Only export name, institute, percentage (user requested)
  if (!items || !Array.isArray(items)) return '';
  const headers = ['name', 'institute', 'percentage'];
  const escapeCell = (v) => {
    if (v === undefined || v === null) return '';
    const s = String(v);
    if (s.includes(',') || s.includes('\n') || s.includes('"')) {
      return '"' + s.replace(/"/g, '""') + '"';
    }
    return s;
  };

  const rows = items.map(it => {
    const name = it.name || it.title || it.nameGuess || '';
    const institute = it.institute || it.inferredInstitute || '';
    let percentage = it.percentage || '';

    // Attempt to extract percentage from snippet or title if not provided
    if (!percentage) {
      const text = (it.snippet || '') + ' ' + (it.title || '');
      // look for patterns like 85% or 85.5% or '85 percent' or '85.5 percent'
      const m = text.match(/(\d{1,3}(?:\.\d+)?)(?:\s?%|\s?(?:percent|percentage))/i);
      if (m && m[1]) {
        percentage = m[1];
        // ensure we include % symbol
        if (!percentage.includes('%')) percentage = percentage + '%';
      }
    }

    return headers.map(h => escapeCell(h === 'name' ? name : (h === 'institute' ? institute : percentage))).join(',');
  });

  return headers.join(',') + '\n' + rows.join('\n');
}

/**
 * POST /api/admin/scrape
 * body: { institute: string, passingYear?: number, maxResults?: number, download?: boolean }
 * If download=true (in body or query), returns a CSV attachment of discovered items.
 */
router.post('/scrape', async (req, res) => {
  try {
    const { institute, passingYear, maxResults, download } = req.body || {};
    if (!institute) return res.status(400).json({ message: 'Missing institute' });

    console.log('[adminScrape] request', { institute, passingYear, maxResults, download });
    console.log('[adminScrape] Google CSE configured?', !!process.env.GOOGLE_CSE_API_KEY, !!process.env.GOOGLE_CSE_CX);

    let results = await scrapeAlumni(institute, passingYear, maxResults || 50);

    // decide whether server is configured to use Google CSE
    const usedCSE = !!(process.env.GOOGLE_CSE_API_KEY && process.env.GOOGLE_CSE_CX);

    // If a passingYear was provided and items look like mock data with passingYear field, filter those
    const yearNum = Number(passingYear) || null;
    if (yearNum) {
      results = results.filter(it => {
        if (it.passingYear !== undefined && it.passingYear !== null) {
          return Number(it.passingYear) <= yearNum;
        }
        // If no passingYear info, keep the item (can't determine)
        return true;
      });
    }

    // If caller requested CSV download, send as attachment
    const wantsCsv = download === true || String(req.query.download) === 'true';
    if (wantsCsv) {
      const csv = toCSV(results);
      const filename = `alumni_${institute.replace(/\s+/g, '_')}_${passingYear || 'all'}.csv`;
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      return res.send(csv);
    }

    res.json({ ok: true, count: results.length, usedCSE, items: results });
  } catch (err) {
    console.error('Scrape error', err && err.stack ? err.stack : err);
    res.status(500).json({ ok: false, message: err.message || String(err) });
  }
});

module.exports = router;
