// @ts-nocheck
"use client";

import React, { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/users';
const ROLES = ['student','alumni','employer','admin'];

export default function AdminUsersPage(){
  const { user, loading } = useAuth();
  const [role, setRole] = useState('alumni');
  const [users, setUsers] = useState([]);
  const [busy, setBusy] = useState(false);
  const authToken = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  useEffect(()=>{
    if(!loading && user && user.role === 'admin') fetchUsers(role);
  },[loading, user, role]);

  async function fetchUsers(roleName){
    setBusy(true);
    try{
      const res = await fetch(`${API_BASE}/admin/users?role=${roleName}`, { headers: { Authorization: `Bearer ${authToken}` } });
      if(!res.ok) throw new Error('Fetch failed');
      const data = await res.json();
      setUsers(data.items || []);
    }catch(e){
      console.error(e);
    }finally{ setBusy(false); }
  }

  if(loading) return <p>Loading...</p>;
  if(!user || user.role !== 'admin') return <p>Access denied (admin only)</p>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Admin - Users by Role</h1>
      <div className="mb-4 flex items-center justify-between">
        {ROLES.map(r=> (
          <button key={r} className={`mr-2 p-2 border ${r===role? 'bg-slate-200':''}`} onClick={()=>setRole(r)}>{r}</button>
        ))}
        <div>
          <button onClick={()=> window.location.href = '/dashboard/admin-upload'} className="ml-2 px-3 py-2 bg-indigo-600 text-white rounded">Upload Dataset</button>
        </div>
      </div>

      <div>
        <h2 className="text-xl mb-2">{role} ({users.length})</h2>
        {busy && <p>Loading...</p>}
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="border p-2">Name</th>
              <th className="border p-2">Email</th>
              <th className="border p-2">Wallet</th>
              <th className="border p-2">Verified</th>
              <th className="border p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u=> (
              <tr key={u._id}>
                <td className="border p-2">{u.firstName} {u.lastName}</td>
                <td className="border p-2">{u.email}</td>
                <td className="border p-2">{u.walletAddress || '-'}</td>
                <td className="border p-2">{u.isVerified? 'Yes':'No'}</td>
                <td className="border p-2">
                  {/* Action: quick verify by using stored user.documentHash */}
                  <button onClick={async ()=>{
                    let walletToUse = u.walletAddress;
                    if(!walletToUse) {
                      walletToUse = window.prompt(`No wallet saved for ${u.email}. Enter wallet address to mint SBT:`) || '';
                      if(!walletToUse) return; // cancelled
                    }
                    const confirm = window.confirm(`Verify ${u.email}? This will attempt to mint SBT if document hash exists on-chain/local. Wallet: ${walletToUse}`);
                    if(!confirm) return;
                    try{
                      const body = JSON.stringify({ walletAddress: walletToUse, docHash: u.documentHash });
                      const res = await fetch(`${API_BASE}/admin/verify-user`, { method: 'POST', headers: { Authorization: `Bearer ${authToken}`, 'Content-Type': 'application/json' }, body });
                      const data = await res.json();
                      if(!res.ok) throw new Error(data.message||'Verify failed');
                      alert('Verify successful');
                      // refresh users
                      fetchUsers(role);
                    }catch(e){ console.error(e); alert('Verify failed: '+(e.message||String(e))); }
                  }}>Verify</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
