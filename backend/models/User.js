const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    universityName: { type: String, required: true, trim: true },
    role: {
      type: String,
      enum: ["student", "alumni", "employer", "admin"],
      required: true,
    },
    walletAddress: { type: String },
    email: {
         type: String, 
         required: true,
          unique: true, 
          lowercase: true, 
          trim: true 
        },
    password: { type: String, required: true },
    contactNumber: { type: String, required: true },
    documentLink: { type: String},
  documentHash: { type: String },
    profileUrl: { type: String },
    isVerified: { type: Boolean, default: false },
    graduationYear: { type: String },
    profileViews: { type: Number, default: 0 },
    
    // Additional profile information
    about: { type: String, trim: true },
    skills: [{
      id: { type: Number },
      name: { type: String, trim: true },
      level: { type: Number, min: 0, max: 100 }
    }],
    experience: [{
      title: { type: String, trim: true },
      company: { type: String, trim: true },
      startDate: { type: String },
      endDate: { type: String },
      description: { type: String, trim: true },
      current: { type: Boolean, default: false }
    }],
    education: [{
      degree: { type: String, trim: true },
      institution: { type: String, trim: true },
      startDate: { type: String },
      endDate: { type: String },
      description: { type: String, trim: true }
    }],
    awards: [{
      title: { type: String, trim: true },
      issuer: { type: String, trim: true },
      date: { type: String },
      description: { type: String, trim: true }
    }],
    
    // Job-related fields
    openToWork: { 
      type: Boolean, 
      default: false 
    },
    
    connectionRequests: [{
      from: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      status: { type: String, enum: ['pending', 'accepted', 'declined'], default: 'pending' },
      createdAt: { type: Date, default: Date.now }
    }],
    connections: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
