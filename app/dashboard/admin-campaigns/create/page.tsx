'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/app/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'

export default function AdminCreateCampaign() {
  const { user } = useAuth() as any
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [goal, setGoal] = useState('')
  const [universityName, setUniversityName] = useState('')
  const [isCollege, setIsCollege] = useState(true)
  const [loading, setLoading] = useState(false)

  if (!user || user.role !== 'admin') return <div className="p-6">Access denied</div>

  // Prefill universityName from admin profile when available
  React.useEffect(()=>{
    if (user && user.universityName) setUniversityName(user.universityName)
  }, [user])

  const handleSubmit = async () => {
    setLoading(true)
    try {
      if (!user || !user._id) {
        toast.error('Unable to identify admin user. Please reload and try again.')
        setLoading(false)
        return
      }
      const form = new FormData()
      form.append('title', title)
      form.append('description', description)
      form.append('goal', goal)
      form.append('createdBy', user._id)
      form.append('universityName', universityName)
      form.append('isCollegeDevelopment', isCollege ? 'true' : 'false')

      const res = await fetch('http://localhost:4000/api/campaigns/create', {
        method: 'POST',
        body: form
      })
      const json = await res.json()
      if (res.ok) {
        toast.success('Campaign created')
        router.push('/dashboard/admin-campaigns')
      } else {
        toast.error(json.message || 'Failed to create')
      }
    } catch (e) {
      console.error(e)
      toast.error('Server error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h2 className="text-2xl font-semibold mb-4">Create College Development Campaign</h2>
      <div className="space-y-3">
        <Input placeholder="Title" value={title} onChange={(e:any)=> setTitle(e.target.value)} />
        <Input placeholder="Short description" value={description} onChange={(e:any)=> setDescription(e.target.value)} />
        <Input placeholder="Goal (INR)" value={goal} onChange={(e:any)=> setGoal(e.target.value)} />
  {/* Admin's university is used as the campaign's target college. Read-only to avoid mistakes. */}
  <Input placeholder="University Name (exact)" value={universityName} readOnly />
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2"><input type="checkbox" checked={isCollege} onChange={(e:any)=> setIsCollege(e.target.checked)} /> College Development</label>
        </div>
        <div className="flex gap-3">
          <Button onClick={handleSubmit} disabled={loading}>{loading ? 'Creating...' : 'Create Campaign'}</Button>
          <Button variant="outline" onClick={()=> router.push('/dashboard')}>Cancel</Button>
        </div>
      </div>
    </div>
  )
}
