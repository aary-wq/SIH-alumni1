const path = require('path');
// Load the backend/.env explicitly so env vars are available even when starting from repo root
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const pathModule = require("path");
const http = require("http");
const socketIo = require("socket.io");
const userRoutes = require("./routes/userRoutes");
const { router: jobRoutes } = require("./routes/jobRoutes");
const eventRoutes = require("./routes/eventRoutes");
const postRoutes = require("./routes/postRoutes");
const campaignRoutes = require("./routes/campaignRoutes");
const blockchainRoutes = require("./routes/blockchainRoutes");
const configRoutes = require("./routes/configRoutes");
const messageRoutes = require("./routes/messageRoutes");
const adminScrapeRoutes = require("./routes/adminScrapeRoutes");


const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: ["http://localhost:3000", "http://localhost:3001", "http://localhost:3002"],
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ['websocket', 'polling']
});

// Middleware
app.use(express.json());
app.use(cors({ 
  origin: ["http://localhost:3000", "http://localhost:3001", "http://localhost:3002"], 
  credentials: true 
}));

// MongoDB connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ MongoDB connected");
  } catch (err) {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1); // stop the app if DB fails
  }
};
connectDB();

// Store active users
const activeUsers = new Map();

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`🔌 User connected: ${socket.id}`);

  // User joins their personal room
  socket.on('join', (userData) => {
    const { userId, userName } = userData;
    console.log(`👤 User ${userName} (${userId}) joined with socket ${socket.id}`);
    
    // Store user data
    activeUsers.set(userId, {
      socketId: socket.id,
      userName,
      userId,
      isOnline: true,
      lastSeen: new Date()
    });
    
    // Join user to their personal room
    socket.join(userId);
    
    // Confirm join
    socket.emit('joinConfirmed', { 
      message: 'Connected to messaging service',
      userId,
      socketId: socket.id 
    });

    // Broadcast user online status
    socket.broadcast.emit('userOnline', { userId, userName });
  });

  // Handle sending messages
  socket.on('sendMessage', (messageData) => {
    const { senderId, recipientId, content, messageType = 'text' } = messageData;
    console.log(`📤 Message from ${senderId} to ${recipientId}: ${content}`);

    // Create message object
    const newMessage = {
      _id: new mongoose.Types.ObjectId().toString(),
      senderId,
      recipientId,
      content,
      messageType,
      timestamp: new Date(),
      isDelivered: false,
      isRead: false
    };

    // Send to recipient if online
    socket.to(recipientId).emit('newMessage', newMessage);
    
    // Send delivery confirmation to sender
    socket.emit('messageDelivered', { 
      messageId: newMessage._id,
      recipientId,
      delivered: true 
    });

    console.log(`✅ Message delivered via Socket.IO`);
  });

  // Handle typing indicators
  socket.on('typing', (data) => {
    const { senderId, recipientId, isTyping } = data;
    socket.to(recipientId).emit('userTyping', { senderId, isTyping });
  });

  // Handle message read status
  socket.on('markAsRead', (data) => {
    const { senderId, recipientId, messageId } = data;
    socket.to(senderId).emit('messageRead', { messageId, readBy: recipientId });
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log(`❌ User disconnected: ${socket.id}`);
    
    // Find and remove user from active users
    for (const [userId, userData] of activeUsers.entries()) {
      if (userData.socketId === socket.id) {
        activeUsers.delete(userId);
        socket.broadcast.emit('userOffline', { userId, userName: userData.userName });
        break;
      }
    }
  });

  // Handle errors
  socket.on('error', (error) => {
    console.error('❌ Socket error:', error);
  });
});


// Global process handlers to catch and log uncaught errors
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err && err.stack ? err.stack : err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Routes
app.use("/api/users", userRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/campaigns", campaignRoutes);
app.use("/api/blockchain", blockchainRoutes);
app.use("/api/config", configRoutes);
app.use("/api/messages", messageRoutes);
app.use('/api/admin', adminScrapeRoutes);

app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Server is running',
    activeUsers: activeUsers.size,
    usedCSEConfigured: !!(process.env.GOOGLE_CSE_API_KEY && process.env.GOOGLE_CSE_CX),
    timestamp: new Date()
  });
});


// Server start
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
// dothis is the functionality implemented in the backend server.js file