"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../hooks/useAuth";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Notification } from "@/components/ui/notification";
import { 
  Save, 
  Camera, 
  FileText, 
  Eye, 
  Plus, 
  Trash2, 
  Building, 
  MapPin,
  Calendar,
  Briefcase,
  Award,
  Link,
  Phone,
  Mail,
  Globe,
  ArrowLeft
} from "lucide-react";

export default function EditProfilePage() {
  const router = useRouter();
  const authContext = useAuth();
  
  if (!authContext) {
    return <div>Loading...</div>;
  }
  
  const { user, editProfile } = authContext;
  
  if (!user) {
    router.push('/auth/login');
    return <div>Redirecting...</div>;
  }

  const [activeTab, setActiveTab] = useState("basic");
  const [notification, setNotification] = useState({
    show: false,
    type: 'info' as 'success' | 'error' | 'info',
    message: ''
  });
  const [isEditing, setIsEditing] = useState(false);

  // Basic Profile Data
  const [basicData, setBasicData] = useState({
    firstName: (user as any)?.firstName || "",
    lastName: (user as any)?.lastName || "",
    email: (user as any)?.email || "",
    contactNumber: (user as any)?.contactNumber || "",
    universityName: (user as any)?.universityName || "",
    graduationYear: (user as any)?.graduationYear || "",
    oldPassword: "",
    newPassword: "",
    profileUrl: null as File | null,
    documentLink: null as File | null,
    about: (user as any)?.about || "Passionate professional with experience in my field. Always eager to learn and contribute to meaningful projects.",
    website: (user as any)?.website || "",
    location: (user as any)?.location || "",
    currentPosition: (user as any)?.currentPosition || "",
    currentCompany: (user as any)?.currentCompany || "",
    openToWork: (user as any)?.openToWork || false,
  });

  // Experience Data
  const [experienceData, setExperienceData] = useState([
    {
      id: 1,
      title: "Senior Software Engineer",
      company: "Google",
      location: "Mountain View, CA",
      startDate: "2023-01",
      endDate: "",
      current: true,
      description: "Leading frontend development for Google Cloud Infrastructure products. Managing a team of 5 engineers and driving technical decisions for scalable React applications.",
      skills: ["React", "TypeScript", "Node.js", "GCP", "Team Leadership"]
    },
    {
      id: 2,
      title: "Software Engineer",
      company: "Meta",
      location: "Menlo Park, CA",
      startDate: "2020-06",
      endDate: "2022-12",
      current: false,
      description: "Developed and maintained React components for Facebook's main platform.",
      skills: ["React", "JavaScript", "GraphQL"]
    }
  ]);

  // Education Data
  const [educationData, setEducationData] = useState([
    {
      id: 1,
      institution: (user as any)?.universityName || "",
      degree: "Bachelor of Technology",
      field: "Computer Science",
      startDate: (user as any)?.graduationYear ? (parseInt((user as any).graduationYear) - 4).toString() : "",
      endDate: (user as any)?.graduationYear || "",
      grade: "8.5 CGPA",
      description: "Focused on software engineering, algorithms, and web technologies."
    }
  ]);

  // Skills Data
  const [skillsData, setSkillsData] = useState([
    { id: 1, name: "React", level: 95 },
    { id: 2, name: "TypeScript", level: 90 },
    { id: 3, name: "Node.js", level: 85 },
    { id: 4, name: "Python", level: 80 },
    { id: 5, name: "AWS", level: 75 },
    { id: 6, name: "Team Leadership", level: 88 }
  ]);

  // Awards Data
  const [awardsData, setAwardsData] = useState([
    {
      id: 1,
      title: "Employee of the Year",
      organization: "Google",
      date: "2023-12",
      description: "Recognized for outstanding performance and leadership in the Cloud Infrastructure team."
    }
  ]);

  const [previewImage, setPreviewImage] = useState(
    (user as any)?.profileUrl && (user as any).profileUrl !== "" 
      ? ((user as any).profileUrl.startsWith('/api/') 
          ? `http://localhost:4000${(user as any).profileUrl}` 
          : (user as any).profileUrl)
      : ""
  );

  // Track editing state
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isEditing) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isEditing]);

  // Helper function to show notifications
  const showNotification = (type: 'success' | 'error' | 'info', message: string) => {
    setNotification({ show: true, type, message });
  };
  // Helper function to handle document viewing with error handling
  const handleViewDocument = async (documentUrl: string) => {
    try {
      const fullUrl = documentUrl.startsWith('/api/') 
        ? `http://localhost:4000${documentUrl}`
        : documentUrl;
      
      const newWindow = window.open(fullUrl, '_blank');
      
      if (!newWindow) {
        showNotification('error', 'Popup blocked. Please allow popups for this site.');
        return;
      }
      
      showNotification('success', 'Document opened in new tab');
    } catch (error) {
      console.error('Error opening document:', error);
      showNotification('error', 'Error opening document. Please contact support if this issue persists.');
    }
  };

  // Handle basic form changes
  const handleBasicChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, files } = e.target as any;
    console.log('Basic form change:', { name, value });
    setIsEditing(true);
    
    if (files) {
      const file = files[0];
      setBasicData({ ...basicData, [name]: file });
      if (name === "profileUrl") {
        setPreviewImage(URL.createObjectURL(file));
      }
    } else {
      setBasicData(prevData => {
        const newData = { ...prevData, [name]: value };
        console.log('New basic data:', newData);
        return newData;
      });
    }
  };

  // Experience handlers
  const addExperience = () => {
    const newExp = {
      id: Date.now(),
      title: "",
      company: "",
      location: "",
      startDate: "",
      endDate: "",
      current: false,
      description: "",
      skills: []
    };
    setExperienceData([...experienceData, newExp]);
  };

  const updateExperience = (id: number, field: string, value: any) => {
    console.log('Updating experience:', { id, field, value });
    setIsEditing(true);
    setExperienceData(prevData => {
      const newData = prevData.map(exp => 
        exp.id === id ? { ...exp, [field]: value } : exp
      );
      console.log('New experience data:', newData);
      return newData;
    });
  };

  const removeExperience = (id: number) => {
    setExperienceData(experienceData.filter(exp => exp.id !== id));
  };

  // Education handlers
  const addEducation = () => {
    const newEdu = {
      id: Date.now(),
      institution: "",
      degree: "",
      field: "",
      startDate: "",
      endDate: "",
      grade: "",
      description: ""
    };
    setEducationData([...educationData, newEdu]);
  };

  const updateEducation = (id: number, field: string, value: any) => {
    console.log('Updating education:', { id, field, value });
    setIsEditing(true);
    setEducationData(prevData => {
      const newData = prevData.map(edu => 
        edu.id === id ? { ...edu, [field]: value } : edu
      );
      console.log('New education data:', newData);
      return newData;
    });
  };

  const removeEducation = (id: number) => {
    setEducationData(educationData.filter(edu => edu.id !== id));
  };

  // Skills handlers
  const addSkill = () => {
    const newSkill = {
      id: Date.now(),
      name: "",
      level: 50
    };
    setSkillsData([...skillsData, newSkill]);
  };

  const updateSkill = (id: number, field: string, value: any) => {
    console.log('Updating skill:', { id, field, value });
    setIsEditing(true);
    setSkillsData(prevData => {
      const newData = prevData.map(skill => 
        skill.id === id ? { ...skill, [field]: value } : skill
      );
      console.log('New skills data:', newData);
      return newData;
    });
  };

  const removeSkill = (id: number) => {
    setSkillsData(skillsData.filter(skill => skill.id !== id));
  };

  // Awards handlers
  const addAward = () => {
    const newAward = {
      id: Date.now(),
      title: "",
      organization: "",
      date: "",
      description: ""
    };
    setAwardsData([...awardsData, newAward]);
  };

  const updateAward = (id: number, field: string, value: any) => {
    setAwardsData(awardsData.map(award => 
      award.id === id ? { ...award, [field]: value } : award
    ));
  };

  const removeAward = (id: number) => {
    setAwardsData(awardsData.filter(award => award.id !== id));
  };

  // Main submit handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!basicData.contactNumber) {
      showNotification('error', "Contact number cannot be empty");
      return;
    }

    if (basicData.newPassword && basicData.newPassword.length < 5) {
      showNotification('error', "Password should be at least 5 characters");
      return;
    }

    const fd = new FormData();
    Object.entries(basicData).forEach(([key, value]) => {
      if (value) fd.append(key, value as any);
    });

    // Add additional data as JSON strings
    fd.append('experience', JSON.stringify(experienceData));
    fd.append('education', JSON.stringify(educationData));
    fd.append('skills', JSON.stringify(skillsData));
    fd.append('awards', JSON.stringify(awardsData));

    try {
      showNotification('info', 'Updating profile...');
      const response = await (editProfile as any)(fd);

      if (response?.message === "Profile Updated Successfully") {
        showNotification('success', response.message);
        setIsEditing(false);
        setTimeout(() => {
          router.push("/dashboard/profile");
        }, 2000);
        return;
      }
      if (response?.message) {
        showNotification('error', response.message);
        return; 
      }
    } catch (err: any) {
      console.error(err);
      showNotification('error', err.message || "Error updating profile");
    }
  };

  // Generate graduation years
  const years = Array.from({ length: 2030 - 1998 + 1 }, (_, i) => 1998 + i);

  return (
    <>
      <Notification
        type={notification.type}
        message={notification.message}
        isVisible={notification.show}
        onClose={() => setNotification({ ...notification, show: false })}
      />
      
      <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => router.push("/dashboard/profile")}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Profile
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Edit Profile</h1>
            <div className="flex items-center gap-2">
              <p className="text-gray-600">Update your information and preferences</p>
              {isEditing && (
                <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                  • Unsaved changes
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline"
            onClick={() => {
              console.log('Current state:');
              console.log('Basic Data:', basicData);
              console.log('Experience Data:', experienceData);
              console.log('Education Data:', educationData);
              console.log('Skills Data:', skillsData);
              console.log('Awards Data:', awardsData);
            }}
          >
            Debug State
          </Button>
          <Button onClick={handleSubmit} className="gap-2" disabled={!isEditing}>
            <Save className="h-4 w-4" />
            {isEditing ? 'Save All Changes' : 'No Changes to Save'}
          </Button>
        </div>
      </div>

      {/* Profile Picture Section */}
      <Card>
        <CardContent className="flex flex-col items-center py-8">
          <Avatar className="h-32 w-32 mb-4">
            {previewImage ? (
              <AvatarImage src={previewImage} alt="Profile" className="object-cover" />
            ) : (
              <AvatarFallback className="text-3xl font-bold">
                {(user as any)?.firstName?.[0]}
                {(user as any)?.lastName?.[0]}
              </AvatarFallback>
            )}
          </Avatar>
          <div className="text-center">
            <Label
              htmlFor="profileUrl"
              className="flex items-center gap-2 text-sm font-medium cursor-pointer text-primary hover:underline"
            >
              <Camera className="h-4 w-4" />
              Change Profile Picture
            </Label>
            <Input
              id="profileUrl"
              type="file"
              name="profileUrl"
              onChange={handleBasicChange}
              className="hidden"
              accept="image/*"
            />
            <p className="text-xs text-gray-500 mt-2">
              Upload a high-quality photo that clearly shows your face
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Tabbed Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="basic">Basic Info</TabsTrigger>
          <TabsTrigger value="experience">Experience</TabsTrigger>
          <TabsTrigger value="education">Education</TabsTrigger>
          <TabsTrigger value="skills">Skills</TabsTrigger>
          <TabsTrigger value="awards">Awards</TabsTrigger>
        </TabsList>

        {/* Basic Information Tab */}
        <TabsContent value="basic" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    value={basicData.firstName}
                    onChange={handleBasicChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    value={basicData.lastName}
                    onChange={handleBasicChange}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="about">About</Label>
                <Textarea
                  id="about"
                  name="about"
                  value={basicData.about}
                  onChange={handleBasicChange}
                  placeholder="Tell us about yourself, your interests, and your professional background..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="currentPosition">Current Position</Label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="currentPosition"
                      name="currentPosition"
                      value={basicData.currentPosition}
                      onChange={handleBasicChange}
                      className="pl-10"
                      placeholder="e.g., Senior Software Engineer"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currentCompany">Current Company</Label>
                  <div className="relative">
                    <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="currentCompany"
                      name="currentCompany"
                      value={basicData.currentCompany}
                      onChange={handleBasicChange}
                      className="pl-10"
                      placeholder="e.g., Google"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="location"
                    name="location"
                    value={basicData.location}
                    onChange={handleBasicChange}
                    className="pl-10"
                    placeholder="e.g., San Francisco, CA"
                  />
                </div>
              </div>

              {(user as any)?.role === 'student' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-4 border rounded-lg bg-green-50 dark:bg-green-900/20">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                        <Briefcase className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <h3 className="font-medium text-green-900 dark:text-green-100">Open to Work</h3>
                        <p className="text-sm text-green-700 dark:text-green-200">
                          Get notified about job opportunities that match your skills
                        </p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={basicData.openToWork}
                        onChange={(e) => {
                          setBasicData({ ...basicData, openToWork: e.target.checked });
                          setIsEditing(true);
                        }}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 dark:peer-focus:ring-green-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-green-600"></div>
                    </label>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    name="email"
                    value={basicData.email}
                    onChange={handleBasicChange}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactNumber">Contact Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="contactNumber"
                    type="tel"
                    name="contactNumber"
                    value={basicData.contactNumber}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "").slice(0, 10);
                      setBasicData({ ...basicData, contactNumber: val });
                    }}
                    className="pl-10"
                    pattern="\d{10}"
                    maxLength={10}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="website">Website/Portfolio</Label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="website"
                    name="website"
                    value={basicData.website}
                    onChange={handleBasicChange}
                    className="pl-10"
                    placeholder="e.g., https://yourwebsite.com"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Education & Security</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="universityName">University</Label>
                <Input
                  id="universityName"
                  name="universityName"
                  value={basicData.universityName}
                  onChange={handleBasicChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="graduationYear">Graduation Year</Label>
                <select
                  id="graduationYear"
                  name="graduationYear"
                  value={basicData.graduationYear}
                  onChange={handleBasicChange}
                  className="w-full border rounded-lg px-3 py-2"
                >
                  <option value="">Select Year</option>
                  {years.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="oldPassword">Current Password</Label>
                  <Input
                    id="oldPassword"
                    type="password"
                    name="oldPassword"
                    value={basicData.oldPassword}
                    onChange={handleBasicChange}
                    placeholder="Enter current password to change"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    name="newPassword"
                    value={basicData.newPassword}
                    onChange={handleBasicChange}
                    placeholder="Enter new password"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="documentLink">Verification Document</Label>
                
                {(user as any)?.documentLink && (
                  <div className="mb-3 p-3 border rounded-lg bg-gray-50 dark:bg-gray-900">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium">Current Document</span>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewDocument((user as any).documentLink)}
                        className="gap-1"
                      >
                        <Eye className="h-3 w-3" />
                        View
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Upload a new file below to replace this document
                    </p>
                  </div>
                )}

                <Input
                  id="documentLink"
                  type="file"
                  name="documentLink"
                  onChange={handleBasicChange}
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                />
                <p className="text-xs text-gray-500">
                  Accepted formats: PDF, DOC, DOCX, JPG, JPEG, PNG
                </p>
              </div>
            </CardContent>
          </Card>
                </TabsContent>

        {/* Experience Tab */}
        <TabsContent value="experience" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Work Experience</CardTitle>
              <div className="flex gap-2">
                <Button 
                  onClick={() => {
                    // Test by updating first experience title
                    if (experienceData.length > 0) {
                      updateExperience(experienceData[0].id, 'title', 'Test Title Updated');
                    }
                  }} 
                  variant="outline" 
                  size="sm"
                >
                  Test Update
                </Button>
                <Button onClick={addExperience} variant="outline" size="sm" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Experience
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {experienceData.map((exp, index) => (
                <div key={exp.id} className="p-4 border rounded-lg space-y-4">
                  <div className="flex justify-between items-start">
                    <h4 className="font-medium">Experience #{index + 1}</h4>
                    <Button
                      onClick={() => removeExperience(exp.id)}
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Job Title</Label>
                      <Input
                        key={`title-${exp.id}`}
                        value={exp.title || ''}
                        onChange={(e) => {
                          console.log(`Updating title for experience ${exp.id}:`, e.target.value);
                          updateExperience(exp.id, 'title', e.target.value);
                        }}
                        placeholder="e.g., Software Engineer"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Company</Label>
                      <Input
                        key={`company-${exp.id}`}
                        value={exp.company || ''}
                        onChange={(e) => {
                          console.log(`Updating company for experience ${exp.id}:`, e.target.value);
                          updateExperience(exp.id, 'company', e.target.value);
                        }}
                        placeholder="e.g., Google"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Location</Label>
                      <Input
                        key={`location-${exp.id}`}
                        value={exp.location || ''}
                        onChange={(e) => updateExperience(exp.id, 'location', e.target.value)}
                        placeholder="e.g., San Francisco, CA"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Start Date</Label>
                      <Input
                        key={`startDate-${exp.id}`}
                        type="month"
                        value={exp.startDate || ''}
                        onChange={(e) => updateExperience(exp.id, 'startDate', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>End Date</Label>
                      <Input
                        key={`endDate-${exp.id}`}
                        type="month"
                        value={exp.endDate || ''}
                        onChange={(e) => updateExperience(exp.id, 'endDate', e.target.value)}
                        disabled={exp.current}
                        placeholder={exp.current ? "Current Position" : ""}
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={`current-${exp.id}`}
                      checked={exp.current}
                      onChange={(e) => {
                        updateExperience(exp.id, 'current', e.target.checked);
                        if (e.target.checked) {
                          updateExperience(exp.id, 'endDate', '');
                        }
                      }}
                    />
                    <Label htmlFor={`current-${exp.id}`}>I currently work here</Label>
                  </div>

                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                      key={`description-${exp.id}`}
                      value={exp.description || ''}
                      onChange={(e) => updateExperience(exp.id, 'description', e.target.value)}
                      placeholder="Describe your role and achievements..."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Skills Used</Label>
                    <Input
                      key={`skills-${exp.id}`}
                      value={Array.isArray(exp.skills) ? exp.skills.join(', ') : ''}
                      onChange={(e) => {
                        const skillsArray = e.target.value.split(',').map(s => s.trim()).filter(s => s);
                        updateExperience(exp.id, 'skills', skillsArray);
                      }}
                      placeholder="e.g., React, TypeScript, Node.js (comma separated)"
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Education Tab */}
        <TabsContent value="education" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Education</CardTitle>
              <Button onClick={addEducation} variant="outline" size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                Add Education
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              {educationData.map((edu, index) => (
                <div key={edu.id} className="p-4 border rounded-lg space-y-4">
                  <div className="flex justify-between items-start">
                    <h4 className="font-medium">Education #{index + 1}</h4>
                    <Button
                      onClick={() => removeEducation(edu.id)}
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Institution</Label>
                      <Input
                        key={`institution-${edu.id}`}
                        value={edu.institution || ''}
                        onChange={(e) => updateEducation(edu.id, 'institution', e.target.value)}
                        placeholder="e.g., Stanford University"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Degree</Label>
                      <Input
                        key={`degree-${edu.id}`}
                        value={edu.degree || ''}
                        onChange={(e) => updateEducation(edu.id, 'degree', e.target.value)}
                        placeholder="e.g., Bachelor of Science"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Field of Study</Label>
                      <Input
                        key={`field-${edu.id}`}
                        value={edu.field || ''}
                        onChange={(e) => updateEducation(edu.id, 'field', e.target.value)}
                        placeholder="e.g., Computer Science"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Start Year</Label>
                      <Input
                        key={`startDate-${edu.id}`}
                        type="number"
                        value={edu.startDate || ''}
                        onChange={(e) => updateEducation(edu.id, 'startDate', e.target.value)}
                        placeholder="2018"
                        min="1990"
                        max="2030"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>End Year</Label>
                      <Input
                        key={`endDate-${edu.id}`}
                        type="number"
                        value={edu.endDate || ''}
                        onChange={(e) => updateEducation(edu.id, 'endDate', e.target.value)}
                        placeholder="2022"
                        min="1990"
                        max="2030"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Grade/CGPA</Label>
                    <Input
                      key={`grade-${edu.id}`}
                      value={edu.grade || ''}
                      onChange={(e) => updateEducation(edu.id, 'grade', e.target.value)}
                      placeholder="e.g., 8.5 CGPA or 85%"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                      key={`description-${edu.id}`}
                      value={edu.description || ''}
                      onChange={(e) => updateEducation(edu.id, 'description', e.target.value)}
                      placeholder="Relevant coursework, projects, achievements..."
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Skills Tab */}
        <TabsContent value="skills" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Skills & Expertise</CardTitle>
              <Button onClick={addSkill} variant="outline" size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                Add Skill
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {skillsData.map((skill) => (
                  <div key={skill.id} className="p-4 border rounded-lg space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="flex-1 space-y-3">
                        <div className="space-y-2">
                          <Label>Skill Name</Label>
                          <Input
                            key={`skill-name-${skill.id}`}
                            value={skill.name || ''}
                            onChange={(e) => updateSkill(skill.id, 'name', e.target.value)}
                            placeholder="e.g., React"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Proficiency Level: {skill.level}%</Label>
                          <input
                            key={`skill-level-${skill.id}`}
                            type="range"
                            min="0"
                            max="100"
                            value={skill.level || 50}
                            onChange={(e) => updateSkill(skill.id, 'level', parseInt(e.target.value))}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                          />
                          <div className="flex justify-between text-xs text-gray-500">
                            <span>Beginner</span>
                            <span>Intermediate</span>
                            <span>Expert</span>
                          </div>
                        </div>
                      </div>
                      <Button
                        onClick={() => removeSkill(skill.id)}
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:text-red-700 ml-2"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Awards Tab */}
        <TabsContent value="awards" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Awards & Achievements</CardTitle>
              <Button onClick={addAward} variant="outline" size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                Add Award
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              {awardsData.map((award, index) => (
                <div key={award.id} className="p-4 border rounded-lg space-y-4">
                  <div className="flex justify-between items-start">
                    <h4 className="font-medium">Award #{index + 1}</h4>
                    <Button
                      onClick={() => removeAward(award.id)}
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Award Title</Label>
                      <Input
                        value={award.title}
                        onChange={(e) => updateAward(award.id, 'title', e.target.value)}
                        placeholder="e.g., Employee of the Year"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Organization</Label>
                      <Input
                        value={award.organization}
                        onChange={(e) => updateAward(award.id, 'organization', e.target.value)}
                        placeholder="e.g., Google"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Date Received</Label>
                    <Input
                      type="month"
                      value={award.date}
                      onChange={(e) => updateAward(award.id, 'date', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                      value={award.description}
                      onChange={(e) => updateAward(award.id, 'description', e.target.value)}
                      placeholder="Describe the award and why you received it..."
                    />
                  </div>
                </div>
              ))}
              
              {awardsData.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Award className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                  <p>No awards added yet</p>
                  <p className="text-sm">Click "Add Award" to showcase your achievements</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Fixed Save Button */}
      <div className="sticky bottom-0 bg-white border-t p-4 flex justify-end gap-4">
        <Button 
          variant="outline" 
          onClick={() => router.push("/dashboard/profile")}
        >
          Cancel
        </Button>
        <Button onClick={handleSubmit} className="gap-2" disabled={!isEditing}>
          <Save className="h-4 w-4" />
          {isEditing ? 'Save All Changes' : 'No Changes to Save'}
        </Button>
      </div>
    </div>
    </>
  );
}
