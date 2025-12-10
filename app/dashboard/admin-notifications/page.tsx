// @ts-nocheck
"use client";

import React, { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/users';

export default function AdminNotificationsPage() {
  const { user, loading } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(25);
  const [total, setTotal] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [walletAddress, setWalletAddress] = useState('');
  const [adminDocumentId, setAdminDocumentId] = useState('');
  const [adminDocuments, setAdminDocuments] = useState([]);

  useEffect(() => {
    if (!loading && user && user.role === 'admin') {
      fetchNotifications();
      fetchAdminDocuments();
    }
  }, [loading, user, page]);

  const authToken = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  async function fetchNotifications() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/notifications?page=${page}&limit=${limit}` , {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setNotifications(data.items || []);
      setTotal(data.total || 0);
    } catch (err) {
      console.error(err);
      setError(err.message || String(err));
    } finally {
      setBusy(false);
    }
  }

  async function markRead(id) {
    try {
      const res = await fetch(`${API_BASE}/notifications/${id}/read`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${authToken}` }
      });
      if (!res.ok) throw new Error('Failed to mark read');
      const data = await res.json();
      setNotifications((prev) => prev.map(n => n._id === id ? data.notification : n));
    } catch (err) {
      console.error(err);
      setError('Mark read failed');
    }
  }

  async function fetchAdminDocuments() {
    try {
      const res = await fetch(`${API_BASE}/admin-documents?page=1&limit=100`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      if (!res.ok) throw new Error('Failed to fetch admin documents');
      const data = await res.json();
      setAdminDocuments(data.items || []);
    } catch (err) {
      console.error('admin docs fetch err', err);
    }
  }

  async function adminVerify(e) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const form = new FormData();
      if (selectedFile) form.append('documentFile', selectedFile);
      if (adminDocumentId) form.append('adminDocumentId', adminDocumentId);
      if (walletAddress) form.append('walletAddress', walletAddress);

      const res = await fetch(`${API_BASE}/admin/verify-user`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${authToken}` },
        body: form
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Verify failed');

      // refresh notifications
      fetchNotifications();
      alert('Verify succeeded');
    } catch (err) {
      console.error(err);
      setError(err.message || String(err));
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <p>Loading...</p>;
  if (!user || user.role !== 'admin') return <p>Access denied (admin only)</p>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Admin Notifications</h1>

      <form onSubmit={adminVerify} className="mb-6 border p-4 rounded">
        <h2 className="font-semibold">Manual Verify / Mint</h2>
        <p className="text-sm text-muted-foreground">Provide either an Admin Document ID or upload a document, and a walletAddress to mint.</p>
        <div className="mt-2">
          <label className="block">AdminDocument (optional)</label>
          <select value={adminDocumentId} onChange={e=>setAdminDocumentId(e.target.value)} className="border p-2 w-full">
            <option value="">-- select from uploaded dataset --</option>
            {adminDocuments.map(doc => (
              <option key={doc._id} value={doc._id}>{doc.originalName || doc.filename} — {doc.hash}</option>
            ))}
          </select>
        </div>
        <div className="mt-2">
          <label className="block">Or upload document</label>
          <input type="file" onChange={e=>setSelectedFile(e.target.files?.[0]||null)} />
        </div>
        <div className="mt-2">
          <label className="block">Wallet Address (required)</label>
          <input value={walletAddress} onChange={e=>setWalletAddress(e.target.value)} className="border p-2 w-full" />
        </div>
        <div className="mt-3">
          <button className="btn btn-primary" disabled={busy}>Verify & Mint</button>
        </div>
        {error && <p className="text-red-600 mt-2">{error}</p>}
      </form>

      <div>
        <h2 className="text-xl font-semibold mb-2">Notifications ({total})</h2>
        {busy && <p>Working...</p>}
        {notifications.length === 0 && <p>No notifications</p>}
        <ul>
          {notifications.map((n) => (
            <li key={n._id} className="mb-3 border p-3 rounded">
              <div className="flex justify-between">
                <div>
                  <div className="font-semibold">{n.type}</div>
                  <div className="text-sm">{n.message}</div>
                  {n.payload && <pre className="text-xs mt-2">{JSON.stringify(n.payload, null, 2)}</pre>}
                </div>
                <div className="text-right">
                  <div className="text-sm text-muted-foreground">{new Date(n.createdAt).toLocaleString()}</div>
                  {!n.read && <button className="ml-2 btn" onClick={()=>markRead(n._id)}>Mark read</button>}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

    </div>
  );
}
