"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  MapPin, 
  Clock, 
  DollarSign, 
  Search, 
  Filter, 
  Briefcase, 
  Plus,
  Building,
  Users,
  Calendar,
  Star,
  X,
  Trash2,
  Edit,
  MoreVertical
} from "lucide-react";
import { useAuth } from "@/app/hooks/useAuth";

interface Job {
  _id: string;
  title: string;
  description: string;
  company: string;
  location: string;
  jobType: string;
  salaryRange?: {
    min: number;
    max: number;
    currency: string;
  };
  requiredSkills: Array<{
    name: string;
    level: number;
  }>;
  requirements?: string;
  benefits?: string;
  applicationDeadline?: string;
  postedBy: {
    _id: string;
    firstName: string;
    lastName: string;
    profileUrl?: string;
  };
  applicants: Array<any>;
  createdAt: string;
  isActive: boolean;
}

interface JobFormData {
  title: string;
  description: string;
  company: string;
  location: string;
  jobType: string;
  salaryMin: string;
  salaryMax: string;
  requiredSkills: Array<{ name: string; level: number }>;
  requirements: string;
  benefits: string;
  applicationDeadline: string;
}

export default function JobsPage() {
  const authContext = useAuth();
  const user = (authContext as any)?.user;
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    show: boolean;
    jobId: string;
    jobTitle: string;
    applicationsCount: number;
  }>({ show: false, jobId: "", jobTitle: "", applicationsCount: 0 });

  const [formData, setFormData] = useState<JobFormData>({
    title: "",
    description: "",
    company: "",
    location: "",
    jobType: "Full-time",
    salaryMin: "",
    salaryMax: "",
    requiredSkills: [],
    requirements: "",
    benefits: "",
    applicationDeadline: ""
  });

  const [newSkill, setNewSkill] = useState({ name: "", level: 50 });

  useEffect(() => {
    fetchJobs();
  }, [currentPage, searchTerm, filterType]);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "10"
      });

      if (searchTerm) params.append("search", searchTerm);
      if (filterType) params.append("jobType", filterType);

      const response = await fetch(`http://localhost:4000/api/users/jobs?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setJobs(data.jobs);
        setTotalPages(data.totalPages);
      }
    } catch (error) {
      console.error("Error fetching jobs:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      
      const jobData = {
        ...formData,
        salaryRange: formData.salaryMin && formData.salaryMax ? {
          min: parseInt(formData.salaryMin),
          max: parseInt(formData.salaryMax),
          currency: "USD"
        } : undefined,
        applicationDeadline: formData.applicationDeadline || undefined
      };

      const response = await fetch("http://localhost:4000/api/users/jobs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(jobData),
      });

      if (response.ok) {
        alert("Job posted successfully!");
        setShowCreateForm(false);
        setFormData({
          title: "",
          description: "",
          company: "",
          location: "",
          jobType: "Full-time",
          salaryMin: "",
          salaryMax: "",
          requiredSkills: [],
          requirements: "",
          benefits: "",
          applicationDeadline: ""
        });
        fetchJobs();
      } else {
        const error = await response.json();
        alert(error.message || "Failed to create job");
      }
    } catch (error) {
      console.error("Error creating job:", error);
      alert("Failed to create job");
    }
  };

  const handleApplyJob = async (jobId: string) => {
    try {
      const token = localStorage.getItem("token");
      
      const response = await fetch(`http://localhost:4000/api/users/jobs/${jobId}/apply`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        alert("Application submitted successfully!");
        fetchJobs(); // Refresh to update applicant count
      } else {
        const error = await response.json();
        alert(error.message || "Failed to apply");
      }
    } catch (error) {
      console.error("Error applying for job:", error);
      alert("Failed to apply for job");
    }
  };

  const handleDeleteJob = async (jobId: string, forceDelete = false) => {
    try {
      const token = localStorage.getItem("token");
      
      const response = await fetch(`http://localhost:4000/api/users/jobs/${jobId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ forceDelete }),
      });

      let data = null;
      try {
        data = await response.json();
      } catch (parseErr) {
        // Could be HTML (server error page) or empty response; capture text for debugging
        const text = await response.text();
        console.warn('Non-JSON response when deleting job:', text);
        data = { message: text };
      }

      if (response.ok) {
        alert("Job deleted successfully!");
        setDeleteConfirm({ show: false, jobId: "", jobTitle: "", applicationsCount: 0 });
        fetchJobs(); // Refresh the job list
      } else if (data && data.requiresConfirmation) {
        // Show confirmation dialog for jobs with applications
        setDeleteConfirm({
          show: true,
          jobId: jobId,
          jobTitle: data.jobTitle || "this job",
          applicationsCount: data.applicationsCount || 0
        });
      } else {
        alert((data && data.message) || "Failed to delete job");
      }
    } catch (error) {
      console.error("Error deleting job:", error);
      alert("Failed to delete job");
    }
  };

  const confirmDelete = () => {
    handleDeleteJob(deleteConfirm.jobId, true);
  };

  const addSkill = () => {
    if (newSkill.name.trim()) {
      setFormData(prev => ({
        ...prev,
        requiredSkills: [...prev.requiredSkills, { ...newSkill }]
      }));
      setNewSkill({ name: "", level: 50 });
    }
  };

  const removeSkill = (index: number) => {
    setFormData(prev => ({
      ...prev,
      requiredSkills: prev.requiredSkills.filter((_, i) => i !== index)
    }));
  };

  const formatSalary = (job: Job) => {
    if (job.salaryRange) {
      return `$${job.salaryRange.min.toLocaleString()} - $${job.salaryRange.max.toLocaleString()}`;
    }
    return "Salary not specified";
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "1 day ago";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} week(s) ago`;
    return `${Math.floor(diffDays / 30)} month(s) ago`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Jobs</h1>
          <p className="text-muted-foreground mt-1">
            {user?.role === 'alumni' ? 'Post jobs and find talented students' : 'Find your next opportunity'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search jobs..." 
              className="pl-10 w-64"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select 
            className="px-3 py-2 border rounded-md"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="">All Types</option>
            <option value="Full-time">Full-time</option>
            <option value="Part-time">Part-time</option>
            <option value="Contract">Contract</option>
            <option value="Internship">Internship</option>
            <option value="Freelance">Freelance</option>
          </select>
          {user?.role === 'alumni' && (
            <Button onClick={() => setShowCreateForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Post Job
            </Button>
          )}
        </div>
      </div>

      {/* Create Job Form */}
      {showCreateForm && user?.role === 'alumni' && (
        <Card className="border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Post a New Job</h2>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    // fill demo data
                    const deadline = new Date();
                    deadline.setDate(deadline.getDate() + 30);
                    setFormData({
                      title: "Frontend Engineer (Alumni Referral)",
                      description:
                        "Looking for an experienced frontend engineer to build responsive web applications. Familiarity with React and modern tooling required.",
                      company: "DemoTech Solutions",
                      location: "Pune, India",
                      jobType: "Full-time",
                      salaryMin: "50000",
                      salaryMax: "120000",
                      requiredSkills: [
                        { name: "React", level: 80 },
                        { name: "Node.js", level: 75 },
                        { name: "Python", level: 85 }
                      ],
                      requirements: "3+ years experience in frontend development. Strong communication skills.",
                      benefits: "Health insurance, flexible hours, remote options.",
                      applicationDeadline: deadline.toISOString().slice(0, 10)
                    });
                    setNewSkill({ name: "", level: 50 });
                  }}
                >
                  Fill Demo Data
                </Button>

                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setShowCreateForm(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <form onSubmit={handleCreateJob} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Job Title*</label>
                  <Input
                    required
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g. Senior Software Engineer"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Company*</label>
                  <Input
                    required
                    value={formData.company}
                    onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                    placeholder="e.g. Tech Corp"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Location*</label>
                  <Input
                    required
                    value={formData.location}
                    onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                    placeholder="e.g. San Francisco, CA"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Job Type*</label>
                  <select 
                    required
                    className="w-full px-3 py-2 border rounded-md"
                    value={formData.jobType}
                    onChange={(e) => setFormData(prev => ({ ...prev, jobType: e.target.value }))}
                  >
                    <option value="Full-time">Full-time</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Contract">Contract</option>
                    <option value="Internship">Internship</option>
                    <option value="Freelance">Freelance</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Application Deadline</label>
                  <Input
                    type="date"
                    value={formData.applicationDeadline}
                    onChange={(e) => setFormData(prev => ({ ...prev, applicationDeadline: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Salary Range (USD)</label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      placeholder="Min"
                      value={formData.salaryMin}
                      onChange={(e) => setFormData(prev => ({ ...prev, salaryMin: e.target.value }))}
                    />
                    <span>-</span>
                    <Input
                      type="number"
                      placeholder="Max"
                      value={formData.salaryMax}
                      onChange={(e) => setFormData(prev => ({ ...prev, salaryMax: e.target.value }))}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Description*</label>
                <Textarea
                  required
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe the job role, responsibilities, and what you're looking for..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Required Skills</label>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="Skill name"
                      value={newSkill.name}
                      onChange={(e) => setNewSkill(prev => ({ ...prev, name: e.target.value }))}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                    />
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      placeholder="Level (0-100)"
                      className="w-32"
                      value={newSkill.level}
                      onChange={(e) => setNewSkill(prev => ({ ...prev, level: parseInt(e.target.value) || 0 }))}
                    />
                    <Button type="button" onClick={addSkill} size="sm">
                      Add
                    </Button>
                  </div>
                  
                  {formData.requiredSkills.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {formData.requiredSkills.map((skill, index) => (
                        <Badge key={index} variant="secondary" className="flex items-center gap-1">
                          {skill.name} ({skill.level})
                          <X 
                            className="h-3 w-3 cursor-pointer" 
                            onClick={() => removeSkill(index)}
                          />
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Requirements</label>
                <Textarea
                  rows={3}
                  value={formData.requirements}
                  onChange={(e) => setFormData(prev => ({ ...prev, requirements: e.target.value }))}
                  placeholder="List the qualifications, experience, and other requirements..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Benefits</label>
                <Textarea
                  rows={3}
                  value={formData.benefits}
                  onChange={(e) => setFormData(prev => ({ ...prev, benefits: e.target.value }))}
                  placeholder="Describe the benefits, perks, and what makes this opportunity great..."
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setShowCreateForm(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  Post Job
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Jobs List */}
      {loading ? (
        <div className="text-center py-8">Loading jobs...</div>
      ) : jobs.length === 0 ? (
        <div className="text-center py-8">
          <Briefcase className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="text-muted-foreground">No jobs found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {jobs.map((job) => (
            <Card key={job._id} className="border border-gray-200 hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Building className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-lg text-gray-900 mb-1">
                            {job.title}
                          </h3>
                          <p className="text-sm text-gray-600 mb-2">{job.company}</p>
                        </div>
                        <Badge variant={job.isActive ? "default" : "secondary"}>
                          {job.isActive ? "Active" : "Closed"}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-4 mb-3 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          <span>{job.location}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Briefcase className="h-4 w-4" />
                          <span>{job.jobType}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4" />
                          <span>{formatSalary(job)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>{formatDate(job.createdAt)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          <span>{job.applicants.length} applicants</span>
                        </div>
                      </div>

                      <p className="text-sm text-gray-700 mb-3 line-clamp-2">
                        {job.description}
                      </p>

                      {job.requiredSkills.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {job.requiredSkills.slice(0, 5).map((skill, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {skill.name}
                            </Badge>
                          ))}
                          {job.requiredSkills.length > 5 && (
                            <Badge variant="outline" className="text-xs">
                              +{job.requiredSkills.length - 5} more
                            </Badge>
                          )}
                        </div>
                      )}

                      <div className="text-xs text-gray-500">
                        Posted by {job.postedBy.firstName} {job.postedBy.lastName}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 ml-4">
                    <Button variant="outline" size="sm" className="border-gray-300">
                      View Details
                    </Button>
                    {(authContext as any)?.user?._id === job.postedBy._id && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDeleteJob(job._id)}
                        className="border-red-300 text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                    {user?.role === 'student' && job.isActive && (
                      <Button 
                        size="sm"
                        onClick={() => handleApplyJob(job._id)}
                        className="bg-primary hover:bg-primary/90"
                      >
                        Apply Now
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              <Button
                variant="outline"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <span className="px-4 py-2 text-sm">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Confirm Job Deletion</h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to delete "{deleteConfirm.jobTitle}"?
              {deleteConfirm.applicationsCount > 0 && (
                <span className="block mt-2 text-orange-600 font-medium">
                  Warning: This job has {deleteConfirm.applicationsCount} applications that will be lost.
                </span>
              )}
            </p>
            <div className="flex gap-3 justify-end">
              <Button 
                variant="outline" 
                onClick={() => setDeleteConfirm({ show: false, jobId: "", jobTitle: "", applicationsCount: 0 })}
              >
                Cancel
              </Button>
              <Button 
                variant="destructive"
                onClick={confirmDelete}
              >
                Delete Job
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}