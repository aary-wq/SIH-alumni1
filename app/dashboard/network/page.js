"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Filter, Users, MessageCircle, UserPlus, UserCheck, Clock } from "lucide-react";
import { useAuth } from "@/app/hooks/useAuth";

const API_URL = "http://localhost:4000/api/users";

export default function NetworkPage() {
  const { user } = useAuth();
  const [networkStats, setNetworkStats] = useState([
    { label: "Connections", value: 0, color: "bg-blue-500" },
    { label: "Pending", value: 0, color: "bg-green-500" },
    { label: "This Week", value: 0, color: "bg-orange-500" },
  ]);
  
  const [connections, setConnections] = useState([]);
  const [suggestedConnections, setSuggestedConnections] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  
  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("token");
      
      const res = await fetch(`http://localhost:4000/api/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (res.ok) {
        const users = await res.json();
        setAllUsers(users);
        
        // Filter suggestions based on user role
        if (user) {
          const suggestions = users.filter(u => {
            if (u._id === user._id) return false;
            
            // Students see alumni, Alumni see both students and other alumni from same university
            if (user.role === 'student') {
              return u.role === 'alumni';
            } else if (user.role === 'alumni') {
              return u.role === 'student' || (u.role === 'alumni' && u.universityName === user.universityName);
            }
            return false;
          }).map(u => ({
            id: u._id,
            name: `${u.firstName} ${u.lastName}`,
            role: u.role === 'alumni' ? `Alumni - ${u.major || 'Graduate'}` : `Student - ${u.major || 'Undergraduate'}`,
            batch: `Class of ${u.graduationYear}`,
            location: u.universityName,
            avatar: u.firstName[0] + u.lastName[0],
            email: u.email,
            mutualConnections: u.mutualConnections || 0,
          }));
          
          setSuggestedConnections(suggestions);
        }
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };

  const fetchConnections = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:4000/api/users/connections`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (res.ok) {
        const data = await res.json();
        const formattedConnections = data.connections.map(conn => ({
          id: conn._id,
          name: `${conn.firstName} ${conn.lastName}`,
          role: conn.role === 'alumni' ? `Alumni - ${conn.major || 'Graduate'}` : `Student - ${conn.major || 'Undergraduate'}`,
          batch: `Class of ${conn.graduationYear}`,
          location: conn.universityName,
          avatar: conn.firstName[0] + conn.lastName[0],
          email: conn.email,
          status: 'connected',
          mutualConnections: conn.mutualConnections || 0,
          connectedAt: conn.connectedAt,
        }));
        
        setConnections(prev => [
          ...prev.filter(c => c.status === 'pending_received'),
          ...formattedConnections
        ]);
        
        setNetworkStats(prev => prev.map(stat => {
          if (stat.label === 'Connections') return { ...stat, value: data.connectionCount };
          if (stat.label === 'Pending') return { ...stat, value: data.pendingCount };
          return stat;
        }));
      }
    } catch (error) {
      console.error('Failed to fetch connections:', error);
    }
  };

  const fetchConnectionRequests = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:4000/api/users/connection-requests`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (res.ok) {
        const requests = await res.json();
        const formattedRequests = requests.map(req => ({
          id: req._id,
          name: `${req.from.firstName} ${req.from.lastName}`,
          role: req.from.role === 'alumni' ? `Alumni - ${req.from.major || 'Graduate'}` : `Student - ${req.from.major || 'Undergraduate'}`,
          batch: `Class of ${req.from.graduationYear}`,
          location: req.from.universityName,
          avatar: req.from.firstName[0] + req.from.lastName[0],
          email: req.from.email,
          status: 'pending_received',
          mutualConnections: req.mutualConnections || 0,
        }));
        
        setConnections(prev => [
          ...prev.filter(c => c.status !== 'pending_received'),
          ...formattedRequests
        ]);
      }
    } catch (error) {
      console.error('Failed to fetch connection requests:', error);
    }
  };

  const sendConnectionRequest = async (personId) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/connect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ targetUserId: personId }),
      });
      
      if (res.ok) {
        // Remove from suggestions immediately
        setSuggestedConnections(prev => prev.filter(p => p.id !== personId));
        
        setNetworkStats(prevStats => prevStats.map(stat => 
          stat.label === 'Pending' ? { ...stat, value: stat.value + 1 } : stat
        ));
      }
    } catch (error) {
      console.error('Failed to send connection request:', error);
    }
  };
  
  const acceptConnectionRequest = async (personId) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:4000/api/users/connection-request/accept`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ requestId: personId }),
      });
      
      if (res.ok) {
        // Move from pending to connected
        setConnections(prev => prev.map(person => {
          if (person.id === personId) {
            return { ...person, status: 'connected', connectedAt: new Date().toISOString() };
          }
          return person;
        }));
        
        setNetworkStats(prevStats => prevStats.map(stat => {
          if (stat.label === 'Connections') return { ...stat, value: stat.value + 1 };
          if (stat.label === 'Pending') return { ...stat, value: stat.value - 1 };
          if (stat.label === 'This Week') return { ...stat, value: stat.value + 1 };
          return stat;
        }));
        
        // Refresh connections to get updated data
        fetchConnections();
      }
    } catch (error) {
      console.error('Failed to accept connection request:', error);
    }
  };
  
  const declineConnectionRequest = async (personId) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:4000/api/users/connection-request/decline`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ requestId: personId }),
      });
      
      if (res.ok) {
        setConnections(prev => prev.filter(person => person.id !== personId));
        setNetworkStats(prevStats => prevStats.map(stat => 
          stat.label === 'Pending' ? { ...stat, value: stat.value - 1 } : stat
        ));
        
        // Refresh data
        fetchConnections();
      }
    } catch (error) {
      console.error('Failed to decline connection request:', error);
    }
  };
  
  useEffect(() => {
    if (user) {
      fetchUsers();
      fetchConnectionRequests();
      fetchConnections();
    }
  }, [user]);

  const filteredSuggestions = suggestedConnections.filter(person =>
    person.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    person.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
    person.batch.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            My Network
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Connect with fellow alumni and expand your professional network
          </p>
        </div>
        <Button className="bg-primary hover:bg-primary/90">
          <Users className="h-4 w-4 mr-2" />
          Invite Alumni
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {networkStats.map((stat, index) => (
          <Card key={index} className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stat.value}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {stat.label}
                  </p>
                </div>
                <div className={`p-2 rounded-lg ${stat.color}`}>
                  <Users className="h-4 w-4 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search and Filter */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search alumni by name, company, or batch..."
            className="pl-10 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button
          variant="outline"
          className="gap-2 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white"
        >
          <Filter className="h-4 w-4" />
          Filters
        </Button>
      </div>

      <Tabs defaultValue="connections" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 bg-gray-100 dark:bg-gray-800">
          <TabsTrigger
            value="connections"
            className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700"
          >
            Connections
          </TabsTrigger>
          <TabsTrigger
            value="suggestions"
            className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700"
          >
            Suggestions
          </TabsTrigger>
          <TabsTrigger
            value="invitations"
            className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700"
          >
            Invitations
          </TabsTrigger>
        </TabsList>

        <TabsContent value="connections" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Your Connections
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {connections.filter(c => c.status === 'connected').length} connections
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {connections.filter(c => c.status === 'connected').length === 0 ? (
              <div className="col-span-full text-center py-8 text-gray-500 dark:text-gray-400">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No connections yet. Start connecting with alumni!</p>
              </div>
            ) : (
              connections.filter(c => c.status === 'connected').map((person) => (
                <Card
                  key={person.id}
                  className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="relative">
                        <Avatar className="h-12 w-12">
                          <AvatarFallback className="bg-primary text-white">
                            {person.avatar}
                          </AvatarFallback>
                        </Avatar>
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                          {person.name}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                          {person.role}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-500 mt-1">
                          <span>{person.batch}</span>
                          <span>•</span>
                          <span>{person.mutualConnections} mutual</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 border-gray-200 dark:border-gray-700"
                        onClick={() => alert('Message feature coming soon!')}
                      >
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Message
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-gray-200 dark:border-gray-700"
                        onClick={() => window.open(`/dashboard/profile/${person.id}`, '_blank')}
                      >
                        View Profile
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="suggestions" className="space-y-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            People you may know
          </p>
          <div className="space-y-4">
            {filteredSuggestions.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>{searchTerm ? 'No users found matching your search' : 'No new suggestions at the moment'}</p>
              </div>
            ) : (
              filteredSuggestions.map((person) => (
                <Card
                  key={person.id}
                  className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback className="bg-primary text-white">
                          {person.avatar}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {person.name}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {person.role}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-500 mt-1">
                          <span>{person.batch}</span>
                          <span>{person.location}</span>
                          <span>{person.mutualConnections} mutual connections</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="bg-primary hover:bg-primary/90"
                          onClick={() => sendConnectionRequest(person.id)}
                        >
                          <UserPlus className="h-4 w-4 mr-2" />
                          Connect
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-gray-200 dark:border-gray-700"
                        >
                          <MessageCircle className="h-4 w-4 mr-2" />
                          Message
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="invitations" className="space-y-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Pending invitations
          </p>
          <div className="space-y-4">
            {connections.filter(c => c.status === 'pending_sent' || c.status === 'pending_received').length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No pending invitations</p>
              </div>
            ) : (
              connections.filter(c => c.status === 'pending_sent' || c.status === 'pending_received').map((person) => (
                <Card
                  key={person.id}
                  className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback className="bg-primary text-white">
                          {person.avatar}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            {person.name}
                          </h3>
                          <Clock className="h-4 w-4 text-yellow-500" />
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {person.role}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-500 mt-1">
                          <span>{person.batch}</span>
                          <span>{person.location}</span>
                          <span>{person.mutualConnections} mutual connections</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {person.status === 'pending_sent' && (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled
                          >
                            <Clock className="h-4 w-4 mr-2" />
                            Pending
                          </Button>
                        )}
                        {person.status === 'pending_received' && (
                          <>
                            <Button
                              size="sm"
                              className="bg-green-500 hover:bg-green-600"
                              onClick={() => acceptConnectionRequest(person.id)}
                            >
                              <UserCheck className="h-4 w-4 mr-2" />
                              Accept
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => declineConnectionRequest(person.id)}
                            >
                              Decline
                            </Button>
                          </>
                        )}
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