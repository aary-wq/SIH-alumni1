"use client";

import { useState } from "react";
import React from "react";
import { Button } from "../../components/ui/button";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "../../components/ui/avatar";
import { Badge } from "../../components/ui/badge";
import { Input } from "../../components/ui/input";
import { useAuth } from "../hooks/useAuth";
import { AuthProvider } from "../hooks/useAuth";
import ProtectedRoute from "../../components/ProtectedRoute";
import {
  Home,
  Users,
  MessageCircle,
  Bell,
  Calendar,
  Briefcase,
  Clock,
  Brain,
  Menu,
  Search,
  Settings,
  FileText,
  Gift,
  Heart,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import AvatarDropdown from "@/components/ui/AvtarDropDown";

const getNavigation = (counts: any) => [
  // Core feed/profile actions
  { name: "My Posts", href: "/dashboard/profile/my-posts", icon: FileText },
  {
    name: "Messages",
    href: "/dashboard/messages",
    icon: MessageCircle,
    badge: counts.unreadMessages?.toString(),
  },
  { name: "Jobs", href: "/dashboard/jobs", icon: Briefcase, badge: counts.availableJobs?.toString() },

  // Networking & community
  { name: "My Network", href: "/dashboard/network", icon: Home },
  { name: "Notifications", href: "/dashboard/notifications", icon: Bell, badge: counts.unreadNotifications?.toString() },
  { name: "StoryTimeline", href: "/dashboard/story-timeline", icon: Clock },
  { name: "AI Hub", href: "/dashboard/ai-hub", icon: Brain },

  // Events / directory / mentoring
  { name: "Events", href: "/dashboard/events", icon: Calendar },
  { name: "Directory", href: "/dashboard/directory", icon: Search },
  { name: "Mentorship", href: "/dashboard/mentorship", icon: Gift },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userStats, setUserStats] = useState({
    profileViews: 0,
    connectionCount: 0,
  });
  const [navCounts, setNavCounts] = useState({
    connections: 0,
    unreadMessages: 0,
    unreadNotifications: 0,
    upcomingEvents: 0,
    availableJobs: 0,
  });
  const pathname = usePathname();
  const { user, loading, logout } = useAuth() as any;

  const fetchUserStats = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      
      const res = await fetch(`http://localhost:4000/api/users/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const stats = await res.json();
        setUserStats(stats);
      }
    } catch (error) {
      // Silently fail if backend is not running
      console.warn("Backend not available:", (error as any)?.message ?? error);
    }
  };

  const fetchNavCounts = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      
      const res = await fetch(`http://localhost:4000/api/users/nav-counts`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const counts = await res.json();
        setNavCounts(counts);
      }
    } catch (error) {
      // Silently fail if backend is not running
      console.warn("Backend not available:", (error as any)?.message ?? error);
    }
  };

  React.useEffect(() => {
    if (user) {
      fetchUserStats();
      fetchNavCounts();
      
      // Refresh counts every 30 seconds
      const interval = setInterval(() => {
        fetchNavCounts();
      }, 30000);
      
      return () => clearInterval(interval);
    }
  }, [user]);

  let navigation = getNavigation(navCounts);

  // Feed should be admin-only. If user is admin, add Feed at the top and admin campaigns.
  if (user && user.role === "admin") {
    navigation.unshift({ name: "Feed", href: "/dashboard", icon: Home });
    navigation.push({ name: "Admin Campaigns", href: "/dashboard/admin-campaigns", icon: Gift });

    // For admins we want to remove some items that are only relevant to regular users
    const removeForAdmin = ["My Network", "Notifications", "StoryTimeline", "AI Hub"];
    navigation = navigation.filter((item) => !removeForAdmin.includes(item.name));
  }

  // Show College Development Fund link only for alumni (explicit requirement)
  if (user && user.role === 'alumni') {
    // push near the end so it's visible but not mixed with admin actions
    navigation.push({ name: 'College Fund', href: '/dashboard/college-fund', icon: Heart });
  }
  // show alumni-only link for College Development Fund


  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">


        {/* Header */}
        <header className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden"
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                <Menu className="h-5 w-5" />
              </Button>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">GN</span>
                </div>
                <span className="font-bold text-lg text-gray-900 dark:text-white">
                  GradNet
                </span>
              </div>
              <div className="relative ml-8">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search alumni, posts, events..."
                  className="pl-10 w-80 bg-gray-50 dark:bg-gray-700 border-0 text-gray-900 dark:text-white"
                />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm">
                📧
              </Button>
              <Button variant="ghost" size="sm" className="relative">
                <Bell className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                  3
                </span>
              </Button>
              <Button variant="ghost" size="sm">
                📅
              </Button>
              <Button variant="ghost" size="sm">
                💼
              </Button>
              <Button variant="ghost" size="sm">
                🎓
              </Button>
              <Button variant="ghost" size="sm">
                ⚙️
              </Button>
              <ThemeToggle />
              <AvatarDropdown />
            </div>
          </div>
        </header>

        <div className="flex">
          {/* Sidebar */}
          <div
            className={cn(
              "w-64 bg-white dark:bg-gray-800 border-r dark:border-gray-700 min-h-screen transition-transform duration-300",
              sidebarOpen
                ? "translate-x-0"
                : "-translate-x-full lg:translate-x-0"
            )}
          >
            {/* Profile Section */}
            <div className="p-4 border-b">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="bg-primary text-white">
                    {user?.profileUrl === "" ? (
                      `${user?.firstName[0].toUpperCase()}${user?.lastName[0].toUpperCase()}`
                    ) : (
                      <img src={user?.profileUrl}></img>
                    )}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {user?.firstName} {user?.lastName} {"(" + user?.role + ")"}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {user?.universityName.toUpperCase()}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    Class of {user?.graduationYear}
                  </p>
                </div>
              </div>
              <div className="mt-3 text-sm text-gray-500 dark:text-gray-400">
                <div className="flex justify-between">
                  <span>Profile views:</span>
                  <span>{userStats.profileViews}</span>
                </div>
                <div className="flex justify-between">
                  <span>Connections:</span>
                  <span>{userStats.connectionCount}</span>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <nav className="p-4">
              <ul className="space-y-1">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        className={cn(
                          "flex items-center justify-between px-3 py-2 text-sm rounded-lg transition-colors",
                          isActive
                            ? "bg-primary text-white"
                            : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className="h-5 w-5" />
                          {item.name}
                        </div>
                        {item.badge && parseInt(item.badge) > 0 && (
                          <Badge
                            className={cn(
                              "text-xs",
                              isActive
                                ? "bg-white text-primary"
                                : "bg-primary text-white"
                            )}
                          >
                            {item.badge}
                          </Badge>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>

            {/* Recent Activity */}
            <div className="p-4 border-t">
              <h4 className="font-medium text-sm mb-3 text-gray-900 dark:text-white">
                Recent Activity
              </h4>
              <div className="space-y-3 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-gray-600 dark:text-gray-400">
                    New alumni joined from your batch
                  </span>
                </div>
                <div className="text-gray-400 dark:text-gray-500">
                  2 hours ago
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span className="text-gray-600 dark:text-gray-400">
                    Upcoming reunion event
                  </span>
                </div>
                <div className="text-gray-400 dark:text-gray-500">
                  1 day ago
                </div>
              </div>
            </div>

            {/* Settings */}
            <div className="p-4 border-t">
              <Link
                href="/settings"
                className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-primary"
              >
                <Settings className="h-4 w-4" />
                Settings
              </Link>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">{children}</div>
        </div>

        {/* Mobile Overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </div>
    </ProtectedRoute>

  );
}
