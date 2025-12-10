const mongoose = require("mongoose");

const postSchema = new mongoose.Schema(
  {
    content: { 
      type: String, 
      required: true,
      trim: true,
      maxLength: 5000
    },
    
    // Author reference
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    
    // Post category - affects where it displays
    category: {
      type: String,
      enum: ["photo", "event", "location", "feeling"],
      required: true
    },
    
    // Photo category specific fields
    imageUrl: {
      type: String,
      required: function() {
        return this.category === "photo";
      }
    },
    
    // Event category specific fields
    eventDetails: {
      title: {
        type: String,
        required: function() {
          return this.category === "event";
        }
      },
      date: {
        type: Date,
        required: function() {
          return this.category === "event";
        }
      },
      time: {
        type: String,
        required: function() {
          return this.category === "event";
        }
      },
      venue: {
        type: String,
        required: function() {
          return this.category === "event";
        }
      },
      description: String,
      registrationLink: String,
<<<<<<< HEAD
=======
      posterUrl: String,
        mode: { type: String, enum: ["offline", "online"] },
        fee: { type: Number, default: 0 },
      eventId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Event'
      }
>>>>>>> 71c6fbd01476af0199c3a58bea24914d07daee4b
    },
    
    // Location category specific fields
    locationDetails: {
      placeName: {
        type: String,
        required: function() {
          return this.category === "location";
        }
      },
      address: String,
      coordinates: {
        latitude: Number,
        longitude: Number
      }
    },
    
    // Feeling category specific fields
    feeling: {
      type: String,
      enum: ["excited", "grateful", "proud", "motivated", "happy", "nostalgic", "inspired", "accomplished"],
      required: function() {
        return this.category === "feeling";
      }
    },
    
    // Engagement fields
    likes: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      },
      createdAt: {
        type: Date,
        default: Date.now
      }
    }],
    
    comments: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
      },
      content: {
        type: String,
        required: true,
        maxLength: 1000
      },
      createdAt: {
        type: Date,
        default: Date.now
      }
    }],
    
    shares: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      },
      createdAt: {
        type: Date,
        default: Date.now
      }
    }],
    
    // Tags for categorization
    tags: [{
      type: String,
      trim: true,
      lowercase: true
    }],
    
    // Visibility settings
    isPublic: {
      type: Boolean,
      default: true
    },
    
    // Moderation
    isReported: {
      type: Boolean,
      default: false
    },
    
    reportCount: {
      type: Number,
      default: 0
    }
  },
  { 
    timestamps: true,
    // Add indexes for better query performance
    index: {
      author: 1,
      category: 1,
      createdAt: -1,
      'eventDetails.date': 1
    }
  }
);

// Virtual for like count
postSchema.virtual('likeCount').get(function() {
  return this.likes.length;
});

// Virtual for comment count  
postSchema.virtual('commentCount').get(function() {
  return this.comments.length;
});

// Virtual for share count
postSchema.virtual('shareCount').get(function() {
  return this.shares.length;
});

// Method to check if user has liked the post
postSchema.methods.isLikedBy = function(userId) {
  return this.likes.some(like => like.user.toString() === userId.toString());
};

// Method to add a like
postSchema.methods.addLike = function(userId) {
  if (!this.isLikedBy(userId)) {
    this.likes.push({ user: userId });
  }
  return this.save();
};

// Method to remove a like
postSchema.methods.removeLike = function(userId) {
  this.likes = this.likes.filter(like => like.user.toString() !== userId.toString());
  return this.save();
};

// Method to add a comment
postSchema.methods.addComment = function(userId, content) {
  this.comments.push({ user: userId, content });
  return this.save();
};

// Method to check if user has shared the post
postSchema.methods.isSharedBy = function(userId) {
  return this.shares.some(share => share.user.toString() === userId.toString());
};

// Method to add a share
postSchema.methods.addShare = function(userId) {
  if (!this.isSharedBy(userId)) {
    this.shares.push({ user: userId });
  }
  return this.save();
};

// Method to remove a share
postSchema.methods.removeShare = function(userId) {
  this.shares = this.shares.filter(share => share.user.toString() !== userId.toString());
  return this.save();
};

// Static method to get posts by category
postSchema.statics.getByCategory = function(category, limit = 10, skip = 0) {
  return this.find({ category, isPublic: true })
    .populate('author', 'firstName lastName universityName role profileUrl')
    .populate('likes.user', 'firstName lastName')
    .populate('comments.user', 'firstName lastName profileUrl')
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip);
};

// Static method to get user's posts
postSchema.statics.getUserPosts = function(userId, limit = 10, skip = 0) {
  return this.find({ author: userId })
    .populate('author', 'firstName lastName universityName role profileUrl')
    .populate('likes.user', 'firstName lastName')
    .populate('comments.user', 'firstName lastName profileUrl')
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip);
};

// Ensure virtuals are included in JSON output
postSchema.set('toJSON', { virtuals: true });
postSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model("Post", postSchema);