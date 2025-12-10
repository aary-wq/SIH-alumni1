const express = require("express");
const jwt = require("jsonwebtoken");
const Post = require("../models/Post");
const Event = require("../models/Event");
const User = require("../models/User");
const cloudinary = require("../config/cloudinary");
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");

const router = express.Router();

// Cloudinary storage configuration for post images
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "alumni_posts",
    allowed_formats: ["jpg", "jpeg", "png", "gif"],
    transformation: [{ width: 800, height: 600, crop: "limit" }]
  }
});

const upload = multer({ storage: storage });

// Middleware to verify JWT token
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Access token required" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ error: "Invalid token" });
    }
    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ error: "Invalid or expired token" });
  }
};

// Create a new post
router.post("/", authenticateToken, upload.single("image"), async (req, res) => {
  try {
    const { content, category, tags, eventDetails, locationDetails, feeling } = req.body;
    
    // Validate required fields
    if (!content || !category) {
      return res.status(400).json({ 
        error: "Content and category are required" 
      });
    }

    // Validate category
    const validCategories = ["photo", "event", "location", "feeling"];
    if (!validCategories.includes(category)) {
      return res.status(400).json({ 
        error: "Invalid category. Must be one of: photo, event, location, feeling" 
      });
    }

    const postData = {
      content,
      category,
      author: req.user._id,
      tags: tags ? JSON.parse(tags) : []
    };

    // keep parsed event details available so we can create a canonical Event record
    let parsedEventDetails = null;

    // Handle category-specific data
    switch (category) {
      case "photo":
        if (!req.file) {
          return res.status(400).json({ error: "Image is required for photo posts" });
        }
        postData.imageUrl = req.file.path;
        break;

      case "event":
        // Only alumni and admin can create events
        if (!req.user || !['alumni','admin'].includes(req.user.role)) {
          return res.status(403).json({ error: 'Only alumni or admin can create events' })
        }
        if (!eventDetails) {
          return res.status(400).json({ error: "Event details are required for event posts" });
        }
        parsedEventDetails = JSON.parse(eventDetails);
        // If a file was uploaded (poster), multer/cloudinary will put the path on req.file.path
        if (req.file && req.file.path) {
          parsedEventDetails.posterUrl = req.file.path;
        }
        // venue required only for offline events; mode can be provided or inferred
        const inferredMode = parsedEventDetails.mode || (parsedEventDetails.venue ? 'offline' : 'online')
        if (!parsedEventDetails.title || !parsedEventDetails.date || !parsedEventDetails.time) {
          return res.status(400).json({ 
            error: "Event title, date, and time are required" 
          });
        }
        if (inferredMode === 'offline' && !parsedEventDetails.venue) {
          return res.status(400).json({ error: 'Venue is required for offline events' })
        }
        // normalize fee (ensure numeric even if '0' or empty)
        parsedEventDetails.fee = Number(parsedEventDetails.fee || 0)
        postData.eventDetails = parsedEventDetails;
        break;

      case "location":
        if (!locationDetails) {
          return res.status(400).json({ error: "Location details are required for location posts" });
        }
        const parsedLocationDetails = JSON.parse(locationDetails);
        if (!parsedLocationDetails.placeName) {
          return res.status(400).json({ error: "Place name is required for location posts" });
        }
        postData.locationDetails = parsedLocationDetails;
        break;

      case "feeling":
        if (!feeling) {
          return res.status(400).json({ error: "Feeling is required for feeling posts" });
        }
        const validFeelings = ["excited", "grateful", "proud", "motivated", "happy", "nostalgic", "inspired", "accomplished"];
        if (!validFeelings.includes(feeling)) {
          return res.status(400).json({ 
            error: "Invalid feeling. Must be one of: " + validFeelings.join(", ") 
          });
        }
        postData.feeling = feeling;
        break;
    }

    // If this post is an event post, create the canonical Event first so the
    // saved Post can include the eventId and posterUrl immediately in the response.
    let createdEvent = null;
    if (category === 'event' && parsedEventDetails) {
      try {
        const eventPayload = {
          title: parsedEventDetails.title,
          date: new Date(parsedEventDetails.date),
          mode: parsedEventDetails.mode || (parsedEventDetails.venue ? 'offline' : 'online'),
          venue: parsedEventDetails.venue,
          fee: parsedEventDetails.fee ? Number(parsedEventDetails.fee) : 0,
          posterUrl: parsedEventDetails.posterUrl || null,
          createdBy: req.user._id,
          registeredUsers: [],
          donationAccepted: parsedEventDetails.donationAccepted === true || parsedEventDetails.donationAccepted === 'true',
          description: parsedEventDetails.description || content || ''
        };

        const eventDoc = new Event(eventPayload);
        createdEvent = await eventDoc.save();

        // attach eventId into the parsedEventDetails so postData includes it
        parsedEventDetails.eventId = createdEvent._id;
        postData.eventDetails = parsedEventDetails;
      } catch (evtErr) {
        console.error('Failed to create Event document for event post:', evtErr);
        // If event creation fails, we still allow creating the post without eventId
        postData.eventDetails = parsedEventDetails;
      }
    }

    const post = new Post(postData);
    await post.save();

    // Populate author information
    await post.populate('author', 'firstName lastName universityName role profileUrl');

    const responsePayload = {
      message: "Post created successfully",
      post
    };
    if (createdEvent) responsePayload.event = createdEvent;

    res.status(201).json(responsePayload);

  } catch (error) {
    console.error("Error creating post:", error);
    res.status(500).json({ 
      error: "Failed to create post",
      details: error.message 
    });
  }
});

// Get all posts (feed)
router.get("/", async (req, res) => {
  try {
    const { page = 1, limit = 10, category } = req.query;
    const skip = (page - 1) * limit;

    let query = { isPublic: true };
    if (category && category !== "all") {
      query.category = category;
    }

    const posts = await Post.find(query)
      .populate('author', 'firstName lastName universityName role profileUrl')
      .populate('likes.user', 'firstName lastName')
      .populate('comments.user', 'firstName lastName profileUrl')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const totalPosts = await Post.countDocuments(query);

    res.json({
      posts,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalPosts / limit),
        totalPosts,
        hasNextPage: skip + posts.length < totalPosts,
        hasPrevPage: page > 1
      }
    });

  } catch (error) {
    console.error("Error fetching posts:", error);
    res.status(500).json({ 
      error: "Failed to fetch posts",
      details: error.message 
    });
  }
});

// Get feed posts (college + connections)
router.get("/feed", authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, category } = req.query;
    const skip = (page - 1) * limit;

    // Get current user with connections
    const currentUser = await User.findById(req.user._id).populate('connections');
    if (!currentUser) {
      return res.status(404).json({ error: "User not found" });
    }

    console.log('Current user:', currentUser.firstName, currentUser.universityName);
    console.log('User connections:', currentUser.connections.length);

    // Create array of user IDs to include in feed
    const feedUserIds = [
      ...currentUser.connections.map(conn => conn._id), // Connected users
    ];

    // Get all users from the same university (excluding current user)
    const universityUsers = await User.find({
      universityName: currentUser.universityName,
      _id: { $ne: req.user._id } // Exclude current user
    }).select('_id firstName lastName');

    console.log('University users found:', universityUsers.length);
    console.log('University users:', universityUsers.map(u => u.firstName + ' ' + u.lastName));

    // Add university users to feed
    feedUserIds.push(...universityUsers.map(user => user._id));

    console.log('Total feed user IDs:', feedUserIds.length);

    // Build query for feed posts - only from connections and university peers
    let query = { 
      isPublic: true,
      author: { $in: feedUserIds } // Only posts from feed users
    };

    // Add category filter if specified
    if (category && category !== "all") {
      query.category = category;
    }

    const posts = await Post.find(query)
      .populate('author', 'firstName lastName universityName role profileUrl')
      .populate('likes.user', 'firstName lastName')
      .populate('comments.user', 'firstName lastName profileUrl')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    console.log('Posts found in feed:', posts.length);

    // Get total count for pagination
    const totalPosts = await Post.countDocuments(query);

    res.json({
      posts,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalPosts / limit),
        totalPosts,
        hasNextPage: skip + posts.length < totalPosts,
        hasPrevPage: page > 1
      },
      debug: {
        currentUser: currentUser.firstName + ' ' + currentUser.lastName,
        university: currentUser.universityName,
        connectionsCount: currentUser.connections.length,
        universityUsersCount: universityUsers.length,
        totalFeedUsers: feedUserIds.length,
        postsFound: posts.length
      }
    });

  } catch (error) {
    console.error("Error fetching feed posts:", error);
    res.status(500).json({ 
      error: "Failed to fetch feed posts",
      details: error.message 
    });
  }
});

// Debug endpoint to check users and posts
router.get("/debug", authenticateToken, async (req, res) => {
  try {
    const currentUser = await User.findById(req.user._id);
    const allUsers = await User.find({}).select('firstName lastName universityName role');
    const allPosts = await Post.find({}).populate('author', 'firstName lastName universityName');
    
    res.json({
      currentUser: {
        name: currentUser.firstName + ' ' + currentUser.lastName,
        university: currentUser.universityName,
        role: currentUser.role
      },
      allUsers: allUsers.map(u => ({
        name: u.firstName + ' ' + u.lastName,
        university: u.universityName,
        role: u.role
      })),
      allPosts: allPosts.map(p => ({
        content: p.content.substring(0, 50) + '...',
        author: p.author.firstName + ' ' + p.author.lastName,
        university: p.author.universityName,
        isPublic: p.isPublic
      }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get posts by category
router.get("/category/:category", async (req, res) => {
  try {
    const { category } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const validCategories = ["photo", "event", "location", "feeling"];
    if (!validCategories.includes(category)) {
      return res.status(400).json({ 
        error: "Invalid category. Must be one of: " + validCategories.join(", ") 
      });
    }

    const posts = await Post.getByCategory(category, parseInt(limit), skip);
    const totalPosts = await Post.countDocuments({ category, isPublic: true });

    res.json({
      posts,
      category,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalPosts / limit),
        totalPosts,
        hasNextPage: skip + posts.length < totalPosts,
        hasPrevPage: page > 1
      }
    });

  } catch (error) {
    console.error("Error fetching posts by category:", error);
    res.status(500).json({ 
      error: "Failed to fetch posts by category",
      details: error.message 
    });
  }
});

// Get user's posts
router.get("/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const posts = await Post.getUserPosts(userId, parseInt(limit), skip);
    const totalPosts = await Post.countDocuments({ author: userId });

    res.json({
      posts,
      user: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        universityName: user.universityName,
        role: user.role
      },
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalPosts / limit),
        totalPosts,
        hasNextPage: skip + posts.length < totalPosts,
        hasPrevPage: page > 1
      }
    });

  } catch (error) {
    console.error("Error fetching user posts:", error);
    res.status(500).json({ 
      error: "Failed to fetch user posts",
      details: error.message 
    });
  }
});

// Get current user's posts
router.get("/my-posts", authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const posts = await Post.getUserPosts(req.user._id, parseInt(limit), skip);
    const totalPosts = await Post.countDocuments({ author: req.user._id });

    res.json({
      posts,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalPosts / limit),
        totalPosts,
        hasNextPage: skip + posts.length < totalPosts,
        hasPrevPage: page > 1
      }
    });

  } catch (error) {
    console.error("Error fetching my posts:", error);
    res.status(500).json({ 
      error: "Failed to fetch your posts",
      details: error.message 
    });
  }
});

// Get single post by ID
router.get("/:id", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('author', 'firstName lastName universityName role profileUrl')
      .populate('likes.user', 'firstName lastName')
      .populate('comments.user', 'firstName lastName profileUrl');

    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    res.json({ post });

  } catch (error) {
    console.error("Error fetching post:", error);
    res.status(500).json({ 
      error: "Failed to fetch post",
      details: error.message 
    });
  }
});

// Update a post
router.put("/:id", authenticateToken, upload.single("image"), async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    // Check if user owns the post
    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "You can only edit your own posts" });
    }

    const { content, tags, eventDetails, locationDetails, feeling } = req.body;

    // Update basic fields
    if (content) post.content = content;
    if (tags) post.tags = JSON.parse(tags);

    // Update image for photo posts
    if (post.category === "photo" && req.file) {
      post.imageUrl = req.file.path;
    }

    // Update category-specific fields
    switch (post.category) {
      case "event":
        if (eventDetails) {
          const parsedEventDetails = JSON.parse(eventDetails);
          // If a new poster was uploaded during edit, ensure it's stored
          if (req.file && req.file.path) {
            parsedEventDetails.posterUrl = req.file.path;
          }
          // normalize fee
          if (parsedEventDetails.fee) parsedEventDetails.fee = Number(parsedEventDetails.fee)
          post.eventDetails = { ...post.eventDetails, ...parsedEventDetails };
        }
        break;

      case "location":
        if (locationDetails) {
          const parsedLocationDetails = JSON.parse(locationDetails);
          post.locationDetails = { ...post.locationDetails, ...parsedLocationDetails };
        }
        break;

      case "feeling":
        if (feeling) {
          const validFeelings = ["excited", "grateful", "proud", "motivated", "happy", "nostalgic", "inspired", "accomplished"];
          if (validFeelings.includes(feeling)) {
            post.feeling = feeling;
          }
        }
        break;
    }

    await post.save();
    await post.populate('author', 'firstName lastName universityName role profileUrl');

    res.json({
      message: "Post updated successfully",
      post
    });

  } catch (error) {
    console.error("Error updating post:", error);
    res.status(500).json({ 
      error: "Failed to update post",
      details: error.message 
    });
  }
});

// Delete a post
router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    // Check if user owns the post
    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "You can only delete your own posts" });
    }

    await Post.findByIdAndDelete(req.params.id);

    res.json({ message: "Post deleted successfully" });

  } catch (error) {
    console.error("Error deleting post:", error);
    res.status(500).json({ 
      error: "Failed to delete post",
      details: error.message 
    });
  }
});

// Like a post
router.post("/:id/like", authenticateToken, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    if (post.isLikedBy(req.user._id)) {
      await post.removeLike(req.user._id);
      res.json({ message: "Post unliked", liked: false, likeCount: post.likeCount });
    } else {
      await post.addLike(req.user._id);
      res.json({ message: "Post liked", liked: true, likeCount: post.likeCount });
    }

  } catch (error) {
    console.error("Error toggling like:", error);
    res.status(500).json({ 
      error: "Failed to toggle like",
      details: error.message 
    });
  }
});

// Add comment to a post
router.post("/:id/comment", authenticateToken, async (req, res) => {
  try {
    const { content } = req.body;
    
    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: "Comment content is required" });
    }

    const post = await Post.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    await post.addComment(req.user._id, content.trim());
    await post.populate('comments.user', 'firstName lastName profileUrl');

    res.status(201).json({
      message: "Comment added successfully",
      comment: post.comments[post.comments.length - 1],
      commentCount: post.commentCount
    });

  } catch (error) {
    console.error("Error adding comment:", error);
    res.status(500).json({ 
      error: "Failed to add comment",
      details: error.message 
    });
  }
});

// Share a post
router.post("/:id/share", authenticateToken, async (req, res) => {
  try {
    const { connectionIds, message } = req.body;
    const post = await Post.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    // Check if user has connections
    const currentUser = await User.findById(req.user._id).populate('connections');
    if (!currentUser) {
      return res.status(404).json({ error: "User not found" });
    }

    // Validate that all connectionIds are actually user's connections
    const validConnectionIds = connectionIds.filter(connId => 
      currentUser.connections.some(conn => conn._id.toString() === connId)
    );

    if (validConnectionIds.length === 0) {
      return res.status(400).json({ error: "No valid connections selected" });
    }

    // Add share to post (for analytics)
    await post.addShare(req.user._id);

    // Create share notifications/records for each connection
    const sharePromises = validConnectionIds.map(async (connectionId) => {
      // Here you could create a notification system or shared posts collection
      // For now, we'll just track the share in the post
      return {
        sharedTo: connectionId,
        sharedBy: req.user._id,
        sharedAt: new Date(),
        message: message || ""
      };
    });

    const shareResults = await Promise.all(sharePromises);

    res.json({
      message: `Post shared with ${validConnectionIds.length} connection(s)`,
      shareCount: post.shareCount,
      sharedWith: shareResults
    });

  } catch (error) {
    console.error("Error sharing post:", error);
    res.status(500).json({ 
      error: "Failed to share post",
      details: error.message 
    });
  }
});



module.exports = router;