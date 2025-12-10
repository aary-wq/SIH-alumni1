"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bell, Check, X, Eye, UserPlus, MessageCircle, Briefcase, Calendar } from "lucide-react";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [userRole, setUserRole] = useState('student');
  const [user, setUser] = useState(null);
  
  const notificationTemplates = [
    {
      type: "connection",
      title: "New Connection Request",
      icon: UserPlus,
      actions: ["Accept", "Decline"],
    },
    {
      type: "post",
      title: "Post Interaction",
      icon: Eye,
      actions: ["View", "Dismiss"],
    },
    {
      type: "job",
      title: "New Job Opportunity",
      icon: Briefcase,
      actions: ["View", "Pass"],
    },
    {
      type: "event",
      title: "Event Reminder",
      icon: Calendar,
      actions: ["Join", "Skip"],
    },
    {
      type: "message",
      title: "New Message",
      icon: MessageCircle,
      actions: ["Reply", "View"],
    },
  ];
  
  const generateNotification = (type, fromUser = null) => {
    const template = notificationTemplates.find(t => t.type === type);
    const names = ['Sarah Chen', 'Alex Rodriguez', 'Mike Johnson', 'Lisa Wang', 'David Kim'];
    const companies = ['Meta', 'Google', 'Microsoft', 'Apple', 'Netflix'];
    const roles = ['Software Engineer', 'Product Manager', 'Data Scientist', 'UX Designer', 'Marketing Manager'];
    
    const randomName = fromUser || names[Math.floor(Math.random() * names.length)];
    const randomCompany = companies[Math.floor(Math.random() * companies.length)];
    const randomRole = roles[Math.floor(Math.random() * roles.length)];
    
    let message = '';
    let details = `${randomRole} at ${randomCompany}`;
    
    switch (type) {
      case 'connection':
        message = `${randomName} wants to connect with you.`;
        break;
      case 'post':
        message = `${randomName} & ${Math.floor(Math.random() * 10) + 1} others liked your post.`;
        break;
      case 'job':
        message = `${randomRole} position at ${randomCompany} matches your profile.`;
        details = null;
        break;
      case 'event':
        message = `Alumni Tech Meetup starts in ${Math.floor(Math.random() * 5) + 1} hours.`;
        details = null;
        break;
      case 'message':
        message = `${randomName} sent you a message.`;
        break;
    }
    
    return {
      id: Date.now() + Math.random(),
      type,
      title: template.title,
      message,
      details,
      time: 'Just now',
      avatar: randomName.split(' ').map(n => n[0]).join(''),
      actions: template.actions,
      isRead: false,
      icon: template.icon,
    };
  };

  const handleNotificationAction = async (notificationId, action) => {
    const notification = notifications.find(n => n.id === notificationId);
    
    if (notification && notification.type === 'connection') {
      try {
        const token = localStorage.getItem("token");
        const endpoint = action === 'Accept' ? 'accept' : 'decline';
        
        const res = await fetch(`http://localhost:4000/api/users/connection-request/${endpoint}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ requestId: notification.requestId }),
        });
        
        if (res.ok) {
          setNotifications(prev => prev.filter(n => n.id !== notificationId));
          setUnreadCount(count => count - 1);
          
          // Refresh notifications after action
          fetchAllNotifications();
        }
      } catch (error) {
        console.error('Failed to handle connection request:', error);
      }
    } else {
      setNotifications(prev => prev.map(notif => {
        if (notif.id === notificationId) {
          if (action === 'Accept' || action === 'View' || action === 'Reply') {
            if (!notif.isRead) {
              setUnreadCount(count => count - 1);
            }
            return { ...notif, isRead: true };
          } else if (action === 'Decline' || action === 'Dismiss' || action === 'Pass' || action === 'Skip') {
            return null;
          }
        }
        return notif;
      }).filter(Boolean));
      
      // Refresh notifications to get updated data
      setTimeout(() => fetchAllNotifications(), 1000);
    }
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(notif => ({ ...notif, isRead: true })));
    setUnreadCount(0);
  };

  const getNotificationIcon = (notification) => {
    const IconComponent = notification.icon;
    const colors = {
      connection: 'text-blue-500',
      post: 'text-green-500',
      job: 'text-purple-500',
      event: 'text-orange-500',
      message: 'text-pink-500',
    };
    return <IconComponent className={`h-4 w-4 ${colors[notification.type]}`} />;
  };

  const fetchAllNotifications = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:4000/api/users/notificationnetwork`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (res.ok) {
        const data = await res.json();
        const formattedNotifications = data.notifications.map(notif => ({
          ...notif,
          actions: notif.type === 'connection' ? ['Accept', 'Decline'] : 
                  notif.type === 'job' ? ['View', 'Pass'] : ['View', 'Dismiss'],
          icon: notif.type === 'connection' ? UserPlus :
                notif.type === 'job' ? Briefcase :
                notif.type === 'event' ? Calendar : MessageCircle
        }));
        
        setNotifications(formattedNotifications);
        setUnreadCount(data.unreadCount);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  const getCurrentUser = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:4000/api/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (res.ok) {
        const userData = await res.json();
        setUser(userData);
        setUserRole(userData.role);
      }
    } catch (error) {
      console.error('Failed to fetch user:', error);
    }
  };
  
  useEffect(() => {
    getCurrentUser();
    fetchAllNotifications();
    
    // Refresh notifications every 30 seconds
    const interval = setInterval(() => {
      fetchAllNotifications();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-6 space-y-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Notifications
        </h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white"
          >
            Filter
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="bg-primary text-white border-primary hover:bg-primary/90"
            onClick={markAllAsRead}
          >
            <Check className="h-4 w-4 mr-2" />
            Mark All Read
          </Button>
        </div>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 bg-gray-100 dark:bg-gray-800">
          <TabsTrigger
            value="all"
            className="relative data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700"
          >
            All
          </TabsTrigger>
          <TabsTrigger
            value="unread"
            className="relative data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700"
          >
            Unread
            {unreadCount > 0 && (
              <Badge className="ml-2 bg-red-500 text-white text-xs">{unreadCount}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="connections"
            className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700"
          >
            Connections
          </TabsTrigger>
          <TabsTrigger
            value="jobs"
            className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700"
          >
            Jobs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
            <span>{notifications.length} notifications</span>
            <span>{unreadCount} unread</span>
          </div>
          
          {notifications.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <Bell className="h-16 w-16 mx-auto mb-4 opacity-30" />
              <h3 className="text-lg font-medium mb-2">No notifications yet</h3>
              <p className="text-sm">You&apos;ll see notifications here when you start connecting with alumni and engaging with the community.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {notifications.map((notification) => (
                <Card
                  key={notification.id}
                  className={`hover:shadow-sm transition-shadow bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 ${
                    !notification.isRead ? 'border-l-4 border-l-primary bg-primary/5' : ''
                  }`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="flex items-center gap-3">
                        {notification.avatar ? (
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-primary text-white text-sm">
                              {notification.avatar}
                            </AvatarFallback>
                          </Avatar>
                        ) : (
                          <div className="h-10 w-10 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                            {getNotificationIcon(notification)}
                          </div>
                        )}
                        {!notification.isRead && (
                          <div className="w-2 h-2 bg-primary rounded-full"></div>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className={`font-medium text-sm ${
                            !notification.isRead ? 'text-gray-900 dark:text-white font-semibold' : 'text-gray-700 dark:text-gray-300'
                          }`}>
                            {notification.title}
                          </h3>
                          {!notification.isRead && (
                            <Badge className="bg-primary text-white text-xs px-1 py-0">New</Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {notification.message}
                        </p>
                        {notification.details && (
                          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                            {notification.details}
                          </p>
                        )}
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                          {notification.time}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        {notification.actions.map((action, index) => (
                          <Button
                            key={index}
                            size="sm"
                            variant={index === 0 ? "default" : "outline"}
                            className={
                              index === 0
                                ? "bg-primary hover:bg-primary/90"
                                : "border-gray-200 dark:border-gray-700"
                            }
                            onClick={() => handleNotificationAction(notification.id, action)}
                          >
                            {action === 'Accept' && <Check className="h-3 w-3 mr-1" />}
                            {action === 'Decline' && <X className="h-3 w-3 mr-1" />}
                            {action}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="unread" className="space-y-4">
          <div className="space-y-4">
            {notifications.filter(n => !n.isRead).length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No unread notifications</p>
              </div>
            ) : (
              notifications.filter(n => !n.isRead).map((notification) => (
                <Card
                  key={notification.id}
                  className="border-l-4 border-l-primary bg-primary/5 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      {notification.avatar && (
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-primary text-white text-sm">
                            {notification.avatar}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      <div className="flex-1">
                        <h3 className="font-medium text-sm text-gray-900 dark:text-white">
                          {notification.title}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {notification.message}
                        </p>
                        {notification.details && (
                          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                            {notification.details}
                          </p>
                        )}
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                          {notification.time}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        {notification.actions.map((action, index) => (
                          <Button
                            key={index}
                            size="sm"
                            variant={index === 0 ? "default" : "outline"}
                            className={
                              index === 0
                                ? "bg-primary hover:bg-primary/90"
                                : "border-gray-200 dark:border-gray-700"
                            }
                            onClick={() => handleNotificationAction(notification.id, action)}
                          >
                            {action}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="connections" className="space-y-4">
          <div className="space-y-4">
            {notifications.filter(n => n.type === 'connection').length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <UserPlus className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No connection notifications</p>
              </div>
            ) : (
              notifications.filter(n => n.type === 'connection').map((notification) => (
                <Card key={notification.id} className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-primary text-white text-sm">
                          {notification.avatar}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h3 className="font-medium text-sm text-gray-900 dark:text-white">
                          {notification.title}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                          {notification.time}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        {notification.actions.map((action, index) => (
                          <Button
                            key={index}
                            size="sm"
                            variant={index === 0 ? "default" : "outline"}
                            className={
                              index === 0
                                ? "bg-primary hover:bg-primary/90"
                                : "border-gray-200 dark:border-gray-700"
                            }
                            onClick={() => handleNotificationAction(notification.id, action)}
                          >
                            {action}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="jobs" className="space-y-4">
          <div className="space-y-4">
            {notifications.filter(n => n.type === 'job').length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <Briefcase className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No job notifications</p>
              </div>
            ) : (
              notifications.filter(n => n.type === 'job').map((notification) => (
                <Card key={notification.id} className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="h-10 w-10 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
                        <Briefcase className="h-4 w-4 text-purple-500" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-sm text-gray-900 dark:text-white">
                          {notification.title}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                          {notification.time}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        {notification.actions.map((action, index) => (
                          <Button
                            key={index}
                            size="sm"
                            variant={index === 0 ? "default" : "outline"}
                            className={
                              index === 0
                                ? "bg-primary hover:bg-primary/90"
                                : "border-gray-200 dark:border-gray-700"
                            }
                            onClick={() => handleNotificationAction(notification.id, action)}
                          >
                            {action}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}