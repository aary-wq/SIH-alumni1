'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../hooks/useAuth'
import { Button } from '../../../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card'
import { Input } from '../../../components/ui/input'
import { Label } from '../../../components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select'
import Threads from '../../../components/Threads'
import { GraduationCap, User, Mail, Lock, Building, Phone, ArrowRight, Shield, Star, Users, Upload, FileText, Calendar } from 'lucide-react'

export default function SignupPage() {
  const router = useRouter()
  const { signup } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [documentError, setDocumentError] = useState<string | null>(null)

  // files
  const [documentFile, setDocumentFile] = useState<File | null>(null)
  const [profileFile, setProfileFile] = useState<File | null>(null) // optional

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    universityName: '',
    role: 'student',
    contactNumber: '',
    graduationYear: '',
    major: ''
  })

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setDocumentError(null)

    try {
      // Manual document validation
      if (!documentFile) {
        setDocumentError("Please upload a document file.")
        setLoading(false)
        return
      }

      // Password validation
      if (formData.password && formData.password.length < 5) {
        setError("Password should be at least 5 characters")
        setLoading(false)
        return
      }

      // Graduation year validation
      if (!formData.graduationYear) {
        setError("Please select your graduation year")
        setLoading(false)
        return
      }

      // Role validation
      if (!formData.role) {
        setError("Please select a role")
        setLoading(false)
        return
      }

      // Prepare FormData
      const formPayload = new FormData()
      Object.entries(formData).forEach(([key, value]) => {
        formPayload.append(key, value as string)
      })
      formPayload.append("documentFile", documentFile)
      formPayload.append("profileUrl", profileFile || "")

      // Call signup
      const res = await signup(formPayload)

      // Redirect on success: alumni should go to public verify flow
      if (res && res.user && res.user.role === 'alumni') {
        router.push('/verify-public')
      } else {
        router.push('/dashboard')
      }
    } catch (err: any) {
      setError(err.message || "Signup failed")
    } finally {
      setLoading(false)
    }
  }


  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 relative overflow-hidden">
      {/* Threads Background */}
      <div className="fixed inset-0 z-0 opacity-100 pointer-events-none">
        <Threads 
          color={[0.0, 0.12, 1.0]}
          amplitude={3.2}
          distance={1.5}
          enableMouseInteraction={true}
        />
        {/* Floating blobs */}
        <div className="blob-soft bg-[#2546d3] left-10 top-20 w-[420px] h-[420px]" />
        <div className="blob-soft bg-[#1b3bb8] right-16 bottom-8 w-[320px] h-[320px]" />
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex">
        {/* Left Side - Branding */}
        <div className="hidden lg:flex lg:w-2/5 bg-gradient-to-br from-blue-600/10 via-white/95 to-purple-600/10 dark:from-blue-900/20 dark:via-gray-900/95 dark:to-purple-900/20 backdrop-blur-sm border-r border-white/20 dark:border-gray-700/50 items-center justify-center p-12 fixed left-0 top-0 h-screen">
          <div className="max-w-md text-center">
            {/* Logo */}
            <div className="flex items-center justify-center gap-3 mb-8">
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-xl">
                  <GraduationCap className="h-8 w-8 text-white" />
                </div>
                <div className="absolute -inset-1 bg-gradient-to-br from-blue-600/20 to-purple-600/20 rounded-2xl blur opacity-60 animate-pulse"></div>
              </div>
              <div className="flex flex-col">
                <span className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  GradNet
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400 -mt-1">Alumni Network</span>
              </div>
            </div>

            {/* Welcome Message */}
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Join Your Alumni Network
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
              Create your account and connect with verified alumni through our secure, blockchain-powered platform.
            </p>

            {/* Features */}
            <div className="space-y-4 text-left">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                  <Shield className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Secure Verification</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Blockchain-powered document verification</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                  <Users className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Global Network</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Connect with verified alumni worldwide</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                  <Star className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Career Opportunities</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Access exclusive jobs and mentorship</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Signup Form */}
        <div className="w-full lg:w-3/5 lg:ml-[40%] overflow-y-auto">
          <div className="min-h-screen flex items-start justify-center p-6 lg:p-12 py-8">
            <div className="w-full max-w-xl">
            {/* Mobile Logo */}
            <div className="lg:hidden text-center mb-8">
              <Link href="/" className="inline-flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <GraduationCap className="h-6 w-6 text-white" />
                </div>
                <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  GradNet
                </span>
              </Link>
            </div>

            {/* Signup Card */}
            <Card className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border border-white/20 dark:border-gray-700/50 shadow-2xl rounded-3xl overflow-hidden">
              <CardHeader className="text-center pb-6">
                <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                  Create Account
                </CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-300">
                  Join the most trusted alumni network worldwide
                </CardDescription>
              </CardHeader>
              <CardContent className="px-8 pb-8">
                {/* Demo Data Button */}
                <div className="mb-6">
                  <button
                    type="button"
                    onClick={() => setFormData({
                      firstName: 'Arnav',
                      lastName: 'Sharma',
                      email: 'arnav@gmail.com',
                      password: 'demo123',
                      universityName: 'IIT Delhi',
                      role: 'alumni',
                      contactNumber: '9876543210',
                      graduationYear: '2020',
                      major: 'Computer Science'
                    })}
                    className="w-full p-3 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white font-medium rounded-xl transition-all duration-200 transform hover:scale-[1.02] shadow-lg hover:shadow-xl"
                  >
                    🎯 Fill Demo Data (Arnav Sharma - IIT Delhi)
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">

                  {/* Name Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        First Name
                      </Label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <Input
                          id="firstName"
                          placeholder="Enter first name"
                          className="pl-12 h-12 bg-white/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                          value={formData.firstName}
                          onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Last Name
                      </Label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <Input
                          id="lastName"
                          placeholder="Enter last name"
                          className="pl-12 h-12 bg-white/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                          value={formData.lastName}
                          onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Email Address
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="Enter your email address"
                        className="pl-12 h-12 bg-white/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Password
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <Input
                        id="password"
                        type="password"
                        placeholder="Create a secure password"
                        className="pl-12 h-12 bg-white/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  {/* University */}
                  <div className="space-y-2">
                    <Label htmlFor="universityName" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      University
                    </Label>
                    <div className="relative">
                      <Building className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <Input
                        id="universityName"
                        placeholder="Enter your university"
                        className="pl-12 h-12 bg-white/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        value={formData.universityName}
                        onChange={(e) => setFormData({ ...formData, universityName: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  {/* Role */}
                  <div className="space-y-2">
                    <Label htmlFor="role" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Role
                    </Label>
                    <Select
                      value={formData.role}
                      onValueChange={(value) => setFormData({ ...formData, role: value })}
                    >
                      <SelectTrigger className="h-12 bg-white/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200">
                        <SelectValue placeholder="Select your role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="student">Student</SelectItem>
                        <SelectItem value="alumni">Alumni</SelectItem>
                        <SelectItem value="employer">Employer</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Contact Number */}
                  <div className="space-y-2">
                    <Label htmlFor="contactNumber" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Contact Number
                    </Label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <Input
                        id="contactNumber"
                        type="tel"
                        required
                        placeholder="Enter your contact number"
                        className="pl-12 h-12 bg-white/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        value={formData.contactNumber}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, "").slice(0, 10);
                          setFormData({ ...formData, contactNumber: val });
                        }}
                        pattern="\d{10}"
                        maxLength={10}
                      />
                    </div>
                  </div>

                  {/* Document Upload */}
                  <div className="space-y-2">
                    <Label htmlFor="documentLink" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Upload Document (Marksheet)
                    </Label>
                    <div className="relative">
                      <div className="flex items-center h-12 bg-white/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-600 rounded-xl overflow-hidden transition-all duration-200 hover:border-blue-400">
                        <label
                          htmlFor="documentLink"
                          className="cursor-pointer bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 h-full flex items-center hover:from-blue-700 hover:to-purple-700 transition-all duration-200"
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          Choose File
                        </label>
                        <div className="w-px h-6 bg-gray-300 dark:bg-gray-600"></div>
                        <span className="pl-4 text-gray-600 dark:text-gray-400 text-sm truncate flex-1">
                          {documentFile ? documentFile.name : "No file chosen"}
                        </span>
                      </div>
                      <Input
                        id="documentLink"
                        type="file"
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            setDocumentFile(e.target.files[0])
                            setDocumentError(null)
                          }
                        }}
                      />
                    </div>
                    {documentError && <p className="text-sm text-red-500">{documentError}</p>}
                  </div>

                  {/* Profile Picture Upload (Optional) */}
                  <div className="space-y-2">
                    <Label htmlFor="profileUrl" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Upload Profile Picture <span className="text-gray-400">(optional)</span>
                    </Label>
                    <div className="relative">
                      <div className="flex items-center h-12 bg-white/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-600 rounded-xl overflow-hidden transition-all duration-200 hover:border-purple-400">
                        <label
                          htmlFor="profileUrl"
                          className="cursor-pointer bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 h-full flex items-center hover:from-purple-700 hover:to-pink-700 transition-all duration-200"
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          Choose File
                        </label>
                        <div className="w-px h-6 bg-gray-300 dark:bg-gray-600"></div>
                        <span className="pl-4 text-gray-600 dark:text-gray-400 text-sm truncate flex-1">
                          {profileFile ? profileFile.name : "No file chosen"}
                        </span>
                      </div>
                      <Input
                        id="profileUrl"
                        type="file"
                        accept=".jpg,.jpeg,.png"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            setProfileFile(e.target.files[0])
                          }
                        }}
                      />
                    </div>
                  </div>

                  {/* Graduation Year + Major */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Graduation Year
                      </Label>
                      <Select
                        onValueChange={(value) => setFormData({ ...formData, graduationYear: value })}
                      >
                        <SelectTrigger className="h-12 bg-white/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200">
                          <Calendar className="h-5 w-5 text-gray-400 mr-2" />
                          <SelectValue placeholder="Select year" />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 30 }, (_, i) => 2024 - i).map(year => (
                            <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="major" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Major
                      </Label>
                      <div className="relative">
                        <GraduationCap className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <Input
                          id="major"
                          placeholder="Enter your major"
                          className="pl-12 h-12 bg-white/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                          value={formData.major}
                          onChange={(e) => setFormData({ ...formData, major: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Error Message */}
                  {error && (
                    <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                      <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                    </div>
                  )}

                  {/* Submit Button */}
                  <Button 
                    type="submit" 
                    className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5" 
                    disabled={loading}
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                        Creating Account...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span>Create Account</span>
                        <ArrowRight className="h-4 w-4" />
                      </div>
                    )}
                  </Button>

                  {/* Divider */}
                  <div className="flex items-center my-6">
                    <div className="flex-grow border-t border-gray-200 dark:border-gray-700"></div>
                    <span className="px-4 text-sm text-gray-500 dark:text-gray-400">or continue with</span>
                    <div className="flex-grow border-t border-gray-200 dark:border-gray-700"></div>
                  </div>

                  {/* Social Login Buttons */}
                  <div className="flex gap-4 justify-center">
                    <button
                      type="button"
                      className="w-12 h-12 flex items-center justify-center rounded-xl border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 hover:bg-white dark:hover:bg-gray-700 transition-all duration-200 hover:shadow-md"
                    >
                      <img src="/google-icon.svg" alt="Google" className="w-5 h-5" />
                    </button>
                    <button
                      type="button"
                      className="w-12 h-12 flex items-center justify-center rounded-xl border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 hover:bg-white dark:hover:bg-gray-700 transition-all duration-200 hover:shadow-md"
                    >
                      <img src="/LinkedIn_icon.svg.png" alt="LinkedIn" className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Login Link */}
                  <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-6">
                    Already have an account?{' '}
                    <Link 
                      href="/auth/login" 
                      className="font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors duration-200"
                    >
                      Sign in here
                    </Link>
                  </p>
                </form>
              </CardContent>
            </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
