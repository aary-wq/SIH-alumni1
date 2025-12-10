const mongoose = require("mongoose");

const jobSchema = new mongoose.Schema(
  {
    title: { 
      type: String, 
      required: true, 
      trim: true 
    },
    description: { 
      type: String, 
      required: true,
      trim: true 
    },
    company: { 
      type: String, 
      required: true, 
      trim: true 
    },
    location: { 
      type: String, 
      required: true, 
      trim: true 
    },
    jobType: { 
      type: String, 
      enum: ["Full-time", "Part-time", "Contract", "Internship", "Freelance"],
      required: true 
    },
    salaryRange: {
      min: { type: Number },
      max: { type: Number },
      currency: { type: String, default: "USD" }
    },
    requiredSkills: [{
      name: { type: String, trim: true },
      level: { type: Number, min: 0, max: 100, default: 50 }
    }],
    requirements: { 
      type: String, 
      trim: true 
    },
    benefits: { 
      type: String, 
      trim: true 
    },
    applicationDeadline: { 
      type: Date 
    },
    postedBy: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User', 
      required: true 
    },
    applicants: [{
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      appliedAt: { type: Date, default: Date.now },
      status: { 
        type: String, 
        enum: ['applied', 'reviewed', 'interviewed', 'rejected', 'hired'],
        default: 'applied'
      }
    }],
    isActive: { 
      type: Boolean, 
      default: true 
    },
    notifiedStudents: [{ 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User' 
    }] // Track which students have been notified to avoid duplicates
  },
  { timestamps: true }
);

// Index for better search performance
jobSchema.index({ title: 'text', description: 'text', company: 'text' });
jobSchema.index({ 'requiredSkills.name': 1 });
jobSchema.index({ postedBy: 1 });
jobSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Job", jobSchema);