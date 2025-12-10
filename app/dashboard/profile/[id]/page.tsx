"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, MessageCircle, UserPlus, Mail, Phone, GraduationCap, Calendar, Clock, Sparkles } from "lucide-react";
import PostSummaryTimeline from "@/components/PostSummaryTimeline";

interface Profile {
  firstName: string;
  lastName: string;
  role: string;
  major?: string;
  universityName: string;
  graduationYear: number;
  profileViews?: number;
  connections?: any[];
  mutualConnections?: number;
}

interface TimelineStory {
  id: number;
  title: string;
  description: string;
  date: string;
  type: string;
}

export default function ProfilePage() {
  const params = useParams();
  // In newer Next.js versions `params` may be a Promise-like value; unwrap safely
  // and avoid accessing `params.id` directly to prevent the React.use() warning.
  const id = params && typeof params === 'object' ? (params as any).id : undefined;
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // Mock timeline stories for the user
  const userTimelineStories = [
    {
      id: 1,
      title: "Joined as Software Engineer at Microsoft",
      description: "Started career in cloud computing division",
      date: "2023-06-15",
      type: "career"
    },
    {
      id: 2,
      title: "Published research paper on AI Ethics",
      description: "Co-authored paper published in IEEE Computer Society",
      date: "2023-09-22",
      type: "research"
    },
    {
      id: 3,
      title: "Promoted to Senior Software Engineer",
      description: "Recognition for outstanding performance in Azure team",
      date: "2024-03-10",
      type: "career"
    }
  ];

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:4000/api/users/profile/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    try {
      const token = localStorage.getItem("token");
      await fetch(`http://localhost:4000/api/users/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          recipientId: id, 
          message: "Hi! I'd like to connect with you." 
        }),
      });
      alert("Message sent successfully!");
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  useEffect(() => {
    if (id) {
      fetchProfile();
    }
  }, [id]);

  if (loading) return <div className="p-6">Loading...</div>;
  if (!profile) return <div className="p-6">Profile not found</div>;

  return (
    <div className="p-6 space-y-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-2xl font-bold">Profile</h1>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-start gap-6">
            <Avatar className="h-24 w-24">
              <AvatarFallback className="bg-primary text-white text-2xl">
                {profile.firstName[0]}{profile.lastName[0]}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h2 className="text-2xl font-bold">{profile.firstName} {profile.lastName}</h2>
              <p className="text-lg text-gray-600 capitalize">{profile.role} - {profile.major || 'General'}</p>
              <div className="flex items-center gap-4 mt-4 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <GraduationCap className="h-4 w-4" />
                  {profile.universityName}
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Class of {profile.graduationYear}
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <Button onClick={sendMessage}>
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Send Message
                </Button>
                <Button variant="outline">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Connect
                </Button>
              </div>
            </div>
          </div>
          
          <div className="mt-6 grid grid-cols-3 gap-4 pt-6 border-t">
            <div className="text-center">
              <div className="text-2xl font-bold">{profile.profileViews || 0}</div>
              <div className="text-sm text-gray-500">Profile Views</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{profile.connections?.length || 0}</div>
              <div className="text-sm text-gray-500">Connections</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{profile.mutualConnections || 0}</div>
              <div className="text-sm text-gray-500">Mutual</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI-Powered Post Timeline */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                AI Story Timeline
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                AI-generated summaries of user posts and activities
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <PostSummaryTimeline userId={id as string} />
        </CardContent>
      </Card>
    </div>
  );
}