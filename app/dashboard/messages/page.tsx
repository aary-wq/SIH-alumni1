'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Send, 
  Search, 
  MoreVertical, 
  Phone, 
  Video, 
  Smile, 
  Check,
  CheckCheck,
  Paperclip,
  Users,
  ArrowLeft,
  Mic,
  Image as ImageIcon,
  File
} from 'lucide-react';
import { toast } from 'sonner';
import { io } from 'socket.io-client';

// For now, we'll create a Socket.IO alternative using fetch with polling
// In production, you should install: npm install socket.io-client

// Enhanced interfaces for WhatsApp-like features
interface User {
  _id: string;
  firstName: string;
  lastName: string;
  name?: string;
  email: string;
  avatar?: string;
  profileUrl?: string;
  isOnline?: boolean;
  lastSeen?: Date;
  role?: string;
  universityName?: string;
}

interface Message {
  _id: string;
  content: string;
  sender: {
    _id: string;
    name: string;
    firstName?: string;
    lastName?: string;
    profileUrl?: string;
  };
  recipient?: {
    _id: string;
    name: string;
  };
  createdAt: Date | string;
  timestamp?: Date | string;
  isSentByMe?: boolean;
  isDelivered?: boolean;
  isRead?: boolean;
  messageType?: string;
}

interface Conversation {
  _id: string;
  participant: User;
  lastMessage?: Message;
  unreadCount: number;
  lastActivity: Date;
}

export default function MessagesPage() {
  // State management
  const [users, setUsers] = useState<User[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [typing, setTyping] = useState<{[key: string]: boolean}>({});
  const [showUsersList, setShowUsersList] = useState(true);

  // Refs for scrolling and polling
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Get current user from localStorage
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetch('http://localhost:4000/api/users/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(userData => {
        console.log('✅ Current user loaded:', userData);
        setCurrentUser(userData);
        setIsConnected(true);
      })
      .catch(err => {
        console.error('❌ Failed to fetch current user:', err);
        toast.error('Authentication failed');
      });
    }
  }, []);

  // Polling for new messages (alternative to Socket.IO)
  const startMessagePolling = useCallback(() => {
    if (!selectedUser || !currentUser) return;

    pollingRef.current = setInterval(async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:4000/api/messages/${selectedUser._id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
          const data = await response.json();
          const normalizedMessages = (data.messages || data || []).map((msg: any) => ({
            _id: msg._id || msg.id || Date.now().toString(),
            content: msg.content || msg.text || msg.message || '',
            sender: {
              _id: msg.sender?._id || msg.senderId || msg.from || '',
              name: msg.sender?.name || `${msg.sender?.firstName || ''} ${msg.sender?.lastName || ''}`.trim() || 'Unknown User',
              firstName: msg.sender?.firstName,
              lastName: msg.sender?.lastName,
              profileUrl: msg.sender?.profileUrl
            },
            createdAt: new Date(msg.createdAt || msg.timestamp || new Date()),
            timestamp: new Date(msg.createdAt || msg.timestamp || new Date()),
            isSentByMe: (msg.sender?._id || msg.senderId || msg.from) === currentUser?._id,
            isDelivered: true,
            isRead: true,
            messageType: msg.messageType || 'text'
          }));

          // Only update if messages have changed
          setMessages(prev => {
            if (JSON.stringify(prev) !== JSON.stringify(normalizedMessages)) {
              return normalizedMessages;
            }
            return prev;
          });
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, 2000); // Poll every 2 seconds

  }, [selectedUser, currentUser]);

  // Stop polling
  const stopMessagePolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  // Start/stop polling when user selection changes
  useEffect(() => {
    if (selectedUser) {
      startMessagePolling();
    } else {
      stopMessagePolling();
    }

    return () => stopMessagePolling();
  }, [selectedUser, startMessagePolling, stopMessagePolling]);

  // Fetch user connections
  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Please login to view contacts');
        return;
      }

      console.log('📡 Fetching user connections...');
      const response = await fetch('http://localhost:4000/api/users/connections', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('📋 Connections response:', data);
        
        let processedUsers = (data.connections || data || []).map((user: any) => ({
          ...user,
          name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.name || user.email,
          avatar: user.profileUrl || user.avatar
        }));

        // Remove duplicates by _id
        const uniqueUsers = processedUsers.filter((user: any, index: number, self: any[]) =>
          index === self.findIndex((u) => u._id === user._id)
        );

        setUsers(uniqueUsers);
        console.log('👥 Loaded unique connections:', uniqueUsers.length, 'users');
        
        if (uniqueUsers.length === 0) {
          toast.info('No connections found. Connect with other users first!');
        }
      } else {
        const errorData = await response.text();
        console.error('❌ Failed to fetch users:', response.status, errorData);
        toast.error(`Failed to load contacts: ${response.status}`);
      }
    } catch (error) {
      console.error('❌ Error fetching users:', error);
      toast.error('Failed to load contacts - check network connection');
    }
  };

  // Fetch conversations
  const fetchConversations = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('http://localhost:4000/api/messages', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setConversations(data.conversations || []);
      }
    } catch (error) {
      console.error('❌ Error fetching conversations:', error);
    }
  };

  // Fetch messages for selected user
  const fetchMessages = async (userId: string) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      console.log('📡 Fetching messages for user:', userId);
      
      const response = await fetch(`http://localhost:4000/api/messages/${userId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('📋 Messages response:', data);
        
        const normalizedMessages = (data.messages || data || []).map((msg: any) => ({
          _id: msg._id || msg.id || Date.now().toString(),
          content: msg.content || msg.text || msg.message || '',
          sender: {
            _id: msg.sender?._id || msg.senderId || msg.from || '',
            name: msg.sender?.name || `${msg.sender?.firstName || ''} ${msg.sender?.lastName || ''}`.trim() || 'Unknown User',
            firstName: msg.sender?.firstName,
            lastName: msg.sender?.lastName,
            profileUrl: msg.sender?.profileUrl
          },
          createdAt: new Date(msg.createdAt || msg.timestamp || new Date()),
          timestamp: new Date(msg.createdAt || msg.timestamp || new Date()),
          isSentByMe: (msg.sender?._id || msg.senderId || msg.from) === currentUser?._id,
          isDelivered: true,
          isRead: true,
          messageType: msg.messageType || 'text'
        }));

        setMessages(normalizedMessages);
        console.log('💬 Loaded messages:', normalizedMessages.length);
      } else {
        console.error('❌ Failed to fetch messages:', response.status);
        toast.error('Failed to load messages');
        setMessages([]);
      }
    } catch (error) {
      console.error('❌ Error fetching messages:', error);
      toast.error('Failed to load messages');
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  // Send message function
  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedUser || !currentUser || sendingMessage) {
      console.log('❌ Cannot send message: missing data or already sending');
      return;
    }

    const tempId = `temp_${Date.now()}`;
    const tempMessage: Message = {
      _id: tempId,
      content: newMessage.trim(),
      sender: {
        _id: currentUser._id,
        name: `${currentUser.firstName} ${currentUser.lastName}`,
        firstName: currentUser.firstName,
        lastName: currentUser.lastName,
        profileUrl: currentUser.profileUrl
      },
      createdAt: new Date(),
      timestamp: new Date(),
      isSentByMe: true,
      isDelivered: false,
      isRead: false,
      messageType: 'text'
    };

    // Add message optimistically
    setMessages(prev => [...prev, tempMessage]);
    const messageContent = newMessage.trim();
    setNewMessage('');
    setSendingMessage(true);

    try {
      const token = localStorage.getItem('token');
      console.log('📤 Sending message to:', selectedUser.name, messageContent);
      
      const response = await fetch('http://localhost:4000/api/messages/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          receiverId: selectedUser._id,
          content: messageContent,
          messageType: 'text'
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Message sent successfully:', result);
        
        // Update the optimistic message with real data
        setMessages(prev => prev.map(msg => {
          if (msg._id !== tempId) return msg;
          return {
            ...msg,
            _id: result.messageId || result.data?._id || msg._id,
            isDelivered: true,
            createdAt: new Date(result.timestamp || result.data?.createdAt || msg.createdAt),
            timestamp: new Date(result.timestamp || result.data?.createdAt || msg.timestamp)
          };
        }));

        toast.success('Message sent!');
        
        // Refresh conversations
        fetchConversations();
      } else {
        const errorData = await response.text();
        console.error('❌ Failed to send message:', response.status, errorData);
        toast.error('Failed to send message');
        
        // Remove optimistic message on failure
        setMessages(prev => prev.filter(msg => msg._id !== tempId));
        setNewMessage(messageContent);
      }
    } catch (error) {
      console.error('❌ Error sending message:', error);
      toast.error('Failed to send message');
      
      // Remove optimistic message on error
      setMessages(prev => prev.filter(msg => msg._id !== tempId));
      setNewMessage(messageContent);
    } finally {
      setSendingMessage(false);
    }
  };

  // Handle Enter key press
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Handle typing indicator
  const handleTyping = () => {
    if (!selectedUser) return;

    setTyping(prev => ({ ...prev, [selectedUser._id]: true }));

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout
    typingTimeoutRef.current = setTimeout(() => {
      setTyping(prev => ({ ...prev, [selectedUser._id]: false }));
    }, 1000);
  };

  // Handle user selection
  const handleUserSelect = (user: User) => {
    console.log('👤 Selected user:', user.name);
    setSelectedUser(user);
    setMessages([]);
    setShowUsersList(false); // Hide users list on mobile
    fetchMessages(user._id);
  };

  // Back to users list (mobile)
  const handleBackToUsers = () => {
    setSelectedUser(null);
    setShowUsersList(true);
    stopMessagePolling();
  };

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load users and conversations on component mount
  useEffect(() => {
    if (currentUser) {
      fetchUsers();
      fetchConversations();
    }
  }, [currentUser]);

  // Filter users based on search query
  const filteredUsers = users.filter(user =>
    user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Mobile responsive classes
  const sidebarClasses = `w-full md:w-1/3 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 ${
    showUsersList ? 'block' : 'hidden md:block'
  }`;
  
  const chatClasses = `flex-1 flex flex-col ${
    !showUsersList ? 'block' : 'hidden md:flex'
  }`;

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar - User List */}
      <div className={sidebarClasses}>
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Messages</h1>
            <div className="flex items-center space-x-2">
              {isConnected ? (
                <div className="w-2 h-2 bg-green-400 rounded-full" title="Connected"></div>
              ) : (
                <div className="w-2 h-2 bg-red-400 rounded-full" title="Disconnected"></div>
              )}
              <Button variant="ghost" size="sm">
                <MoreVertical className="h-5 w-5" />
              </Button>
            </div>
          </div>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search conversations"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600"
            />
          </div>
        </div>

        {/* User List */}
        <div className="overflow-y-auto flex-1">
          {filteredUsers.length === 0 ? (
            <div className="p-8 text-center">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">
                {users.length === 0 ? 'No connections found' : 'No matching users'}
              </p>
              {users.length === 0 && (
                <p className="text-sm text-gray-400 mt-2">
                  Connect with other users to start messaging
                </p>
              )}
            </div>
          ) : (
            filteredUsers.map((user) => (
              <button
                key={user._id}
                onClick={() => handleUserSelect(user)}
                className={`w-full text-left p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 ${
                  selectedUser?._id === user._id ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700' : ''
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={user.avatar || user.profileUrl} />
                    <AvatarFallback className="bg-green-500 text-white">
                      {user.firstName?.[0] || 'U'}{user.lastName?.[0] || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {user.name || `${user.firstName} ${user.lastName}`}
                      </p>
                      <span className="text-xs text-gray-500">
                        {user.isOnline && (
                          <span className="inline-block w-2 h-2 bg-green-400 rounded-full mr-1"></span>
                        )}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                      {user.role || 'Alumni'} • {user.universityName || 'University'}
                    </p>
                    {typing[user._id] && (
                      <p className="text-xs text-green-500 italic">typing...</p>
                    )}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className={chatClasses}>
        {!selectedUser ? (
          <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
            <div className="text-center">
              <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Select a conversation
              </h2>
              <p className="text-gray-500 dark:text-gray-400">
                Choose a user from the sidebar to start messaging
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="md:hidden"
                    onClick={handleBackToUsers}
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                  
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={selectedUser.avatar || selectedUser.profileUrl} />
                    <AvatarFallback className="bg-green-500 text-white">
                      {selectedUser.firstName?.[0] || 'U'}{selectedUser.lastName?.[0] || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {selectedUser.name || `${selectedUser.firstName} ${selectedUser.lastName}`}
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {typing[selectedUser._id] ? 'typing...' : 
                       selectedUser.isOnline ? 'Online' : 'Offline'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="sm">
                    <Phone className="h-5 w-5" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Video className="h-5 w-5" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <MoreVertical className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900">
              {loading && (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
                </div>
              )}
              
              {!loading && messages.length === 0 && (
                <div className="text-center py-8">
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md mx-auto">
                    <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400 mb-2">
                      No messages yet. Start the conversation!
                    </p>
                    <p className="text-xs text-gray-400">
                      Send a message to {selectedUser.name} to get started
                    </p>
                  </div>
                </div>
              )}
              
              {!loading && messages.length > 0 && (
                messages.map((message) => (
                  <div
                    key={message._id}
                    className={`flex ${message.isSentByMe ? 'justify-end' : 'justify-start'} group`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl relative ${
                        message.isSentByMe
                          ? 'bg-green-500 text-white rounded-br-sm'
                          : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 rounded-bl-sm'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                      <div className="flex items-center justify-end mt-1 space-x-1">
                        <span className={`text-xs ${
                          message.isSentByMe ? 'text-green-100' : 'text-gray-500'
                        }`}>
                          {new Date(message.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                        {message.isSentByMe && (
                          <span className="text-green-100">
                            {message.isRead ? (
                              <CheckCheck className="h-3 w-3 text-blue-300" />
                            ) : message.isDelivered ? (
                              <CheckCheck className="h-3 w-3" />
                            ) : (
                              <Check className="h-3 w-3" />
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center space-x-3">
                <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-700">
                  <Paperclip className="h-5 w-5" />
                </Button>
                
                <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-700">
                  <ImageIcon className="h-5 w-5" />
                </Button>
                
                <div className="flex-1 relative">
                  <Input
                    placeholder={`Message ${selectedUser.name}...`}
                    value={newMessage}
                    onChange={(e) => {
                      setNewMessage(e.target.value);
                      handleTyping();
                    }}
                    onKeyDown={handleKeyDown}
                    className="pr-12 rounded-full bg-gray-100 dark:bg-gray-700 border-gray-200 dark:border-gray-600 focus:ring-green-500 focus:border-green-500"
                    disabled={sendingMessage || !isConnected}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    <Smile className="h-5 w-5" />
                  </Button>
                </div>
                
                <Button
                  onClick={sendMessage}
                  disabled={!newMessage.trim() || sendingMessage || !isConnected}
                  className="rounded-full bg-green-500 hover:bg-green-600 text-white p-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sendingMessage ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    <Send className="h-5 w-5" />
                  )}
                </Button>
              </div>
              
              {!isConnected && (
                <p className="text-xs text-red-500 mt-2 text-center">
                  Connection lost. Check your internet connection.
                </p>
              )}
              
              {sendingMessage && (
                <p className="text-xs text-gray-500 mt-2 text-center">
                  Sending message...
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

