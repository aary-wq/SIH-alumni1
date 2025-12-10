const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Job = require("../models/Job");
const Notification = require("../models/Notification");

const router = express.Router();

// Helper function to check skill match percentage
function calculateSkillMatch(jobSkills, userSkills) {
  if (!jobSkills || jobSkills.length === 0) return 0;
  if (!userSkills || userSkills.length === 0) return 0;

  let totalMatch = 0;
  let matchedSkills = 0;

  jobSkills.forEach(jobSkill => {
    const userSkill = userSkills.find(us => 
      us.name.toLowerCase().includes(jobSkill.name.toLowerCase()) ||
      jobSkill.name.toLowerCase().includes(us.name.toLowerCase())
    );
    
    if (userSkill) {
      matchedSkills++;
      // Calculate match based on skill level
      const levelDiff = Math.abs(userSkill.level - jobSkill.level);
      const skillMatchScore = Math.max(0, 100 - levelDiff);
      totalMatch += skillMatchScore;
    }
  });

  return matchedSkills > 0 ? totalMatch / matchedSkills : 0;
}

// Helper function to send email notification (placeholder implementation)
async function sendEmailNotification(email, subject, message) {
  // TODO: Implement actual email sending logic (using nodemailer, sendgrid, etc.)
  console.log(`📧 Email would be sent to ${email}: ${subject}`);
  console.log(`📧 Message: ${message}`);
  return true;
}

// Helper function to send SMS notification (placeholder implementation)
async function sendSMSNotification(phoneNumber, message) {
  // TODO: Implement actual SMS sending logic (using Twilio, etc.)
  console.log(`📱 SMS would be sent to ${phoneNumber}: ${message}`);
  return true;
}

module.exports = {
  router,
  calculateSkillMatch,
  sendEmailNotification,
  sendSMSNotification
};