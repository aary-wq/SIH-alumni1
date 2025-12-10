'use client'

import React, { useEffect, useState } from 'react'
import { useAuth } from '@/app/hooks/useAuth'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

export default function CollegeFundPage() {
  const { user } = useAuth() as any
  const [donations, setDonations] = useState<any[]>([])
  const [campaigns, setCampaigns] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)

  useEffect(()=>{
    if (!user) return
    fetchMyDonations()
    fetchAvailableCampaigns()
  }, [user])

  const fetchMyDonations = async () => {
    try {
      setLoading(true)
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
      if (!token) {
        toast.error('Not authenticated')
        setLoading(false)
        return
      }

      const res = await fetch(`http://localhost:4000/api/campaigns/my-donations/${user._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })

      const contentType = res.headers.get('content-type') || ''
      if (!res.ok) {
        // try to read JSON error, otherwise text
        if (contentType.includes('application/json')) {
          const errJson = await res.json()
          toast.error(errJson.message || 'Failed to load')
        } else {
          const text = await res.text()
          toast.error(text || 'Failed to load')
        }
        setLoading(false)
        return
      }

      if (!contentType.includes('application/json')) {
        const text = await res.text()
        console.error('Expected JSON but received:', text)
        toast.error('Server returned unexpected response')
        setLoading(false)
        return
      }

      const json = await res.json()
      setDonations(json.donations || [])
      let t = 0
      json.donations.forEach((c:any)=> c.donations.forEach((d:any)=> t += d.amount))
      setTotal(t)
    } catch (e) {
      console.error(e)
      const err = e as any
      toast.error(err?.message || 'Server error')
    } finally { setLoading(false) }
  }

  const fetchAvailableCampaigns = async () => {
    try {
      // public endpoint, no auth required
      const res = await fetch('http://localhost:4000/api/campaigns/all')
      if (!res.ok) return
      const json = await res.json()
      const all = json.campaigns || []
      // show only college development campaigns for the alumni's university (or general ones)
      const filtered = all.filter((c:any) => c.isCollegeDevelopment && (!c.universityName || c.universityName === user.universityName))
      setCampaigns(filtered)
    } catch (e) {
      console.error('Failed to load campaigns', e)
    }
  }

  if (!user || user.role !== 'alumni') return <div className="p-6">Access denied</div>

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-semibold mb-4">College Development Fund</h2>
      <div className="mb-4">Total donated: <strong>₹{total}</strong></div>
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-2">Active College Development Campaigns</h3>
        {campaigns.length === 0 ? (
          <div className="text-sm text-gray-600">No active college campaigns for your university yet. If you believe this is an error, confirm that your profile's university name matches the campaign's university (exact match).</div>
        ) : (
          <div className="space-y-3">
            {campaigns.map((c:any) => (
              <Card key={c._id}>
                <CardContent>
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-semibold">{c.title}</h4>
                      <div className="text-sm text-gray-600">{c.universityName || 'General'}</div>
                    </div>
                    <div>
                      <Button onClick={() => window.location.href = `/dashboard/college-fund/donate/${c._id}`}>
                        Donate
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
      <div className="space-y-4">
        {donations.map((c:any)=> (
          <Card key={c.campaignId}>
            <CardContent>
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-semibold">{c.title}</h3>
                  <div className="text-sm text-gray-600">Donations: {c.donations.length}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm">₹{c.donations.reduce((s:any,d:any)=> s + d.amount, 0)}</div>
                  <Button onClick={()=> window.location.href = `/dashboard/admin-campaigns/${c.campaignId}/donors`}>View Campaign</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
