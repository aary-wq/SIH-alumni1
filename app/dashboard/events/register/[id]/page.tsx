'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../../../hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { toast } from 'sonner'
import { ethers } from 'ethers'

export default function EventRegisterPage({ params }: any) {
  // Next.js may pass `params` as a Promise-like. Resolve safely in the client.
  const [resolvedId, setResolvedId] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    const resolveParams = async () => {
      try {
        const p = params
        const maybe = (p && typeof (p as any).then === 'function') ? await p : p
        const rid = maybe?.id || null
        if (mounted) setResolvedId(rid)
      } catch (e) {
        if (mounted) setResolvedId(null)
      }
    }
    resolveParams()
    return () => { mounted = false }
  }, [params])
  const router = useRouter()
  const { user } = useAuth() as any
  const [event, setEvent] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [paying, setPaying] = useState(false)
  const [alreadyRegistered, setAlreadyRegistered] = useState(false)

  useEffect(() => {
    const fetchEvent = async () => {
      if (!resolvedId) return
      try {
        const token = localStorage.getItem('token')
        const res = await fetch(`http://localhost:4000/api/events/${resolvedId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        })
        if (!res.ok) throw new Error('Failed to fetch')
        const json = await res.json()
        // Normalize fee to number
        if (json && json.event) {
          json.event.fee = Number(json.event.fee || 0)
          // detect if current user already registered
          const already = json.event.registeredUsers && user ? json.event.registeredUsers.some((r: any) => String(r.user?._id || r.user) === String(user?._id)) : false
          setAlreadyRegistered(Boolean(already))
        }
        setEvent(json.event)
      } catch (err) {
        console.error(err)
        toast.error('Failed to load event')
      }
    }
    fetchEvent()
  }, [resolvedId])

  const doFreeRegister = async () => {
    if (!user) return router.push('/auth/login')
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`http://localhost:4000/api/events/register/${resolvedId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ userId: user._id })
      })
      const data = await res.json()
      if (res.ok) {
        toast.success('Registered successfully')
        router.push('/dashboard/events')
      } else {
        toast.error(data.message || 'Registration failed')
      }
    } catch (err) {
      console.error(err)
      toast.error('Registration failed')
    } finally {
      setLoading(false)
    }
  }

  const doBlockchainPay = async () => {
    if (!user) return router.push('/auth/login')
    if (!event) return
    const ethProvider = (window as any).ethereum
    if (!ethProvider) {
      toast.error('No Ethereum provider found. Install MetaMask.')
      return
    }
    try {
      setPaying(true)
      await ethProvider.request({ method: 'eth_requestAccounts' })
      const provider = new ethers.providers.Web3Provider(ethProvider as any)
      const signer = provider.getSigner()

      // Convert INR fee to ETH using env var NEXT_PUBLIC_INR_PER_ETH (INR per 1 ETH). Fallback: 300000 INR per ETH
      const inrPerEth = Number(process.env.NEXT_PUBLIC_INR_PER_ETH) || 300000
      const ethAmountFloat = Number(event.fee || 0) / inrPerEth
      if (isNaN(ethAmountFloat) || ethAmountFloat <= 0) {
        toast.error('Invalid fee amount')
        setPaying(false)
        return
      }
      // Ensure we don't pass a number with >18 fractional digits or exponential notation to ethers.
      // toFixed(18) produces a string with up to 18 decimals; strip trailing zeros for cleanliness.
      const ethAmountStr = ethAmountFloat.toFixed(18).replace(/\.?0+$/, '')
      if (!ethAmountStr || Number(ethAmountStr) === 0) {
        toast.error('Fee too small to convert to ETH')
        setPaying(false)
        return
      }
      const amount = ethers.utils.parseUnits(ethAmountStr, 'ether')
      // Determine recipient address: prefer NEXT_PUBLIC_PAYMENT_ADDRESS, fallback to server runtime config
      let toAddr = (process.env.NEXT_PUBLIC_PAYMENT_ADDRESS || '').toString().trim()
      if (!toAddr || !ethers.utils.isAddress(toAddr)) {
        try {
          const cfgRes = await fetch('http://localhost:4000/api/config/payment')
          if (cfgRes.ok) {
            const cfgJson = await cfgRes.json()
            console.log('Fetched runtime payment address from backend:', cfgJson)
            toAddr = cfgJson.paymentAddress || toAddr
          } else {
            console.warn('Config fetch returned', cfgRes.status)
          }
        } catch (e) {
          console.warn('Failed to fetch runtime payment address', e)
        }
      }

      console.log('Payment to address:', toAddr)
      // Validate recipient address before sending
      if (!toAddr || !ethers.utils.isAddress(toAddr)) {
        toast.error('Configured payment address is invalid or missing. Please contact admin.')
        setPaying(false)
        return
      }

      const tx = await signer.sendTransaction({ to: toAddr, value: amount })
      // wait for tx to be mined
      const receipt = await tx.wait()
      const txHash = receipt.transactionHash

      // Call backend to register with payment details
      const token = localStorage.getItem('token')
      const res = await fetch(`http://localhost:4000/api/events/register/${resolvedId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ userId: user._id, paid: true, txHash, amount: event.fee })
      })
      const data = await res.json()
      if (res.ok) {
        toast.success('Payment successful and registered')
        router.push('/dashboard/events')
      } else {
        toast.error(data.message || 'Server registration failed')
      }
    } catch (err: any) {
      console.error('Payment error:', err)
      const message = (err && (err.message || err.error || err.toString())) ? (err.message || err.error || String(err)) : 'Payment failed'
      toast.error(message)
    } finally {
      setPaying(false)
    }
  }

  if (!event) return <div className="p-6">Loading...</div>

  const fee = Number(event?.fee ?? 0)

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <Card>
        <CardContent>
          <h2 className="text-2xl font-semibold mb-2">{event.title}</h2>
          {event.posterUrl && <img src={event.posterUrl} alt={event.title} className="w-full max-h-96 object-cover rounded-lg mb-4" />}
          <p><strong>Date:</strong> {new Date(event.date).toLocaleString()}</p>
          <p><strong>Mode:</strong> {event.mode}</p>
          {event.mode === 'offline' && <p><strong>Venue:</strong> {event.venue}</p>}
          <p className="mt-2">{event.description}</p>
              <div className="mt-4">
                <p><strong>Fee:</strong> {fee > 0 ? `₹ ${fee}` : 'Free'}</p>
              </div>

          <div className="mt-6 flex gap-3">
            {fee > 0 ? (
              <>
                <Button onClick={doBlockchainPay} disabled={paying || alreadyRegistered}>{paying ? 'Processing...' : (alreadyRegistered ? 'Paid & Registered' : 'Pay & Register')}</Button>
                <Button variant="outline" onClick={() => router.push('/dashboard/events')}>Cancel</Button>
              </>
            ) : (
              <>
                <Button onClick={doFreeRegister} disabled={loading || alreadyRegistered}>{loading ? 'Registering...' : (alreadyRegistered ? 'Registered' : 'Register')}</Button>
                <Button variant="outline" onClick={() => router.push('/dashboard/events')}>Cancel</Button>
              </>
            )}
          </div>

          {user && String(user._id) === String(event.createdBy?._id) && (
            <div className="mt-6">
              <h3 className="font-semibold mb-2">Registered Users</h3>
              {event.registeredUsers && event.registeredUsers.length > 0 ? (
                <ul className="space-y-2">
                  {event.registeredUsers.map((r: any) => (
                    <li key={r.user?._id || r.user} className="p-2 border rounded-md">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{r.user ? `${r.user.firstName} ${r.user.lastName}` : r.user}</div>
                          <div className="text-sm text-gray-500">{r.user?.email}</div>
                        </div>
                        <div className="text-sm">
                          {r.paid ? (
                            <span className="text-green-600">Paid: ₹{r.amount} <br/>Tx: {r.txHash}</span>
                          ) : (
                            <span className="text-gray-600">Free</span>
                          )}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500">No registrations yet</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
