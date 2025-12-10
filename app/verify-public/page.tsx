// @ts-nocheck
"use client";

import React, { useState } from 'react';
import { ethers } from 'ethers';
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { useToast } from '../../components/ui/use-toast'
import { Toaster } from '../../components/ui/toaster'
import Threads from '../../components/Threads'
import { 
  GraduationCap, 
  Mail, 
  Wallet, 
  FileText, 
  User, 
  Building, 
  Percent, 
  Shield, 
  Upload,
  CheckCircle,
  AlertCircle,
  Loader2,
  ArrowLeft
} from 'lucide-react'

export default function PublicVerifyPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [email, setEmail] = useState('');
  const [wallet, setWallet] = useState('');
  const [file, setFile] = useState(null);
  const [name, setName] = useState('');
  const [institute, setInstitute] = useState('');
  const [percentage, setPercentage] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [result, setResult] = useState(null);

  async function connectWallet() {
    try {
      if (!(window).ethereum) throw new Error('No wallet provider found');
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      await provider.send('eth_requestAccounts', []);
      const signer = provider.getSigner();
      const address = await signer.getAddress();
      setWallet(address);
      
      // Show success toast for wallet connection
      toast({
        title: "🔗 Wallet Connected",
        description: `Successfully connected to ${address.slice(0, 8)}...${address.slice(-6)}`,
        variant: "default",
        duration: 3000,
      });
    } catch (err) {
      const errorMessage = err.message || String(err);
      setMessage(errorMessage);
      
      // Show error toast for wallet connection failure
      toast({
        title: "❌ Wallet Connection Failed",
        description: errorMessage,
        variant: "destructive",
        duration: 4000,
      });
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage(null);
    
    if (!email) {
      toast({
        title: "❌ Email Required",
        description: "Please enter your email address to proceed.",
        variant: "destructive",
        duration: 3000,
      });
      return setMessage('Email required');
    }
    
    if (!file) {
      toast({
        title: "❌ Document Required",
        description: "Please upload your academic document to proceed with verification.",
        variant: "destructive",
        duration: 3000,
      });
      return setMessage('Please attach your document');
    }

    setLoading(true);
    try {
      const form = new FormData();
      form.append('documentFile', file);
      form.append('email', email);
      if (wallet) form.append('walletAddress', wallet);
      if (name) form.append('name', name);
      if (institute) form.append('institute', institute);
      if (percentage) form.append('percentage', percentage);

      const base = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000');
      const res = await fetch(`${base}/api/users/public/verify-request`, {
        method: 'POST',
        body: form,
      });
      const json = await res.json();
      setResult(json);
      if (!res.ok) throw new Error(json.message || JSON.stringify(json));
      
      if (json.verified) {
        // Show success toast for verified document
        toast({
          title: "✅ Verification Successful!",
          description: "Your document has been verified successfully. You can now login to your account.",
          variant: "default",
          duration: 5000,
        });
        
        // Redirect to login after a short delay to show the toast
        setTimeout(() => {
          router.push('/auth/login');
        }, 2000);
      } else {
        // Show info toast for unverified document
        toast({
          title: "🔍 Document Not Verified",
          description: "Your document was not found in our admin dataset. Administrators have been notified for manual review.",
          variant: "destructive",
          duration: 6000,
        });
        setMessage('Document not found in admin dataset. Admins have been notified for manual review.');
      }
    } catch (err) {
      const errorMessage = err.message || String(err);
      setMessage(errorMessage);
      
      // Show error toast for submission failure
      toast({
        title: "❌ Verification Failed",
        description: errorMessage,
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 relative overflow-hidden">
      {/* Threads Background */}
      <div className="fixed inset-0 z-0 opacity-100 pointer-events-none">
     
        {/* Floating blobs */}
        <div className="blob-soft bg-[#2546d3] left-10 top-20 w-[420px] h-[420px]" />
        <div className="blob-soft bg-[#1b3bb8] right-16 bottom-8 w-[320px] h-[320px]" />
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-4xl">
          {/* Header */}
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <GraduationCap className="h-6 w-6 text-white" />
              </div>
              <span className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                GradNet
              </span>
            </Link>
            
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Alumni Verification Portal
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Submit your documents for verification and join the blockchain-powered alumni network.
              Our AI will extract information automatically to speed up the process.
            </p>
          </div>

          {/* Main Card */}
          <Card className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border border-white/20 dark:border-gray-700/50 shadow-2xl rounded-3xl overflow-hidden">
            <CardHeader className="text-center pb-6">
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2 flex items-center justify-center gap-2">
                <Shield className="h-6 w-6 text-blue-600" />
                Document Verification
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-300">
                Upload your academic documents for secure blockchain verification
              </CardDescription>
            </CardHeader>
            
            <CardContent className="px-8 pb-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Email Field */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Email Address
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email address"
                      className="pl-12 h-12 bg-white/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Wallet Connection */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Blockchain Wallet (Optional)
                  </Label>
                  <div className="flex flex-col gap-3">
                    <Button
                      type="button"
                      onClick={connectWallet}
                      variant={wallet ? "default" : "outline"}
                      className={wallet 
                        ? "h-12 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg"
                        : "h-12 rounded-xl border-gray-200 dark:border-gray-600 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 dark:hover:from-blue-900/20 dark:hover:to-purple-900/20 transition-all duration-200"
                      }
                    >
                      <Wallet className="h-5 w-5 mr-2" />
                      {wallet ? `Connected: ${wallet.slice(0, 8)}...${wallet.slice(-6)}` : 'Connect Wallet'}
                    </Button>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      <Shield className="h-4 w-4 inline mr-1" />
                      Required for automatic SBT (Soul Bound Token) minting upon verification
                    </p>
                  </div>
                </div>
                {/* Document Upload */}
                <div className="space-y-2">
                  <Label htmlFor="document" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Academic Document
                  </Label>
                  <div className="relative">
                    <div className="flex items-center h-12 bg-white/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-600 rounded-xl overflow-hidden transition-all duration-200 hover:border-blue-400">
                      <label
                        htmlFor="document"
                        className="cursor-pointer bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 h-full flex items-center hover:from-blue-700 hover:to-purple-700 transition-all duration-200"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Choose File
                      </label>
                      <div className="w-px h-6 bg-gray-300 dark:bg-gray-600"></div>
                      <span className="pl-4 text-gray-600 dark:text-gray-400 text-sm truncate flex-1">
                        {file ? file.name : "No file chosen"}
                      </span>
                    </div>
                    <input
                      id="document"
                      type="file"
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      className="hidden"
                      onChange={async (e) => {
                        const f = e.target.files ? e.target.files[0] : null;
                        setFile(f);
                        if (!f) return;
                        // immediately call extract-fields to prefill form
                        try {
                          const fd = new FormData();
                          fd.append('marksheet', f);
                          const base = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000');
                          const r = await fetch(`${base}/api/users/extract-fields`, { method: 'POST', body: fd });
                          const j = await r.json();
                          if (j && j.extracted) {
                            setName(j.extracted.name || '');
                            setInstitute(j.extracted.institute || '');
                            setPercentage(j.extracted.percentage || '');
                            setResult(j);
                            if (j.diagnostic && (!j.extracted.name && !j.extracted.institute && !j.extracted.percentage)) {
                              setMessage(j.message || 'Could not extract fields. See diagnostics below.');
                            }
                          }
                        } catch (err) {
                          console.error('Auto-extract failed', err);
                        }
                      }}
                    />
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    <FileText className="h-4 w-4 inline mr-1" />
                    Supported formats: PDF, DOC, DOCX, JPG, PNG (AI will auto-extract information)
                  </p>
                </div>

                {/* Auto-extracted Information */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      AI-Extracted Information (Optional - Auto-filled from document)
                    </Label>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Full Name
                      </Label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <Input
                          id="name"
                          type="text"
                          placeholder="Auto-extracted name"
                          className="pl-12 h-12 bg-white/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="institute" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Institute
                      </Label>
                      <div className="relative">
                        <Building className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <Input
                          id="institute"
                          type="text"
                          placeholder="Auto-extracted institute"
                          className="pl-12 h-12 bg-white/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                          value={institute}
                          onChange={(e) => setInstitute(e.target.value)}
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="percentage" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Grade/Percentage
                      </Label>
                      <div className="relative">
                        <Percent className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <Input
                          id="percentage"
                          type="text"
                          placeholder="Auto-extracted grade"
                          className="pl-12 h-12 bg-white/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                          value={percentage}
                          onChange={(e) => setPercentage(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="pt-4">
                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Processing Verification...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        Submit for Blockchain Verification
                      </div>
                    )}
                  </Button>
                </div>

                {/* Back to Login Link */}
                <div className="text-center pt-4">
                  <Link 
                    href="/auth/login" 
                    className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Login
                  </Link>
                </div>
              </form>

            </CardContent>
          </Card>

          {/* Message Display */}
          {message && (
            <Card className="mt-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 backdrop-blur-xl rounded-2xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                  <p className="text-sm text-red-600 dark:text-red-400">{message}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Result Display */}
          {result && (
            <Card className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 backdrop-blur-xl rounded-2xl">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-blue-900 dark:text-blue-100 flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Verification Result
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-blue-100 dark:border-blue-800">
                  <pre className="text-xs font-mono text-gray-700 dark:text-gray-300 whitespace-pre-wrap overflow-x-auto">
                    {JSON.stringify(result, null, 2)}
                  </pre>
                </div>
                
                {result.diagnostic && (
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      AI Extraction Diagnostics
                    </h4>
                    <pre className="text-xs font-mono text-gray-600 dark:text-gray-400 whitespace-pre-wrap overflow-x-auto">
                      {JSON.stringify(result.diagnostic, null, 2)}
                    </pre>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
      <Toaster />
    </div>
  );
}
