"use client"

import React, { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/app/hooks/useAuth'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { ethers } from 'ethers'

export default function DonatePage() {
  const { user } = useAuth() as any
  const router = useRouter()
  const params = useParams()
  const id = params?.id

  const [campaign, setCampaign] = useState<any>(null)
  const [amountINR, setAmountINR] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(()=>{
    if (!id) return
    fetchCampaign()
  }, [id])

  const fetchCampaign = async () => {
    try {
      const res = await fetch(`http://localhost:4000/api/campaigns/${id}`)
      if (!res.ok) return
      const json = await res.json()
      setCampaign(json.campaign)
    } catch (e) {
      console.error('Failed to load campaign', e)
    }
  }

  const getRuntimePaymentConfig = async () => {
    // prefer public env, fallback to runtime config endpoint
    const envAddr = typeof process !== 'undefined' ? (process.env.NEXT_PUBLIC_PAYMENT_ADDRESS || '') : ''
    const envInr = typeof process !== 'undefined' ? (process.env.NEXT_PUBLIC_INR_PER_ETH || '') : ''
    let paymentAddress = envAddr || ''
    let inrPerEth = Number(envInr) || 0
    if (!paymentAddress || !inrPerEth) {
      try {
        const res = await fetch('http://localhost:4000/api/config/payment')
        if (res.ok) {
          const json = await res.json()
          paymentAddress = paymentAddress || json.paymentAddress || ''
          inrPerEth = inrPerEth || Number(json.inrPerEth || json.inrPerEth || json.inrPerEth) || inrPerEth
        }
      } catch (e) {
        console.warn('Failed to fetch runtime payment config', e)
      }
    }
    return { paymentAddress, inrPerEth }
  }

  const sanitizeDecimal = (n: number) => {
    // ensure decimal string without exponent
    return n.toLocaleString('fullwide', { useGrouping: false, maximumFractionDigits: 18 })
  }

  const handlePay = async () => {
    if (!user || !user._id) return toast.error('You must be logged in as alumni to donate')
    if (!amountINR || Number(amountINR) <= 0) return toast.error('Enter donation amount')
    if (!id) return toast.error('Missing campaign id')

    setLoading(true)
    try {
      const { paymentAddress, inrPerEth } = await getRuntimePaymentConfig()
      if (!paymentAddress) {
        toast.error('Payment address not configured')
        setLoading(false)
        return
      }
      const inrPer = inrPerEth || 100000 // fallback if not configured
      if (!inrPer || Number(inrPer) <= 0) {
        toast.error('INR per ETH conversion not configured')
        setLoading(false)
        return
      }

      if (!window.ethereum) {
        toast.error('MetaMask not available')
        setLoading(false)
        return
      }

      const provider = new ethers.providers.Web3Provider(window.ethereum as any)
      await provider.send('eth_requestAccounts', [])
      const signer = provider.getSigner()

      const inr = Number(amountINR)
      const ethAmount = inr / Number(inrPer)
      const ethStr = sanitizeDecimal(ethAmount)
      const value = ethers.utils.parseUnits(ethStr, 'ether')

      const txResponse = await signer.sendTransaction({ to: paymentAddress, value })
      toast('Transaction sent, waiting for confirmation...')
      const receipt = await txResponse.wait()
      if (!receipt || receipt.status !== 1) {
        toast.error('Transaction failed')
        setLoading(false)
        return
      }

      const txHash = receipt.transactionHash

      // Notify backend
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
      const res = await fetch(`http://localhost:4000/api/campaigns/donate/${id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ userId: user._id, amount: Number(amountINR), txHash })
      })

      if (!res.ok) {
        const ct = res.headers.get('content-type') || ''
        let msg = 'Failed to record donation'
        try {
          if (ct.includes('application/json')) {
            const j = await res.json(); msg = j.message || msg
          } else {
            const t = await res.text(); msg = t || msg
          }
        } catch (e) {}
        toast.error(msg)
        setLoading(false)
        return
      }

      toast.success('Donation recorded — thank you!')
      router.push('/dashboard/college-fund')
    } catch (e:any) {
      console.error('Donation error', e)
      toast.error(e?.message || 'Donation failed')
    } finally {
      setLoading(false)
    }
  }

  if (!user || user.role !== 'alumni') return <div className="p-6">Access denied</div>

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h2 className="text-2xl font-semibold mb-4">Donate to Campaign</h2>
      {campaign && (
        <Card>
          <CardContent>
            <h3 className="font-semibold">{campaign.title}</h3>
            <p className="text-sm text-gray-600 mb-4">{campaign.universityName || 'General'}</p>
            <div className="space-y-3">
              <Input placeholder="Amount (INR)" value={amountINR} onChange={(e:any)=> setAmountINR(e.target.value)} />
              <div className="flex gap-2">
                <Button onClick={handlePay} disabled={loading}>{loading ? 'Processing...' : 'Pay with MetaMask'}</Button>
                <Button variant="outline" onClick={()=> router.back()}>Cancel</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      {!campaign && <div>Loading campaign...</div>}
    </div>
  )
}
