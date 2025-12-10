"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Threads from "@/components/Threads";
import Reveal from "@/components/Reveal";
import { useState, useEffect } from "react";
import {
  GraduationCap,
  Users,
  MessageCircle,
  Calendar,
  TrendingUp,
  Star,
  ArrowRight,
  ArrowLeft,
  Menu,
  Moon,
  Briefcase,
  Shield,
  Brain,
  Search,
  FileText,
  Sun,
  Zap,
} from "lucide-react";

export default function LandingPage() {
  const [currentFeature, setCurrentFeature] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const features = [
    {
      icon: Shield,
      title: "Blockchain Document Verification",
      description: "Secure, immutable verification system using blockchain technology and smart contracts for authentic alumni credentials",
      gradient: "from-blue-500 to-cyan-500",
      animation: "animate-icon-glow",
      tags: ["Blockchain", "Secure", "Immutable"]
    },
    {
      icon: Search,
      title: "Web Scraping for Alumni Data",
      description: "Advanced web scraping algorithms to automatically gather and verify alumni information from multiple sources",
      gradient: "from-green-500 to-emerald-500",
      animation: "animate-icon-bounce",
      tags: ["Automated", "Smart", "Efficient"]
    },
    {
      icon: Brain,
      title: "AI Agent Calling System",
      description: "Intelligent AI agents for automated scheduling, career counseling, and personalized networking assistance",
      gradient: "from-orange-500 to-red-500",
      animation: "animate-icon-spin",
      tags: ["AI-Powered", "Intelligent", "24/7"]
    },
    {
      icon: Calendar,
      title: "Story Timeline with AI",
      description: "Immutable professional journey tracking with AI-driven insights",
      gradient: "from-indigo-500 to-purple-500",
      animation: "animate-icon-float",
      tags: ["Timeline", "AI-Driven", "Journey"]
    },
    {
      icon: Users,
      title: "Blockchain-Based Payments",
      description: "Secure, transparent payment system for mentorship, events, and premium services using cryptocurrency",
      gradient: "from-teal-500 to-blue-500",
      animation: "animate-icon-float",
      tags: [ "Transparent", "Fast"]
    },
    {
      icon: MessageCircle,
      title: "Real Interview Experiences",
      description: "Authentic interview experiences and insights shared by verified alumni with immersive storytelling",
      gradient: "from-rose-500 to-pink-500",
      animation: "animate-icon-glow",
      tags: ["Authentic", "Stories", "Verified"]
    },
    {
      icon: Star,
      title: "Networking",
      description: "Smart networking recommendations and relationship mapping powered by machine learning algorithms",
      gradient: "from-yellow-500 to-orange-500",
      animation: "animate-icon-spin",
      tags: ["ML-Powered", "Smart", "Connected"]
    },
    {
      icon: Briefcase,
      title: "Job Portal with Smart Matching",
      description: "Intelligent job matching system that connects alumni with opportunities based on skills and preferences",
      gradient: "from-purple-500 to-indigo-500",
      animation: "animate-icon-bounce",
      tags: ["Matching", "Opportunities", "Career"]
    },
  ];

  // Auto-cycle through features
  useEffect(() => {
    const interval = setInterval(() => {
      goToNext();
    },7000);

    return () => clearInterval(interval);
  }, [currentFeature]);

  const goToNext = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentFeature((prev) => (prev + 1) % features.length);
      setIsTransitioning(false);
    }, 300);
  };

  const goToPrevious = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentFeature((prev) => (prev - 1 + features.length) % features.length);
      setIsTransitioning(false);
    }, 300);
  };

  const currentFeatureData = features[currentFeature];
  const nextFeatureData = features[(currentFeature + 1) % features.length];
  const CurrentIcon = currentFeatureData.icon;

  const testimonials = [
    {
      name: "Sarah Chen",
      role: "Software Engineer at Google",
      batch: "MIT Class of 2018",
      content:
        "GradNet helped me find an amazing mentor who guided my career transition into tech.",
      rating: 5,
    },
    {
      name: "Michael Rodriguez",
      role: "Entrepreneur",
      batch: "Stanford Class of 2015",
      content:
        "Through the platform, I found co-founders for my startup and investors from our alumni network.",
      rating: 5,
    },
    {
      name: "Sakshi Sonawane",
      role: "Data Scientist at Netflix",
      batch: "UC Berkeley Class of 2019",
      content:
        "The mentorship program connected me with industry leaders. I got my dream job thanks to referrals.",
      rating: 5,
    },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 relative">
      {/* Threads Background */}
      <div className="fixed inset-0 z-0 opacity-100 pointer-events-none">
        <Threads 
          color={[0.0, 0.12, 1.0]}
          amplitude={3.2}
          distance={1.5}
          enableMouseInteraction={true}
        />

        {/* soft floating blobs for additional color depth */}
        <div className="blob-soft bg-[#2546d3] left-10 top-20 w-[420px] h-[420px]" />
        <div className="blob-soft bg-[#1b3bb8] right-16 bottom-8 w-[320px] h-[320px]" />
      </div>
      
      {/* Content */}
      <div className="relative z-10">
        {/* Enhanced Navigation */}
        <nav className="sticky top-0 z-50 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border-b border-gray-200/20 dark:border-gray-800/20 shadow-lg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-18">
              {/* Logo Section */}
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg transform hover:scale-105 transition-all duration-300">
                    <GraduationCap className="h-6 w-6 text-white" />
                  </div>
                  <div className="absolute -inset-1 bg-gradient-to-br from-blue-600/20 to-purple-600/20 rounded-xl blur opacity-60 animate-pulse"></div>
                </div>
                <div className="flex flex-col">
                  <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    GradNet
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 -mt-1">Alumni Network</span>
                </div>
              </div>
              
              {/* Navigation Links */}
              <div className="hidden md:flex items-center gap-1">
                <Link href="/dashboard">
                  <Button variant="ghost" size="sm" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-300">
                    <Users className="h-4 w-4 mr-2" />
                    Dashboard
                  </Button>
                </Link>
             
                
                {/* Separator */}
                <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-3"></div>
                
                {/* Auth Buttons */}
                <Link href="/auth/login">
                  <Button variant="ghost" size="sm" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-300">
                    Sign In
                  </Button>
                </Link>
                <Link href="/auth/signup">
                  <Button size="sm" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300">
                    <Star className="h-4 w-4 mr-2" />
                    Join Network
                  </Button>
                </Link>
              </div>
              
              {/* Mobile Menu */}
              <div className="md:hidden">
                <Button variant="ghost" size="sm" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-300">
                  <Menu className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                </Button>
              </div>
            </div>
          </div>
        </nav>

        {/* Single Page Landing with Integrated Features */}
        <section className="relative min-h-screen overflow-hidden bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
          
          {/* Main Content Container */}
          <div className="relative z-20 h-screen flex items-center justify-center">
            <div className="max-w-7xl mx-auto px-4 w-full">
              
              {/* Hero Section - Left Side */}
              <div className="grid lg:grid-cols-2 gap-16 items-center">
                <div className="text-left">
                  <Reveal>
                    <div className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500/10 to-purple-500/10 backdrop-blur-sm rounded-full mb-8 border border-blue-200/30">
                      <Star className="h-5 w-5 text-blue-600 animate-pulse" />
                      <span className="text-sm font-semibold text-blue-700 dark:text-blue-400">Revolutionary Technology</span>
                    </div>
                    
                    <h1 className="text-6xl md:text-7xl font-bold mb-6 leading-tight">
                      <span className="text-gray-900 dark:text-white">GradNet</span>
                      <br />
                      <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent animate-gradient">
                       Student-Alumni Network
                      </span>
                    </h1>
                  </Reveal>

                  <Reveal>
                    <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-lg leading-relaxed">
                      Revolutionary blockchain-powered alumni networking with AI-driven insights and secure verification systems.
                    </p>
                  </Reveal>

                  <Reveal>
                    <div className="flex flex-col sm:flex-row gap-4 mb-8">
                      <Link href="/auth/signup">
                        <Button
                          size="lg"
                          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white h-14 px-8 text-lg shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 rounded-xl"
                        >
                          Join Your Alumni Network
                          <ArrowRight className="ml-2 h-5 w-5" />
                        </Button>
                      </Link>
                      <Link href="/auth/login">
                        <Button
                          size="lg"
                          variant="outline"
                          className="h-14 px-8 text-lg border-2 border-blue-200 dark:border-blue-700 backdrop-blur-sm bg-white/90 dark:bg-gray-800/90 hover:bg-blue-50 dark:hover:bg-blue-900/30 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 rounded-xl text-blue-700 dark:text-blue-300"
                        >
                          Sign In to Your Account
                        </Button>
                      </Link>
                    </div>
                  </Reveal>
                  
                  {/* Trust Indicators */}
                  <Reveal>
                    <div className="flex items-center gap-6 text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-green-500" />
                        <span>Blockchain Secured</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Zap className="h-4 w-4 text-yellow-500" />
                        <span>AI Powered</span>
                      </div>
                    
                    </div>
                  </Reveal>
                </div>
                
                {/* Feature Showcase - Right Side */}
                <div className="relative flex items-center justify-center">
                  <div className="relative w-full max-w-2xl">
                    {/* Features Grid with Transparent Cards */}
                    <div className="grid grid-cols-4 gap-6">
                      {features.map((feature, index) => {
                        const FeatureIcon = feature.icon;
                        const isActive = index === currentFeature;
                        return (
                          <div
                            key={index}
                            className="group relative cursor-pointer"
                            onClick={() => setCurrentFeature(index)}
                          >
                            {/* Feature Icon Card */}
                            <div className={`
                              relative w-20 h-20 rounded-2xl backdrop-blur-sm transition-all duration-500 transform
                              ${isActive 
                                ? 'bg-gradient-to-br ' + feature.gradient + ' scale-110 shadow-2xl animate-glow' 
                                : 'bg-white/10 dark:bg-gray-800/10 hover:bg-white/20 dark:hover:bg-gray-800/20 hover:scale-105'
                              }
                              border border-white/20 dark:border-gray-700/30
                              flex items-center justify-center
                              hover:shadow-xl group-hover:animate-float
                            `}>
                              <FeatureIcon className={`
                                h-8 w-8 transition-all duration-500 transform
                                ${isActive 
                                  ? 'text-white animate-pulse scale-110' 
                                  : 'text-gray-600 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:scale-110'
                                }
                                ${feature.animation}
                              `} />
                              
                              {/* Active indicator */}
                              {isActive && (
                                <div className="absolute -inset-1 rounded-2xl border-2 border-white/50 animate-pulse"></div>
                              )}
                            </div>
                            
                            {/* Hover Description Tooltip */}
                            <div className={`
                              absolute left-1/2 transform -translate-x-1/2 w-64 p-4 
                              bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-xl shadow-2xl 
                              border border-white/20 dark:border-gray-700/50
                              opacity-0 group-hover:opacity-100 transition-all duration-300 ease-out pointer-events-none z-50
                              ${isActive ? 'opacity-100' : ''}
                              ${index < 4 
                                ? 'top-full mt-6 translate-y-2 group-hover:translate-y-0' 
                                : 'bottom-full mb-6 translate-y-2 group-hover:translate-y-0'
                              }
                            `}>
                              <div className="text-center">
                                <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-2">
                                  {feature.title}
                                </h4>
                                <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                                  {feature.description}
                                </p>
                                
                                {/* Tags */}
                                <div className="flex flex-wrap gap-1 mt-3 justify-center">
                                  {feature.tags.map((tag, tagIndex) => (
                                    <span 
                                      key={tagIndex}
                                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                                        tagIndex === 0 ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' :
                                        tagIndex === 1 ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300' :
                                        'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                                      }`}
                                    >
                                      {tag}
                                    </span>
                                  ))}
                                </div>
                              </div>
                              
                              {/* Tooltip Arrow */}
                              <div className={`absolute left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-transparent ${
                                index < 4 
                                  ? 'bottom-full border-b-4 border-b-white/95 dark:border-b-gray-800/95' 
                                  : 'top-full border-t-4 border-t-white/95 dark:border-t-gray-800/95'
                              }`}></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    
                    {/* Active Feature Details */}
                    <div className="mt-12 text-center">
                      <div className={`transition-all duration-500 ${isTransitioning ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'}`}>
                        <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                          {currentFeatureData.title}
                        </h3>
                        <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed max-w-lg mx-auto mb-6">
                          {currentFeatureData.description}
                        </p>
                        
                        {/* Navigation Dots */}
                        <div className="flex justify-center gap-2 mb-4">
                          {features.map((_, index) => (
                            <button
                              key={index}
                              onClick={() => setCurrentFeature(index)}
                              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                                index === currentFeature
                                  ? 'bg-blue-600 scale-125 shadow-lg'
                                  : 'bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500 hover:scale-110'
                              }`}
                            />
                          ))}
                        </div>
                        
                        {/* Auto-cycle indicator */}
                        <div className="flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                          <span>Auto-cycling every 5 seconds</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Floating Elements */}
                    <div className="absolute -top-8 -right-8 w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full opacity-60 animate-float" style={{animationDelay: '0s'}} />
                    <div className="absolute -bottom-6 -left-6 w-12 h-12 bg-gradient-to-br from-green-400 to-blue-500 rounded-full opacity-40 animate-float" style={{animationDelay: '2s'}} />
                    <div className="absolute top-1/3 -right-10 w-8 h-8 bg-gradient-to-br from-pink-400 to-purple-500 rounded-full opacity-50 animate-float" style={{animationDelay: '4s'}} />
                    <div className="absolute bottom-1/3 -left-8 w-10 h-10 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full opacity-30 animate-float" style={{animationDelay: '1s'}} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

       

        {/* Feature Details Section */}
        <section className="py-20 bg-gray-50 dark:bg-gray-900">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                Powerful Features for Modern Alumni
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                Experience the next generation of alumni networking with cutting-edge technology and seamless user experience.
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {features.map((feature, index) => {
                const FeatureIcon = feature.icon;
                return (
                  <Reveal key={index}>
                    <div className="group relative cursor-pointer">
                      {/* Transparent Feature Card */}
                      <div className="bg-white/10 dark:bg-gray-800/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 dark:border-gray-700/30 hover:bg-white/20 dark:hover:bg-gray-800/20 transition-all duration-500 transform hover:-translate-y-4 hover:shadow-2xl">
                        <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-4 shadow-lg transition-all duration-500 group-hover:scale-110 group-hover:animate-glow`}>
                          <FeatureIcon className={`h-8 w-8 text-white transition-all duration-500 ${feature.animation} group-hover:scale-110`} />
                        </div>
                        
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 transition-all duration-300 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                          {feature.title}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-300 leading-relaxed opacity-80 group-hover:opacity-100 transition-all duration-300">
                          {feature.description}
                        </p>
                        
                        {/* Hover Description Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/90 to-purple-600/90 backdrop-blur-sm rounded-2xl opacity-0 group-hover:opacity-100 transition-all duration-500 flex items-center justify-center p-6">
                          <div className="text-center text-white transform translate-y-4 group-hover:translate-y-0 transition-all duration-500">
                            <FeatureIcon className="h-12 w-12 mx-auto mb-3 animate-pulse" />
                            <h4 className="text-lg font-bold mb-2">{feature.title}</h4>
                            <p className="text-sm opacity-90 leading-relaxed">{feature.description}</p>
                            <div className="flex gap-2 mt-3 justify-center flex-wrap">
                              {feature.tags.map((tag, tagIndex) => (
                                <span key={tagIndex} className="px-2 py-1 bg-white/20 rounded-full text-xs">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Reveal>
                );
              })}
            </div>
          </div>
        </section>

       

        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600 relative overflow-hidden">
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Ready to Join the Future of Alumni Networking?
            </h2>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Connect with alumni worldwide, unlock career opportunities, and build meaningful professional relationships.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth/signup">
                <Button
                  size="lg"
                  className="bg-white text-blue-600 hover:bg-gray-100 h-14 px-8 text-lg shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 rounded-xl"
                >
                  Get Started Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/auth/login">
                <Button
                  size="lg"
                  variant="outline"
                  className="h-14 px-8 text-lg border-2 border-white text-white hover:bg-white hover:text-blue-600 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 rounded-xl"
                >
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}