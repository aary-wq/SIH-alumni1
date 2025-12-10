'use client'

import { useState } from 'react'
import { useAuth } from '../app/hooks/useAuth'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { 
  Image as ImageIcon, 
  Calendar, 
  MapPin, 
  Smile, 
  X, 
  Upload,
  Plus
} from 'lucide-react'

interface CreatePostProps {
  onPostCreated?: () => void
}

export default function CreatePost({ onPostCreated }: CreatePostProps) {
  const { user } = useAuth() as any
  const [isOpen, setIsOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  
  // Form state
  const [content, setContent] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [newTag, setNewTag] = useState('')
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>('')
  
  // Event specific fields
  const [eventTitle, setEventTitle] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [eventTime, setEventTime] = useState('')
  const [eventVenue, setEventVenue] = useState('')
  const [eventDescription, setEventDescription] = useState('')
  const [posterFile, setPosterFile] = useState<File | null>(null)
  const [posterPreview, setPosterPreview] = useState<string>('')
  const [eventMode, setEventMode] = useState<string>('')
  const [eventFee, setEventFee] = useState<string>('')
  
  // Location specific fields
  const [placeName, setPlaceName] = useState('')
  const [address, setAddress] = useState('')
  
  // Feeling specific fields
  const [feeling, setFeeling] = useState('')

  const categories = [
    { value: 'photo', label: 'Photo', icon: ImageIcon, description: 'Share a photo with your network' },
    { value: 'event', label: 'Event', icon: Calendar, description: 'Create or share an event' },
    { value: 'location', label: 'Location', icon: MapPin, description: 'Share a location or check-in' },
    { value: 'feeling', label: 'Feeling', icon: Smile, description: 'Express how you\'re feeling' }
  ]

  const feelings = [
    'excited', 'grateful', 'proud', 'motivated', 
    'happy', 'nostalgic', 'inspired', 'accomplished'
  ]

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error('Image size should be less than 5MB')
        return
      }
      setSelectedImage(file)
      const reader = new FileReader()
      reader.onload = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handlePosterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Poster size should be less than 5MB')
        return
      }
      setPosterFile(file)
      const reader = new FileReader()
      reader.onload = () => setPosterPreview(reader.result as string)
      reader.readAsDataURL(file)
    }
  }

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim().toLowerCase())) {
      setTags([...tags, newTag.trim().toLowerCase()])
      setNewTag('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove))
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addTag()
    }
  }

  const resetForm = () => {
    setContent('')
    setTags([])
    setNewTag('')
    setSelectedImage(null)
    setImagePreview('')
    setEventTitle('')
    setEventDate('')
    setEventTime('')
    setEventVenue('')
    setEventDescription('')
    setPosterFile(null)
    setPosterPreview('')
    setPlaceName('')
    setAddress('')
    setFeeling('')
    setSelectedCategory('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!content.trim()) {
      toast.error('Please enter some content for your post')
      return
    }

    if (!selectedCategory) {
      toast.error('Please select a post category')
      return
    }

    // Category specific validations
    if (selectedCategory === 'photo' && !selectedImage) {
      toast.error('Please select an image for photo posts')
      return
    }

    if (selectedCategory === 'event') {
      if (!eventTitle || !eventDate || !eventTime || !eventVenue) {
        toast.error('Please fill in all required event details')
        return
      }
    }

    if (selectedCategory === 'location' && !placeName) {
      toast.error('Please enter a place name for location posts')
      return
    }

    if (selectedCategory === 'feeling' && !feeling) {
      toast.error('Please select a feeling for feeling posts')
      return
    }

    setIsLoading(true)

    try {
      const formData = new FormData()
      formData.append('content', content)
      formData.append('category', selectedCategory)
      formData.append('tags', JSON.stringify(tags))

      if (selectedCategory === 'photo' && selectedImage) {
        formData.append('image', selectedImage)
      }

      if (selectedCategory === 'event') {
        formData.append('eventDetails', JSON.stringify({
          title: eventTitle,
          date: eventDate,
          time: eventTime,
          venue: eventVenue,
          description: eventDescription,
          mode: eventMode || undefined,
          fee: eventFee ? Number(eventFee) : 0
        }))
        // attach poster file as 'image' so server multer/cloudinary will store it
        if (posterFile) formData.append('image', posterFile)
      }

      if (selectedCategory === 'location') {
        formData.append('locationDetails', JSON.stringify({
          placeName,
          address
        }))
      }

      if (selectedCategory === 'feeling') {
        formData.append('feeling', feeling)
      }

      const token = localStorage.getItem('token')
      const response = await fetch('http://localhost:4000/api/posts', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('Post created successfully!')
        resetForm()
        setIsOpen(false)
        onPostCreated?.()
      } else {
        toast.error(data.error || 'Failed to create post')
      }
    } catch (error) {
      console.error('Error creating post:', error)
      toast.error('Failed to create post. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (!user) return null

  return (
    <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={user.profileUrl} />
            <AvatarFallback className="bg-primary text-white">
              {user.firstName[0]}{user.lastName[0]}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger asChild>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 mb-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                  <p className="text-gray-500 dark:text-gray-400">
                    Share your thoughts, achievements, or career updates with the AlmaConnect community...
                  </p>
                </div>
              </DialogTrigger>
              
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create a Post</DialogTitle>
                </DialogHeader>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Category Selection */}
                  {!selectedCategory && (
                    <div>
                      <Label className="text-base font-semibold mb-3 block">
                        What would you like to share?
                      </Label>
                      <div className="grid grid-cols-2 gap-3">
                        {categories.map((category) => {
                          // Hide 'event' category for students
                          if (category.value === 'event' && user && user.role === 'student') return null
                          const IconComponent = category.icon
                          return (
                            <button
                              key={category.value}
                              type="button"
                              onClick={() => setSelectedCategory(category.value)}
                              className="p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
                            >
                              <div className="flex items-center gap-3">
                                <IconComponent className="h-5 w-5 text-primary" />
                                <div>
                                  <p className="font-medium">{category.label}</p>
                                  <p className="text-sm text-gray-500">{category.description}</p>
                                </div>
                              </div>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Selected Category Form */}
                  {selectedCategory && (
                    <>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {(() => {
                            const category = categories.find(c => c.value === selectedCategory)
                            const IconComponent = category?.icon || ImageIcon
                            return (
                              <>
                                <IconComponent className="h-5 w-5 text-primary" />
                                <span className="font-medium">{category?.label} Post</span>
                              </>
                            )
                          })()}
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedCategory('')}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* Content */}
                      <div>
                        <Label htmlFor="content">Content *</Label>
                        <Textarea
                          id="content"
                          value={content}
                          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setContent(e.target.value)}
                          placeholder="What's on your mind?"
                          rows={4}
                          className="mt-1"
                          required
                        />
                      </div>

                      {/* Category Specific Fields */}
                      {selectedCategory === 'photo' && (
                        <div>
                          <Label htmlFor="image">Image *</Label>
                          <div className="mt-1">
                            <Input
                              id="image"
                              type="file"
                              accept="image/*"
                              onChange={handleImageChange}
                              className="mb-2"
                              required
                            />
                            {imagePreview && (
                              <div className="relative">
                                <img 
                                  src={imagePreview} 
                                  alt="Preview" 
                                  className="w-full max-h-64 object-cover rounded-lg"
                                />
                                <Button
                                  type="button"
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedImage(null)
                                    setImagePreview('')
                                  }}
                                  className="absolute top-2 right-2"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

          {selectedCategory === 'event' && (
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="eventTitle">Event Title *</Label>
                              <Input
                                id="eventTitle"
                                value={eventTitle}
                                onChange={(e) => setEventTitle(e.target.value)}
                                placeholder="Enter event title"
                                required
                              />
                            </div>
                            <div>
                              <Label htmlFor="eventVenue">Venue *</Label>
                              <Input
                                id="eventVenue"
                                value={eventVenue}
                                onChange={(e) => setEventVenue(e.target.value)}
                                placeholder="Enter venue"
                                required
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="eventDate">Date *</Label>
                              <Input
                                id="eventDate"
                                type="date"
                                value={eventDate}
                                onChange={(e) => setEventDate(e.target.value)}
                                required
                              />
                            </div>
                            <div>
                              <Label htmlFor="eventTime">Time *</Label>
                              <Input
                                id="eventTime"
                                type="time"
                                value={eventTime}
                                onChange={(e) => setEventTime(e.target.value)}
                                required
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="eventMode">Mode</Label>
                              <Select value={eventMode} onValueChange={(v) => setEventMode(v)}>
                                <SelectTrigger className="mt-1">
                                  <SelectValue placeholder="Select mode" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="online">Online</SelectItem>
                                  <SelectItem value="offline">Offline</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label htmlFor="eventFee">Fee (INR)</Label>
                              <Input
                                id="eventFee"
                                type="number"
                                value={eventFee}
                                onChange={(e) => setEventFee(e.target.value)}
                                placeholder="0"
                              />
                            </div>
                          </div>
                          <div>
                            <Label htmlFor="eventDescription">Description</Label>
                            <Textarea
                              id="eventDescription"
                              value={eventDescription}
                              onChange={(e) => setEventDescription(e.target.value)}
                              placeholder="Event description"
                              rows={3}
                            />
                          </div>
                          <div>
                            <Label htmlFor="posterFile">Event Poster</Label>
                            <Input
                              id="posterFile"
                              type="file"
                              accept="image/*"
                              onChange={handlePosterChange}
                              className="mb-2"
                            />
                            {posterPreview && (
                              <div className="relative">
                                <img src={posterPreview} alt="Poster Preview" className="w-full max-h-64 object-cover rounded-lg" />
                                <Button
                                  type="button"
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => { setPosterFile(null); setPosterPreview('') }}
                                  className="absolute top-2 right-2"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {selectedCategory === 'location' && (
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="placeName">Place Name *</Label>
                            <Input
                              id="placeName"
                              value={placeName}
                              onChange={(e) => setPlaceName(e.target.value)}
                              placeholder="Enter place name"
                              required
                            />
                          </div>
                          <div>
                            <Label htmlFor="address">Address</Label>
                            <Input
                              id="address"
                              value={address}
                              onChange={(e) => setAddress(e.target.value)}
                              placeholder="Enter full address"
                            />
                          </div>
                        </div>
                      )}

                      {selectedCategory === 'feeling' && (
                        <div>
                          <Label htmlFor="feeling">How are you feeling? *</Label>
                          <Select value={feeling} onValueChange={setFeeling} required>
                            <SelectTrigger className="mt-1">
                              <SelectValue placeholder="Select a feeling" />
                            </SelectTrigger>
                            <SelectContent>
                              {feelings.map((feel) => (
                                <SelectItem key={feel} value={feel}>
                                  {feel.charAt(0).toUpperCase() + feel.slice(1)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      {/* Tags */}
                      <div>
                        <Label htmlFor="tags">Tags</Label>
                        <div className="mt-1 space-y-2">
                          <div className="flex gap-2">
                            <Input
                              id="tags"
                              value={newTag}
                              onChange={(e) => setNewTag(e.target.value)}
                              onKeyPress={handleKeyPress}
                              placeholder="Add a tag"
                            />
                            <Button type="button" onClick={addTag} size="sm">
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                          {tags.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {tags.map((tag) => (
                                <Badge key={tag} variant="secondary" className="gap-1">
                                  #{tag}
                                  <X 
                                    className="h-3 w-3 cursor-pointer" 
                                    onClick={() => removeTag(tag)}
                                  />
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Submit Button */}
                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsOpen(false)}
                          disabled={isLoading}
                        >
                          Cancel
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                          {isLoading ? 'Creating...' : 'Create Post'}
                        </Button>
                      </div>
                    </>
                  )}
                </form>
              </DialogContent>
            </Dialog>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-4 text-gray-500 dark:text-gray-400">
              {categories.map((category) => {
                const IconComponent = category.icon
                return (
                  <Button 
                    key={category.value}
                    variant="ghost" 
                    size="sm" 
                    className="gap-2"
                    onClick={() => {
                      setSelectedCategory(category.value)
                      setIsOpen(true)
                    }}
                  >
                    <IconComponent className="h-4 w-4" />
                    {category.label}
                  </Button>
                )
              })}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}