'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/app/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { toast } from 'sonner'

export default function AdminCampaignsList() {
  const { user } = useAuth() as any
  const router = useRouter()
  const [campaigns, setCampaigns] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(()=>{
    if (!user) return
    fetchCampaigns()
  }, [user])

  const fetchCampaigns = async () => {
    try {
      setLoading(true)
      const res = await fetch('http://localhost:4000/api/campaigns/all')
      const json = await res.json()
      if (res.ok) setCampaigns(json.campaigns || [])
      else toast.error('Failed to load campaigns')
    } catch (e) {
      console.error(e)
      toast.error('Server error')
    } finally { setLoading(false) }
  }

  if (!user || user.role !== 'admin') return <div className="p-6">Access denied</div>

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-semibold">Campaigns</h2>
        <div className="flex gap-2">
          <Button onClick={()=> router.push('/dashboard/admin-campaigns/create')}>Create Campaign</Button>
        </div>
      </div>

      <div className="space-y-4">
        {campaigns.map(c => (
          <Card key={c._id}>
            <CardContent>
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-semibold">{c.title}</h3>
                  <p className="text-sm text-gray-600">{c.universityName || 'General'}</p>
                </div>
                <div className="flex gap-2">
                  <Button onClick={()=> router.push(`/dashboard/admin-campaigns/${c._id}/donors`)}>View Donors</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
