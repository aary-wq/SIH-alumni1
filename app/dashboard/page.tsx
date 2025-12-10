'use client'
import { useAuth } from '../hooks/useAuth'
import { useRouter,useSearchParams } from 'next/navigation'

import { useEffect, useState } from 'react'
import { Card, CardContent } from "../../components/ui/card"
import { Button } from "../../components/ui/button"
import CreatePost from "../../components/CreatePost"
import PostCard from "../../components/PostCard"
import { toast } from 'sonner'

interface Post {
  _id: string
  content: string
  category: 'photo' | 'event' | 'location' | 'feeling'
  author: {
    _id: string
    firstName: string
    lastName: string
    universityName: string
    role: string
    profileUrl?: string
  }
  imageUrl?: string
  eventDetails?: any
  locationDetails?: any
  feeling?: string
  tags: string[]
  likes: any[]
  comments: any[]
  likeCount: number
  commentCount: number
  shareCount: number
  createdAt: string
  updatedAt: string
}

export default function DashboardPage() {
  const { user, loading, logout } = useAuth() as any
  const router = useRouter()
  const [walletAddr, setWalletAddr] = useState<string | null>(null)

  const handleConnectWallet = async () => {
    if (!(window as any).ethereum) {
      alert('No web3 wallet found')
      return
    }
    try {
      const provider = new (await import('ethers')).providers.Web3Provider((window as any).ethereum)
      await provider.send('eth_requestAccounts', [])
      const signer = provider.getSigner()
      const address = await signer.getAddress()
      setWalletAddr(address)

      const token = localStorage.getItem('token')
      const base = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000')
      await fetch(`${base}/api/users/set-wallet`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ walletAddress: address }),
      })
      // best effort: we don't refresh auth context here; a manual refresh will show updated state
    } catch (e) {
      console.error(e)
      alert('Wallet connection failed')
    }
  }

  // verification state for alumni upload
  const [docFile, setDocFile] = useState<File | null>(null)
  const [verifying, setVerifying] = useState(false)
  const [verifyMessage, setVerifyMessage] = useState<string | null>(null)

  const handleVerifyUpload = async () => {
    setVerifyMessage(null)
    if (!docFile) return alert('Please choose a document file to upload')
    const walletToUse = walletAddr || user?.walletAddress
    if (!walletToUse) return alert('Please connect your wallet first')

    setVerifying(true)
    try {
      const base = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000')
      const form = new FormData()
      form.append('documentFile', docFile)
      form.append('walletAddress', walletToUse)

      const res = await fetch(`${base}/api/users/verify-document`, {
        method: 'POST',
        body: form,
      })

      const json = await res.json()
      if (!res.ok) {
        setVerifyMessage(json.message || 'Verification failed')
      } else {
        if (json.verified) {
          setVerifyMessage('Verified — congratulations!')
          // refresh the page/auth to pick up updated isVerified flag
          setTimeout(()=> window.location.reload(), 800)
        } else {
          setVerifyMessage('Not found in admin dataset')
        }
      }
    } catch (e) {
      console.error(e)
      setVerifyMessage('Server error during verification')
    } finally {
      setVerifying(false)
    }
  }

  const searchParams = useSearchParams();
  
  const [posts, setPosts] = useState<Post[]>([])
  const [isLoadingPosts, setIsLoadingPosts] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [hasMorePosts, setHasMorePosts] = useState(true)

  useEffect(() => {
    const token = searchParams.get("token")
    if (token) {
      localStorage.setItem("token", token)
      router.replace("/dashboard")
    }
  }, [searchParams, router])

  useEffect(() => {
    // Only redirect to login if we have determined the user is unauthenticated.
    // IMPORTANT: do NOT auto-redirect admins anywhere. Admins should stay on
    // the Feed (/dashboard) unless they explicitly navigate to the admin UI.
    if (!loading && !user) {
      router.push('/auth/login')
      return
    }
  }, [loading, user, router])

  useEffect(() => {
    if (user) {
      fetchPosts()
    }
  }, [user])

  const fetchPosts = async (page = 1, reset = true) => {
    try {
      setIsLoadingPosts(true)
      const token = localStorage.getItem('token')
      const response = await fetch(`http://localhost:4000/api/posts/feed?page=${page}&limit=10`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const data = await response.json()

      if (response.ok) {
        if (reset) {
          setPosts(data.posts)
        } else {
          setPosts(prev => [...prev, ...data.posts])
        }
        setHasMorePosts(data.pagination.hasNextPage)
        setCurrentPage(page)
      } else {
        toast.error('Failed to fetch posts')
      }
    } catch (error) {
      console.error('Error fetching posts:', error)
      toast.error('Failed to fetch posts')
    } finally {
      setIsLoadingPosts(false)
    }
  }

  const handlePostCreated = () => {
    // Refresh posts when a new post is created
    fetchPosts(1, true)
  }

  const handleDeletePost = (postId: string) => {
    setPosts(posts.filter(post => post._id !== postId))
  }

  const loadMorePosts = () => {
    if (hasMorePosts && !isLoadingPosts) {
      fetchPosts(currentPage + 1, false)
    }
  }

  if (loading || !user) return <div className="p-6 text-center">Loading...</div>

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Welcome Banner */}
      <Card className="bg-gradient-to-r from-primary to-primary/90 text-white border-0">
        <CardContent className="p-8">
          <h1 className="text-3xl font-bold mb-2">Welcome to GradeNet</h1>
          <h1 className="text-3xl font-bold mb-2">Welcome {user?.firstName} 👋</h1>
          <p className="text-primary-foreground/80 text-lg mb-4">
            Your personalized feed showing posts from your college network and connections.
          </p>
          <Button
            variant="secondary"
            className="bg-white text-primary hover:bg-gray-50"
          >
            Connect Share Grow Succeed
          </Button>
          <div className="mt-4 space-x-2">
            {user.role === 'admin' ? (
              <div className="flex gap-2">
                <Button onClick={() => router.push('/dashboard/admin-users')} className="bg-indigo-600 text-white">
                  Admin Dashboard
                </Button>
                <Button onClick={() => router.push('/dashboard/admin-campaigns')} variant="outline">
                  Admin Campaigns
                </Button>
              </div>
              ) : (
              <>
                {/* Wallet connect; show verification UI only for alumni */}
                <div className="flex items-center gap-3">
                  <button onClick={handleConnectWallet} className="px-4 py-2 bg-green-600 text-white rounded">{walletAddr ? `Connected: ${walletAddr}` : 'Connect Wallet'}</button>
                  {user.role === 'alumni' && (
                    <>
                      <span className="ml-3">{user.isVerified ? <span className="inline-block bg-emerald-100 text-emerald-800 px-2 py-1 rounded">Verified Alumni</span> : <span className="inline-block bg-yellow-100 text-yellow-800 px-2 py-1 rounded">Pending Verification</span>}</span>
                      <Button onClick={() => router.push('/dashboard/college-fund')} variant="outline" className="ml-3">
                        College Fund
                      </Button>
                    </>
                  )}
                  {user.role === 'student' && (
                    <Button 
                      onClick={() => window.open('https://vitexpshare.tech', '_blank')} 
                      variant="outline" 
                      className="ml-3 bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100"
                    >
                      Alumni Interview Experience
                    </Button>
                  )}
                </div>

                {/* Document upload & verify (only for alumni and when not verified) */}
                {user.role === 'alumni' && !user.isVerified && (
                  <div className="mt-3">
                    <input type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" onChange={(e)=> setDocFile(e.target.files?.[0] || null)} />
                    <button onClick={handleVerifyUpload} disabled={verifying} className="ml-3 px-3 py-2 bg-blue-600 text-white rounded">{verifying ? 'Verifying...' : 'Upload & Verify'}</button>
                    {verifyMessage && <div className="mt-2 text-sm text-gray-700">{verifyMessage}</div>}
                  </div>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Create Post Component */}
      <CreatePost onPostCreated={handlePostCreated} />

      {/* Feed Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">My Feed</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Posts from your college and network connections
        </p>
      </div>

      {/* Posts Feed */}
      <div className="space-y-6">
        {isLoadingPosts && posts.length === 0 ? (
          <div className="text-center py-8">
            <p>Loading posts...</p>
          </div>
        ) : posts.length === 0 ? (
          <Card className="bg-white dark:bg-gray-800">
            <CardContent className="p-8 text-center">
              <h3 className="text-lg font-semibold mb-2">No posts in your feed yet</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Your feed shows posts from your college network and connections. Connect with alumni from {user?.universityName} to see more posts!
              </p>
              <Button 
                onClick={() => router.push('/dashboard/network')}
                variant="outline"
                className="mr-2"
              >
                Find Connections
              </Button>
              <Button 
                onClick={() => router.push('/dashboard/profile/my-posts')}
                variant="outline"
              >
                View My Posts
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {posts.map((post) => (
              <PostCard
                key={post._id}
                post={post}
                currentUserId={user?._id}
                onDelete={handleDeletePost}
                showActions={true}
              />
            ))}

            {/* Load More Button */}
            {hasMorePosts && (
              <div className="text-center py-4">
                <Button
                  onClick={loadMorePosts}
                  disabled={isLoadingPosts}
                  variant="outline"
                >
                  {isLoadingPosts ? 'Loading...' : 'Load More Posts'}
                </Button>
              </div>
            )}

            {!hasMorePosts && posts.length > 0 && (
              <div className="text-center py-4">
                <p className="text-gray-500 dark:text-gray-400">
                  You've reached the end of the feed
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>

  )
}
