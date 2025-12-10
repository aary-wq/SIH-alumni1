'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/app/hooks/useAuth'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

export default function DonorsPage({ params }: any) {
  const { user } = useAuth() as any
  const router = useRouter()
  const [donors, setDonors] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const id = params?.id

  useEffect(()=>{
    if (!user) return
    fetchDonors()
  }, [user])

  const fetchDonors = async () => {
    try {
      setLoading(true)
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
      if (!token) {
        toast.error('Not authenticated')
        setLoading(false)
        return
      }

      const res = await fetch(`http://localhost:4000/api/campaigns/${id}/donors`, {
        headers: { Authorization: `Bearer ${token}` }
      })

      const contentType = res.headers.get('content-type') || ''
      if (!res.ok) {
        if (contentType.includes('application/json')) {
          const errJson = await res.json()
          toast.error(errJson.message || 'Failed to load donors')
        } else {
          const text = await res.text()
          toast.error(text || 'Failed to load donors')
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
      setDonors(json.donors || [])
    } catch (e) {
      console.error(e)
      toast.error('Server error')
    } finally { setLoading(false) }
  }

  if (!user || user.role !== 'admin') return <div className="p-6">Access denied</div>

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h2 className="text-2xl font-semibold mb-4">Donors</h2>
      <div className="space-y-3">
        {donors.map(d => (
          <Card key={d._id}>
            <CardContent>
              <div className="flex justify-between">
                <div>
                  <div className="font-medium">{d.donor?.firstName} {d.donor?.lastName}</div>
                  <div className="text-sm text-gray-500">{d.donor?.email}</div>
                </div>
                <div className="text-sm">₹{d.amount}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
