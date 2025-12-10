"use client";

import React, { useState, useEffect } from 'react';

type RowItem = {
  id: number;
  raw: string[];
  status: 'queued' | 'hashing' | 'storing' | 'stored' | 'failed';
  hash?: string;
  error?: string;
};

function bufferToHex(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer);
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function sha256Hex(text: string) {
  if (typeof window === 'undefined' || !window.crypto || !window.crypto.subtle) {
    // fallback simple hash (NOT cryptographically secure) – used only for environments where subtle isn't available
    let h = 0;
    for (let i = 0; i < text.length; i++) h = Math.imul(31, h) + text.charCodeAt(i) | 0;
    return (h >>> 0).toString(16).padStart(8, '0');
  }
  const enc = new TextEncoder();
  const data = enc.encode(text);
  const hash = await window.crypto.subtle.digest('SHA-256', data);
  return bufferToHex(hash);
}

export default function AdminUploadPage() {
  const [files, setFiles] = useState<FileList | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // CSV processing/visualization state
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [rows, setRows] = useState<RowItem[]>([]);
  const [blocks, setBlocks] = useState<{ index: number; hash: string; timestamp: string }[]>([]);
  const [csvError, setCsvError] = useState<string | null>(null);
  // Alumni discovery (client-side, no APIs required)
  const [institute, setInstitute] = useState('IIT Delhi');
  const [passingYear, setPassingYear] = useState<number | ''>(new Date().getFullYear());
  const [discovered, setDiscovered] = useState<any[]>([]);
  const [rawFetchedItems, setRawFetchedItems] = useState<any[] | null>(null);
  const [selectedIds, setSelectedIds] = useState<Record<string, boolean>>({});
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchCache] = useState<Record<string, any[]>>({});
  const [usedCSE, setUsedCSE] = useState(false);
  const [strictFilter, setStrictFilter] = useState(true);

  // Simple cooldown to avoid repeated client clicks
  const [lastSearchAt, setLastSearchAt] = useState<number | null>(null);

  // Helper: parse CSV (very small parser – assumes comma-separated with a header row)
  function parseCsv(text: string): string[][] {
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    if (lines.length === 0) return [];
    const out: string[][] = [];
    // naive split by comma (good enough for simple admin CSVs)
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',').map(c => c.trim());
      if (cols.length === 0) continue;
      out.push(cols);
    }
    return out;
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);
    if (!files || files.length === 0) {
      setError('Please select at least one file');
      return;
    }

    setLoading(true);
    try {
      const form = new FormData();
      for (let i = 0; i < files.length; i++) form.append('documents', files[i]);

      const token = localStorage.getItem('token');
      const base = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000');
      const res = await fetch(`${base}/api/users/admin/upload-dataset`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: form,
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.message || JSON.stringify(json));
      setResult(json);
    } catch (err: any) {
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  }

  // Process CSV client-side (visualization) then upload to server
  async function handleCsvProcess(e?: React.FormEvent) {
    if (e) e.preventDefault();
    setCsvError(null);
    setRows([]);
    setBlocks([]);
    if (!csvFile) {
      setCsvError('Please select a CSV file');
      return;
    }

    setProcessing(true);
    try {
      const text = await csvFile.text();
      const parsed = parseCsv(text);
      if (parsed.length === 0) {
        setCsvError('CSV appears empty or malformed');
        setProcessing(false);
        return;
      }

      // Limit visualization to first 200 rows to keep UI responsive
      const limited = parsed.slice(0, 200);
      const initial: RowItem[] = limited.map((r, i) => ({ id: i + 1, raw: r, status: 'queued' }));
      setRows(initial);

      // Process sequentially to show animation
      for (let i = 0; i < initial.length; i++) {
        setRows(prev => prev.map(p => p.id === initial[i].id ? { ...p, status: 'hashing' } : p));
        // create a canonical string for the row
        const payload = initial[i].raw.join('|');
        let hash = '';
        try {
          hash = await sha256Hex(payload);
          // pause to let UI show hashing
          await new Promise(res => setTimeout(res, 350));
          setRows(prev => prev.map(p => p.id === initial[i].id ? { ...p, status: 'storing', hash } : p));

          // simulate storing into a block (and short delay)
          await new Promise(res => setTimeout(res, 500));
          setBlocks(prev => [{ index: prev.length + 1, hash, timestamp: new Date().toISOString() }, ...prev]);
          setRows(prev => prev.map(p => p.id === initial[i].id ? { ...p, status: 'stored', hash } : p));
        } catch (err: any) {
          setRows(prev => prev.map(p => p.id === initial[i].id ? { ...p, status: 'failed', error: String(err) } : p));
        }
      }

      // after visualization, send the CSV to the backend for actual dataset ingestion
      const form = new FormData();
      form.append('csvFile', csvFile);
      const token = localStorage.getItem('token');
      const base = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000');
      const res = await fetch(`${base}/api/users/admin/upload-csv`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: form,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || JSON.stringify(json));
      // Attach backend result to UI (success info)
      setResult(json);

    } catch (err: any) {
      setCsvError(err.message || String(err));
    } finally {
      setProcessing(false);
    }
  }

  // --- Alumni discovery helpers (client-only fallback) ---
  function simulateDiscover(instituteName: string, year: number, maxResults = 30) {
    const demos = [];
    for (let i = 0; i < Math.min(maxResults, 50); i++) {
      const y = year - Math.floor(Math.random() * 6);
      demos.push({
        id: `client-mock-${instituteName.replace(/\s+/g, '-')}-${i}-${Date.now()}`,
        name: `${instituteName.split(' ')[0] || 'Alum'} Person ${i + 1}`,
        institute: instituteName,
        passingYear: y,
        percentage: (Math.random() * 30 + 60).toFixed(2),
        source: 'client-mock',
        note: 'Client-side simulated discovery (no API)'
      });
    }
    return demos;
  }

  async function discoverAlumni() {
    setCsvError(null);
    setDiscovered([]);
    setSelectedIds({});
    if (!institute) {
      setCsvError('Please enter an institute');
      return;
    }
    const year = Number(passingYear) || new Date().getFullYear();

    // cooldown: 2 seconds
    if (lastSearchAt && Date.now() - lastSearchAt < 2000) return;
    setLastSearchAt(Date.now());

    const cacheKey = `${institute}::${year}`;
    if (searchCache[cacheKey]) {
      setDiscovered(searchCache[cacheKey]);
      return;
    }

    setSearchLoading(true);
    try {
      // Try backend API first if available (useful when deployed)
      try {
        const base = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000');
        const resp = await fetch(`${base}/api/admin/scrape`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ institute, passingYear: year, maxResults: 50 }),
        });
        if (resp.ok) {
          const json = await resp.json();
          const items = (json && json.items && Array.isArray(json.items)) ? json.items : [];
          setRawFetchedItems(items);
          setUsedCSE(!!json.usedCSE);
          // Filter results strictly: institute must match and passing year <= selected year (when inferable)
          const processed = items.map((it: any) => {
            const text = `${it.title || ''} ${it.snippet || ''} ${it.link || ''} ${it.institute || ''}`;
            // extract year
            const yearMatch = text.match(/\b(19|20)\d{2}\b/);
            const inferredYear = yearMatch ? Number(yearMatch[0]) : (it.passingYear ? Number(it.passingYear) : null);
            const instituteMatch = (String(it.institute || it.title || it.snippet || it.link || '')).toLowerCase().includes(institute.toLowerCase());
            return { ...it, inferredYear, instituteMatch };
          });

          const filtered = processed.filter((it: any) => {
            if (strictFilter) {
              // require institute match
              if (!it.instituteMatch) return false;
              // require inferredYear <= year when available; if not available, exclude to be strict
              if (it.inferredYear) return Number(it.inferredYear) <= year;
              return false;
            } else {
              // lenient: accept if institute matches OR inferredYear <= year
              if (it.instituteMatch) return true;
              if (it.inferredYear) return Number(it.inferredYear) <= year;
              return false;
            }
          });

          setDiscovered(processed);
          searchCache[cacheKey] = processed;
          setSearchLoading(false);
          return;
        }
      } catch (err) {
        // ignore and fallback to client-side simulate
        console.error('[discoverAlumni] backend scrape failed, falling back to client simulate', err);
      }

      // Fallback: simulate on client (no APIs required)
      const simulated = simulateDiscover(institute, year, 30);
      setRawFetchedItems(simulated);
      // simulated includes passingYear, filter by year and institute heuristically
      const processedSim = simulated.filter(s => {
        const instMatch = String(s.institute || '').toLowerCase().includes(institute.toLowerCase());
        return instMatch && Number(s.passingYear) <= year;
      });
      setUsedCSE(false);
      setDiscovered(processedSim);
      searchCache[cacheKey] = processedSim;
    } finally {
      setSearchLoading(false);
    }
  }

  // extract year helper (used later for client-side parsing)
  function extractYearFromText(text: string) {
    const m = (text || '').match(/\b(19|20)\d{2}\b/);
    return m ? Number(m[0]) : null;
  }

  function toggleSelect(id: string) {
    setSelectedIds(prev => ({ ...prev, [id]: !prev[id] }));
  }

  // Import a single raw fetched item into the queue (bypass strict filtering)
  async function importSingle(item: any) {
    const baseId = Date.now();
    const r: RowItem = {
      id: baseId,
      raw: [item.name || item.title || 'Unknown', item.institute || institute, String(item.passingYear || item.inferredYear || '')],
      status: 'queued'
    };
    setRows(prev => [...prev, r]);

    // process it
    setRows(prev => prev.map(p => p.id === r.id ? { ...p, status: 'hashing' } : p));
    try {
      const payload = r.raw.join('|');
      const hash = await sha256Hex(payload);
      await new Promise(res => setTimeout(res, 300));
      setRows(prev => prev.map(p => p.id === r.id ? { ...p, status: 'storing', hash } : p));
      await new Promise(res => setTimeout(res, 400));
      setBlocks(prev => [{ index: prev.length + 1, hash, timestamp: new Date().toISOString() }, ...prev]);
      setRows(prev => prev.map(p => p.id === r.id ? { ...p, status: 'stored', hash } : p));
    } catch (err: any) {
      setRows(prev => prev.map(p => p.id === r.id ? { ...p, status: 'failed', error: String(err) } : p));
    }
  }

  function selectAllVisible() {
    const newMap: Record<string, boolean> = {};
    for (const it of discovered) newMap[it.id || it.link || JSON.stringify(it)] = true;
    setSelectedIds(newMap);
  }

  function clearSelection() {
    setSelectedIds({});
  }

  // Import selected items into the processing queue (client-only)
  async function importSelected() {
    const items = discovered.filter(it => selectedIds[it.id || it.link || JSON.stringify(it)]);
    if (items.length === 0) {
      setCsvError('No items selected to import');
      return;
    }

    // Convert to RowItem objects and append to queue
    const baseId = Date.now();
    const newRows: RowItem[] = items.map((it: any, idx: number) => ({
      id: baseId + idx,
      raw: [it.name || it.title || 'Unknown', it.institute || institute, String(it.passingYear || passingYear || ''), String(it.percentage || '')],
      status: 'queued'
    }));

    setRows(prev => [...prev, ...newRows]);

    // Process the newly appended rows sequentially
    for (const r of newRows) {
      setRows(prev => prev.map(p => p.id === r.id ? { ...p, status: 'hashing' } : p));
      const payload = r.raw.join('|');
      try {
        const hash = await sha256Hex(payload);
        await new Promise(res => setTimeout(res, 300));
        setRows(prev => prev.map(p => p.id === r.id ? { ...p, status: 'storing', hash } : p));
        await new Promise(res => setTimeout(res, 400));
        setBlocks(prev => [{ index: prev.length + 1, hash, timestamp: new Date().toISOString() }, ...prev]);
        setRows(prev => prev.map(p => p.id === r.id ? { ...p, status: 'stored', hash } : p));
      } catch (err: any) {
        setRows(prev => prev.map(p => p.id === r.id ? { ...p, status: 'failed', error: String(err) } : p));
      }
    }

    // after import, clear selection
    setSelectedIds({});
  }

  // download CSV: if usedCSE true, ask backend for CSV; otherwise generate client CSV
  async function downloadCsv() {
    if (discovered.length === 0) {
      setCsvError('No discovered items to download');
      return;
    }

    const filename = `alumni_${institute.replace(/\s+/g,'_')}_${passingYear || 'all'}.csv`;
    if (usedCSE) {
      // call backend with download flag
      try {
        const base = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000');
        const resp = await fetch(`${base}/api/admin/scrape?download=true`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ institute, passingYear, maxResults: 500 })
        });
        if (!resp.ok) throw new Error('Failed to download CSV from server');
        const blob = await resp.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      } catch (err: any) {
        setCsvError(err.message || String(err));
      }
    } else {
      // client CSV generation (only name,institute,percentage)
      const headers = ['name','institute','percentage'];
      const escapeCell = (v: any) => {
        if (v === undefined || v === null) return '';
        const s = String(v);
        if (s.includes(',') || s.includes('\n') || s.includes('"')) return '"' + s.replace(/"/g,'""') + '"';
        return s;
      };
      const rows = discovered.map(d => {
        const name = d.name || d.title || '';
        const inst = d.institute || '';
        let percent = d.percentage || '';
        if (!percent) {
          const text = `${d.snippet || ''} ${d.title || ''}`;
          const m = text.match(/(\d{1,3}(?:\.\d+)?)(?:\s?%|\s?(?:percent|percentage))/i);
          if (m && m[1]) percent = m[1] + '%';
        }
        return [escapeCell(name), escapeCell(inst), escapeCell(percent)].join(',');
      });
      const csv = headers.join(',') + '\n' + rows.join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    }
  }

  // Small helpers for display
  const statusColor = (s: RowItem['status']) => {
    switch (s) {
      case 'queued': return 'text-gray-500';
      case 'hashing': return 'text-yellow-600';
      case 'storing': return 'text-indigo-600';
      case 'stored': return 'text-green-600';
      case 'failed': return 'text-red-600';
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Admin Dashboard — Dataset Uploader</h1>
        <div className="text-sm text-gray-500">Secure upload · audit-ready hashes · simulated chain visualization</div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: file uploads */}
        <div className="col-span-2 space-y-6">
          <section className="p-6 bg-white/60 backdrop-blur rounded-lg shadow-md border">
            <h2 className="text-lg font-semibold mb-2">Upload Documents (Store Hashes)</h2>
            <p className="text-sm text-gray-600 mb-4">Upload PDF / images / docs. Server will extract & store hash entries.</p>
            <form onSubmit={handleUpload} className="flex flex-col gap-3">
              <label className="flex items-center gap-3">
                <input
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  onChange={(e) => setFiles(e.target.files)}
                  className="block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-blue-600 file:text-white"
                />
              </label>
              <div className="flex gap-3">
                <button
                  className="px-4 py-2 bg-blue-600 text-white rounded shadow hover:brightness-95 disabled:opacity-60"
                  disabled={loading}
                  type="submit"
                >
                  {loading ? 'Uploading...' : 'Upload & Store Hashes'}
                </button>
                <button
                  type="button"
                  onClick={() => { setFiles(null); setResult(null); setError(null); }}
                  className="px-4 py-2 border rounded"
                >
                  Reset
                </button>
              </div>

              {error && <div className="text-red-600 mt-2">{error}</div>}
              {result && <div className="mt-3 text-sm text-gray-700"><strong>Server response:</strong> <pre className="whitespace-pre-wrap bg-gray-50 p-2 rounded">{JSON.stringify(result, null, 2)}</pre></div>}
            </form>
          </section>

          <section className="p-6 bg-white/60 backdrop-blur rounded-lg shadow-md border">
            <h2 className="text-lg font-semibold mb-2">Upload CSV of Past Students</h2>
            <p className="text-sm text-gray-600">CSV must have header columns: name,institute,percentage (case-insensitive). The UI will animate converting each row into a SHA-256 hash and simulate storing it into a blockchain block.</p>

            <form onSubmit={handleCsvProcess} className="mt-4 flex gap-3 items-center">
              <input
                type="file"
                accept=".csv"
                onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                className="text-sm text-gray-700"
              />
              <button className="px-3 py-2 bg-green-600 text-white rounded shadow" disabled={processing} type="submit">{processing ? 'Processing...' : 'Process & Upload CSV'}</button>
              <button type="button" onClick={() => { setCsvFile(null); setCsvError(null); setRows([]); setBlocks([]); setResult(null); }} className="px-3 py-2 border rounded">Clear</button>
            </form>

            {csvError && <div className="text-red-600 mt-3">{csvError}</div>}

            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h3 className="font-semibold">Processing Queue</h3>
                <div className="max-h-64 overflow-auto rounded border bg-white/40 p-2">
                  {rows.length === 0 && <div className="text-sm text-gray-500">No CSV rows visualized yet.</div>}
                  {rows.map(r => (
                    <div key={r.id} className="flex items-center justify-between gap-3 p-2 border-b last:border-b-0">
                      <div className="flex-1">
                        <div className="text-sm font-medium">Row #{r.id}</div>
                        <div className="text-xs text-gray-600 truncate">{r.raw.join(' • ')}</div>
                      </div>
                      <div className="w-48 text-right">
                        <div className={`inline-block px-2 py-1 rounded text-xs font-medium ${statusColor(r.status)}`}>{r.status.toUpperCase()}</div>
                        {r.hash && <div className="text-xs text-gray-500 mt-1 break-all">{r.hash.slice(0, 14)}...</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-semibold">Simulated Blockchain (Latest first)</h3>
                <div className="max-h-64 overflow-auto rounded border bg-white/40 p-3">
                  {blocks.length === 0 && <div className="text-sm text-gray-500">No blocks yet — processed hashes will appear here.</div>}
                  <div className="space-y-3">
                    {blocks.map(b => (
                      <div key={b.index} className="p-3 bg-gradient-to-r from-slate-50/60 to-white/30 border rounded shadow-sm">
                        <div className="flex items-center justify-between">
                          <div className="text-sm font-medium">Block #{b.index}</div>
                          <div className="text-xs text-gray-500">{new Date(b.timestamp).toLocaleString()}</div>
                        </div>
                        <div className="mt-2 text-xs font-mono break-all text-slate-700">{b.hash}</div>
                        <div className="mt-2 text-right text-xs text-green-600">Stored</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

  {/* Right column: status, discovery UI and help */}
        <aside className="space-y-6">
          <div className="p-4 rounded-lg bg-gradient-to-br from-white/40 to-slate-50/30 border shadow-sm">
            <h3 className="font-semibold">Alumni Discovery</h3>
            <p className="text-sm text-gray-600 mt-2">Discover public alumni entries by institute and passing year. Uses backend search if available, otherwise falls back to a client-side mock for offline/demo use.</p>

            <div className="mt-3 space-y-2">
              <label className="text-xs text-gray-600">Institute</label>
              <input value={institute} onChange={(e) => setInstitute(e.target.value)} className="w-full px-2 py-1 rounded border text-sm" />

              <label className="text-xs text-gray-600">Passing year (selects year and below)</label>
              <input value={passingYear as any} onChange={(e) => setPassingYear(e.target.value ? Number(e.target.value) : '')} type="number" className="w-full px-2 py-1 rounded border text-sm" />

              <div className="flex gap-2 mt-2">
                <button onClick={discoverAlumni} disabled={searchLoading} className="flex-1 px-3 py-2 bg-blue-600 text-white rounded text-sm">{searchLoading ? 'Searching...' : 'Discover'}</button>
                <button onClick={() => { setDiscovered([]); setSelectedIds({}); setRawFetchedItems(null); }} className="px-3 py-2 border rounded text-sm">Clear</button>
              </div>
              <div className="mt-2 flex items-center gap-3 text-sm">
                <label className="flex items-center gap-2"><input type="checkbox" checked={strictFilter} onChange={() => setStrictFilter(s => !s)} /> Strict filter (require institute + year)</label>
                <div className="ml-auto text-xs text-gray-500">CSE in use: <strong className="ml-1">{usedCSE ? 'Yes' : 'No (simulated)'}</strong></div>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-white/60 border shadow-sm">
            <h3 className="font-semibold">Discovered Candidates</h3>
            <div className="mt-3 text-sm text-gray-600">Select entries to import into the processing queue. Use the debug panel to view raw server results.</div>
            <div className="mt-3 flex gap-2">
              <button onClick={selectAllVisible} className="px-2 py-1 border rounded text-sm">Select All</button>
              <button onClick={clearSelection} className="px-2 py-1 border rounded text-sm">Clear</button>
              <button onClick={importSelected} className="ml-auto px-2 py-1 bg-green-600 text-white rounded text-sm">Import Selected</button>
            </div>

            <div className="mt-3 max-h-64 overflow-auto border rounded p-2 bg-white/40">
              {discovered.length === 0 && <div className="text-sm text-gray-500">No candidates discovered yet.</div>}
              {discovered.map((d) => {
                const id = d.id || d.link || JSON.stringify(d);
                return (
                  <div key={id} className="flex items-start gap-2 p-2 border-b last:border-b-0">
                    <input type="checkbox" checked={!!selectedIds[id]} onChange={() => toggleSelect(id)} className="mt-1" />
                    <div className="flex-1">
                      <div className="text-sm font-medium">{d.name || d.title || d.source || 'Unknown'}</div>
                      <div className="text-xs text-gray-600">{d.institute || d.displayLink || d.source} • {d.passingYear || ''} • {d.percentage ? `${d.percentage}%` : ''}</div>
                      {d.snippet && <div className="text-xs text-gray-500 mt-1">{d.snippet}</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Debug panel: show raw fetched items from server*/}
          <div className="p-4 rounded-lg bg-white/60 border shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Debug / Raw Results</h3>
              <button onClick={() => setRawFetchedItems(null)} className="text-xs px-2 py-1 border rounded">Clear</button>
            </div>
            <div className="mt-3 text-xs text-gray-700 max-h-48 overflow-auto">
              {rawFetchedItems === null && <div className="text-sm text-gray-500">No raw data fetched yet. Run Discover to populate.</div>}
              {rawFetchedItems && rawFetchedItems.length === 0 && <div className="text-sm text-gray-500">Server returned zero raw items.</div>}
              {rawFetchedItems && rawFetchedItems.map((r,i) => (
                <div key={i} className="mb-2 p-2 border rounded bg-white/20">
                  <div className="font-medium">{r.title || r.name || r.link || r.displayLink || `item-${i}`}</div>
                  <div className="text-xs text-gray-600">{r.link || r.displayLink}</div>
                  {r.snippet && <div className="text-xs text-gray-500 mt-1">{r.snippet}</div>}
                  <pre className="text-xs mt-1 overflow-auto">{JSON.stringify(r, null, 2)}</pre>
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 rounded-lg bg-white/60 border shadow-sm">
            <h3 className="font-semibold">Visualization Controls</h3>
            <p className="text-sm text-gray-600 mt-2">The visualization demonstrates how each CSV row is transformed into a cryptographic hash and appended as a block. This is a client-side simulation for audit & UX purposes; the server persists authoritative records.</p>
            <div className="mt-3 flex flex-col gap-2">
              <button onClick={() => { setRows([]); setBlocks([]); setCsvFile(null); setCsvError(null); }} className="px-3 py-2 border rounded text-sm">Clear Visualization</button>
              <button onClick={() => alert('This demo shows how hashes are generated and stored.')} className="px-3 py-2 bg-indigo-600 text-white rounded text-sm">About Chain Simulation</button>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-white/60 border shadow-sm">
            <h3 className="font-semibold">Result / Logs</h3>
            <div className="mt-2 text-xs text-gray-700 max-h-48 overflow-auto">
              {result ? <pre className="whitespace-pre-wrap">{JSON.stringify(result, null, 2)}</pre> : <div className="text-sm text-gray-500">Server logs & responses will appear here after uploads.</div>}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
