"use client";

import React, { useState } from 'react';
import { ethers } from 'ethers';

export default function VerifyAlumniPage() {
  const [file, setFile] = useState<File | null>(null);
  const [wallet, setWallet] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  async function connectWallet() {
    setError(null);
    try {
      if (!(window as any).ethereum) throw new Error('No wallet provider found (install MetaMask)');
      // ethers v5: use Web3Provider
      // @ts-ignore - window.ethereum injected by wallet
      const provider = new ethers.providers.Web3Provider((window as any).ethereum);
      // Request accounts
      await provider.send('eth_requestAccounts', []);
      const signer = provider.getSigner();
      const address = await signer.getAddress();
      setWallet(address);
    } catch (err: any) {
      setError(err.message || String(err));
    }
  }

  async function handleSaveWallet() {
    setError(null);
    if (!wallet) {
      setError('Please connect your wallet first');
      return;
    }
    try {
      const base = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000');
      const token = localStorage.getItem('token')
      const res = await fetch(`${base}/api/users/set-wallet`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ walletAddress: wallet }),
      })
      if (!res.ok) {
        const j = await res.json()
        throw new Error(j.message || 'Failed to save wallet')
      }
      alert('Wallet saved. Admin will use this address for verification')
    } catch (e: any) {
      setError(e.message || String(e))
    }
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Alumni Document Verification</h1>

      <div className="mb-4">
        <button onClick={connectWallet} className="px-4 py-2 bg-green-600 text-white rounded">
          {wallet ? `Connected: ${wallet}` : 'Connect Wallet'}
        </button>
        <button onClick={handleSaveWallet} className="ml-3 px-4 py-2 bg-blue-600 text-white rounded">Save Wallet</button>
      </div>

      {error && <div className="mt-4 text-red-600">{error}</div>}
      {result && (
        <div className="mt-4">
          <pre className="whitespace-pre-wrap">{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
