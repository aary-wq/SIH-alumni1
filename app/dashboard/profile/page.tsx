"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "../../hooks/useAuth";
import { useRouter } from "next/navigation";
import {
  MessageCircle,
  Edit,
  MapPin,
  Building,
  Calendar,
  Mail,
  Phone,
  Globe,
  Star,
  User,
  FileText,
  Download,
  Eye,
} from "lucide-react";

interface Skill {
  id?: number;
  name: string;
  level: number;
}

interface Experience {
  id?: number;
  title: string;
  company: string;
  location?: string;
  startDate: string;
  endDate?: string;
  current?: boolean;
  description: string;
  skills?: string[];
  period?: string; // for backward compatibility
}

interface Education {
  id?: number;
  institution: string;
  degree: string;
  field?: string;
  startDate: string;
  endDate?: string;
  grade?: string;
  description?: string;
}

interface Award {
  id?: number;
  title: string;
  organization?: string;
  issuer?: string;
  date: string;
  description?: string;
}

export default function ProfilePage() {

  const authContext = useAuth() as any;
  const user = authContext?.user;
  const router = useRouter();

  // Helper function to get file info from URL
  const getFileInfo = (url: string) => {
    if (!url) return { type: 'unknown', name: 'Document' };
    
    const extension = url.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf':
        return { type: 'pdf', name: 'PDF Document' };
      case 'doc':
      case 'docx':
        return { type: 'word', name: 'Word Document' };
      case 'jpg':
      case 'jpeg':
      case 'png':
        return { type: 'image', name: 'Image Document' };
      default:
        return { type: 'file', name: 'Document' };
    }
  };

  // Helper function to handle document viewing with error handling
  const handleViewDocument = async (documentUrl: string) => {
    try {
      // Convert relative URLs to full backend URLs
      const fullUrl = documentUrl.startsWith('/api/') 
        ? `http://localhost:4000${documentUrl}`
        : documentUrl;
      
      console.log('Opening document URL:', fullUrl);
      
      // First try to open the document directly
      const newWindow = window.open(fullUrl, '_blank');
      
      // If popup was blocked or failed to open
      if (!newWindow) {
        alert('Popup blocked. Please allow popups for this site and try again.');
        return;
      }
      
      // For local files, show a success message
      if (documentUrl.startsWith('/api/')) {
        setTimeout(() => {
          console.log('Local document should be loading...');
        }, 1000);
      }
      
    } catch (error) {
      console.error('Error opening document:', error);
      alert('Error opening document. Please try downloading the file instead or contact support.');
    }
  };

  // Helper function to handle document download with error handling
  const handleDownloadDocument = async (documentUrl: string, fileName: string) => {
    try {
      // Convert relative URLs to full backend URLs
      const fullUrl = documentUrl.startsWith('/api/') 
        ? `http://localhost:4000${documentUrl}`
        : documentUrl;
      
      console.log('Downloading document from:', fullUrl);
      
      // Create a temporary link for download
      const link = document.createElement('a');
      link.href = fullUrl;
      link.download = fileName;
      link.target = '_blank';
      
      // Add to DOM, click, and remove
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Show success message
      setTimeout(() => {
        console.log('Download should have started for:', fileName);
      }, 500);
    } catch (error) {
      console.error('Error downloading document:', error);
      alert('Error downloading document. Please try opening the document in a new tab instead.');
    }
  };

  const skills: Skill[] = user?.skills || [
    { name: "React", level: 95 },
    { name: "TypeScript", level: 90 },
    { name: "Node.js", level: 85 },
    { name: "Python", level: 80 },
    { name: "AWS", level: 75 },
    { name: "Team Leadership", level: 88 },
  ];

  const experience: Experience[] = user?.experience || [
    {
      title: "Senior Software Engineer",
      company: "Google",
      period: "Jan 2023 - Present",
      location: "Mountain View, CA",
      description:
        "Leading frontend development for Google Cloud Infrastructure products. Managing a team of 5 engineers and driving technical decisions for scalable React applications.",
      skills: ["React", "TypeScript", "Node.js", "GCP", "Team Leadership"],
    },
    {
      title: "Software Engineer",
      company: "Meta",
      period: "Jun 2020 - Dec 2022",
      location: "Menlo Park, CA",
      description:
        "Developed and maintained React components for Facebook's main platform.",
      skills: ["React", "JavaScript", "GraphQL"],
    },
  ];

  const education: Education[] = user?.education || [];
  const awards: Award[] = user?.awards || [];

  return (
    <div className="p-6 space-y-6">
      {/* Profile Header */}
      <Card className="bg-gradient-to-r from-primary to-primary/90 text-white border-0">
        <CardContent className="p-8">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-6">
              <Avatar className="h-24 w-24 border-4 border-white">
                <AvatarFallback className="bg-white text-primary text-2xl font-bold">
                {user?.profileUrl && user.profileUrl !== "" ? (
                  <img 
                    src={user.profileUrl.startsWith('/api/') 
                      ? `http://localhost:4000${user.profileUrl}` 
                      : user.profileUrl
                    } 
                    alt="Profile"
                    className="w-full h-full object-cover rounded-full"
                  />
                ) : (
                  `${user?.firstName[0].toUpperCase()}${user?.lastName[0].toUpperCase()}`
                )}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-3xl font-bold mb-2">{user?.firstName} {user?.lastName} {"("+user?.role+")"}</h1>
                <p className="text-xl text-primary-foreground/80 mb-2">
                  {user?.universityName.toUpperCase()}
                </p>
                <div className="flex items-center gap-4 text-primary-foreground/80 mb-4">
                  <div className="flex items-center gap-1">
                    <Building className="h-4 w-4" />
                    Google
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    Mountain View, CA
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Class of {user?.graduationYear}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" className="gap-2">
                <MessageCircle className="h-4 w-4" />
                Message
              </Button>
              <Button
                variant="outline"
                className="gap-2 border-white text-black hover:bg-white hover:text-primary"
                onClick={()=>{router.push("/dashboard/profile/edit");}}
              >
                <Edit className="h-4 w-4" />
                Edit Profile
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          {/* About */}
          <Card>
            <CardHeader>
              <CardTitle>About</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                {user?.about || "Passionate software engineer with 4+ years of experience building scalable web applications. Alumni of Computer Science Department, Class of 2020. Currently leading the frontend team for Google's Cloud Infrastructure products."}
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <span> {user?.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <span>+91 {user?.contactNumber}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-gray-400" />
                  <span>www. {user?.firstName}.dev</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span>Joined September 2020</span>
                </div>
              </div>
            </CardContent>
          </Card>

          

          {/* Skills & Endorsements */}
          <Card>
            <CardHeader>
              <CardTitle>Skills & Endorsements</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {skills.map((skill, index) => (
                <div key={index}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm">{skill.name}</span>
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      <span className="text-xs">{skill.level}%</span>
                    </div>
                  </div>
                  <Progress value={skill.level} className="h-2" />
                </div>
              ))}
              <Button variant="outline" className="w-full mt-4">
                View All Skills
              </Button>
            </CardContent>
          </Card>

          {/* Documents */}
          <Card>
            <CardHeader>
              <CardTitle>Documents</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {user?.documentLink ? (
                <div className="flex items-center justify-between p-4 border rounded-lg bg-gray-50 dark:bg-gray-900">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">Verification Document</p>
                      <p className="text-xs text-gray-500">Uploaded document</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewDocument(user.documentLink)}
                      className="gap-1"
                    >
                      <Eye className="h-3 w-3" />
                      View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownloadDocument(
                        user.documentLink,
                        `${user.firstName}_${user.lastName}_document`
                      )}
                      className="gap-1"
                    >
                      <Download className="h-3 w-3" />
                      Download
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 text-gray-500">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                  <p>No documents uploaded</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="experience" className="space-y-4">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="experience">Experience</TabsTrigger>
              <TabsTrigger value="education">Education</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
              <TabsTrigger value="awards">Awards</TabsTrigger>
            </TabsList>

            <TabsContent value="experience" className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Work Experience</h3>
                <Button variant="outline" size="sm">
                  Add Experience
                </Button>
              </div>

              <div className="space-y-6">
                {experience.map((exp, index) => (
                  <Card key={index}>
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                          <Building className="h-6 w-6 text-primary" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-lg">{exp.title}</h4>
                          <p className="text-gray-600 mb-1">{exp.company}</p>
                          <p className="text-sm text-gray-500 mb-3">
                            {exp.period || `${exp.startDate} - ${exp.current ? 'Present' : exp.endDate}`}
                            {exp.location && ` • ${exp.location}`}
                          </p>
                          <p className="text-sm text-gray-700 mb-4">
                            {exp.description}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {exp.skills?.map((skill, skillIndex) => (
                              <Badge
                                key={skillIndex}
                                variant="secondary"
                                className="text-xs"
                              >
                                {skill}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="education" className="space-y-4">
              {education.length > 0 ? (
                <div className="grid gap-4">
                  {education.map((edu, index) => (
                    <Card key={edu.id || index}>
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold">{edu.degree}</h3>
                            <p className="text-gray-600 mb-1">{edu.institution}</p>
                            {edu.field && (
                              <p className="text-sm text-gray-500 mb-1">Field: {edu.field}</p>
                            )}
                            <p className="text-sm text-gray-500 mb-3">
                              {edu.startDate} - {edu.endDate || 'Present'}
                            </p>
                            {edu.grade && (
                              <p className="text-sm text-blue-600 mb-3">Grade: {edu.grade}</p>
                            )}
                            {edu.description && (
                              <p className="text-sm text-gray-700">{edu.description}</p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="p-6 text-center">
                    <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">
                      No Education Added
                    </h3>
                    <p className="text-gray-500 mb-4">
                      Add your educational background
                    </p>
                    <Button onClick={() => router.push("/dashboard/profile/edit")}>Add Education</Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="documents" className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">My Documents</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push("/dashboard/profile/edit")}
                >
                  Manage Documents
                </Button>
              </div>

              <div className="space-y-4">
                {user?.documentLink ? (
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                          <FileText className="h-6 w-6 text-primary" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-lg">Verification Document</h4>
                          <p className="text-gray-600 mb-1">{getFileInfo(user.documentLink).name}</p>
                          <p className="text-sm text-gray-500">
                            Uploaded for account verification
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewDocument(user.documentLink)}
                            className="gap-2"
                          >
                            <Eye className="h-4 w-4" />
                            View
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownloadDocument(
                              user.documentLink, 
                              `${user.firstName}_${user.lastName}_verification_document`
                            )}
                            className="gap-2"
                          >
                            <Download className="h-4 w-4" />
                            Download
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardContent className="p-6 text-center">
                      <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">
                        No Documents Uploaded
                      </h3>
                      <p className="text-gray-500 mb-4">
                        Upload your verification documents to complete your profile
                      </p>
                      <Button onClick={() => router.push("/dashboard/profile/edit")}>
                        Upload Document
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            <TabsContent value="activity" className="space-y-4">
              <Card>
                <CardContent className="p-6 text-center">
                  <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    No Recent Activity
                  </h3>
                  <p className="text-gray-500">
                    Your recent posts and interactions will appear here
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="awards" className="space-y-4">
              {awards.length > 0 ? (
                <div className="grid gap-4">
                  {awards.map((award, index) => (
                    <Card key={award.id || index}>
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold">{award.title}</h3>
                            <p className="text-gray-600 mb-1">{award.organization || award.issuer}</p>
                            <p className="text-sm text-gray-500 mb-3">{award.date}</p>
                            {award.description && (
                              <p className="text-sm text-gray-700">{award.description}</p>
                            )}
                          </div>
                          <Star className="h-6 w-6 text-yellow-500" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="p-6 text-center">
                    <Star className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">
                      No Awards Added
                    </h3>
                    <p className="text-gray-500 mb-4">
                      Showcase your achievements and awards
                    </p>
                    <Button onClick={() => router.push("/dashboard/profile/edit")}>Add Award</Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
