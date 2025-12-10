const nodemailer = require('nodemailer');
const twilio = require('twilio');

// Email configuration
const createEmailTransporter = () => {
  // nodemailer uses createTransport (not createTransporter)
  return nodemailer.createTransport({
    service: 'gmail', // You can change this to your preferred service
    auth: {
      user: process.env.EMAIL_USER, // Your email
      pass: process.env.EMAIL_PASSWORD // Your app password
    }
  });
};

// Twilio configuration for calls
const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

// Send email notification
const sendEmailNotification = async (to, subject, htmlContent, textContent) => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      console.log(`📧 Email would be sent to ${to}: ${subject}`);
      console.log(`📧 Content: ${textContent}`);
      return { success: true, message: 'Email notification logged (no SMTP configured)' };
    }

    const transporter = createEmailTransporter();
    
    const mailOptions = {
      from: `"Alumni Network" <${process.env.EMAIL_USER}>`,
      to: to,
      subject: subject,
      text: textContent,
      html: htmlContent
    };

    const result = await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent successfully to ${to}:`, result.messageId);
    return { success: true, messageId: result.messageId };
    
  } catch (error) {
    console.error(`❌ Error sending email to ${to}:`, error);
    return { success: false, error: error.message };
  }
};

// Make voice call notification
const makeVoiceCall = async (to, message) => {
  try {
    // Support a dry-run mode to avoid making actual Twilio calls in development
    if (process.env.TWILIO_DRY_RUN === 'true') {
      console.log(`📞 TWILIO_DRY_RUN enabled — simulated voice call to ${to}: ${message}`);
      return { success: true, message: 'Voice call simulated (TWILIO_DRY_RUN=true)' };
    }

    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_PHONE_NUMBER) {
      console.log(`📞 Voice call would be made to ${to}: ${message}`);
      return { success: true, message: 'Voice call logged (no Twilio configured)' };
    }

    // Ensure phone number is in E.164 format
    const formattedPhoneNumber = formatPhoneNumber(to);

    console.log(`makeVoiceCall: attempting call from=${process.env.TWILIO_PHONE_NUMBER} to=${formattedPhoneNumber}`);

    // Verify that the configured TWILIO_PHONE_NUMBER is actually owned by this account
    try {
      const owned = await twilioClient.incomingPhoneNumbers.list({ phoneNumber: process.env.TWILIO_PHONE_NUMBER, limit: 20 });
      if (!owned || owned.length === 0) {
        console.warn(`makeVoiceCall: configured TWILIO_PHONE_NUMBER ${process.env.TWILIO_PHONE_NUMBER} does not appear to be an incoming phone number on this Twilio account.`);
        // don't fail yet — give informative response
        return {
          success: false,
          message: `Configured TWILIO_PHONE_NUMBER ${process.env.TWILIO_PHONE_NUMBER} not owned by Twilio account. Ensure you use a Twilio-provisioned phone number capable of voice.`
        };
      }
    } catch (listErr) {
      console.warn('makeVoiceCall: could not verify ownership of TWILIO_PHONE_NUMBER', listErr && listErr.message ? listErr.message : listErr);
      // continue — attempt the call anyway
    }

    const call = await twilioClient.calls.create({
      twiml: `<Response><Say voice="alice">${message}</Say></Response>`,
      to: formattedPhoneNumber,
      from: process.env.TWILIO_PHONE_NUMBER
    });

    console.log(`✅ Voice call initiated successfully to ${formattedPhoneNumber}:`, call.sid);
    return { success: true, callSid: call.sid };
    
  } catch (error) {
    // Twilio trial accounts often return code 21219 for unverified destination numbers
    if (error && error.code === 21219) {
      console.warn(`⚠️ Twilio trial restriction: number not verified (${to}). See https://www.twilio.com/docs/errors/21219`);
      return {
        success: false,
        code: error.code,
        status: error.status,
        moreInfo: error.moreInfo || 'https://www.twilio.com/docs/errors/21219',
        raw: error,
        message: 'Twilio trial account restriction: destination number is not verified. Verify the number in Twilio console or upgrade the account.'
      };
    }

    // Return the full Twilio error object where possible to aid debugging
    console.error(`❌ Error making voice call to ${to}:`, error && error.message ? error.message : error, error);
    return { success: false, error: error && error.message ? error.message : String(error), raw: error };
  }
};

// Format phone number to E.164 format
const formatPhoneNumber = (phoneNumber) => {
  if (!phoneNumber) return phoneNumber;

  const raw = phoneNumber.toString().trim();

  // If the input already begins with +, preserve exactly what the caller provided
  if (raw.startsWith('+')) {
    console.log(`formatPhoneNumber: preserving provided E.164 ${raw}`);
    return raw;
  }

  // Strip non-digits and leading zeros
  let digits = raw.replace(/\D/g, '').replace(/^0+/, '');

  // If the number starts with country code '91' (India) without +, add +
  if (digits.length >= 11 && digits.startsWith('91')) {
    const formatted = `+${digits}`;
    console.log(`formatPhoneNumber: formatted to ${formatted}`);
    return formatted;
  }

  // If it's exactly 10 digits, assume Indian mobile and prefix +91
  if (digits.length === 10) {
    const formatted = `+91${digits}`;
    console.log(`formatPhoneNumber: assumed India -> ${formatted}`);
    return formatted;
  }

  // If it's 11 digits and starts with '1', treat as US/Canada leading 1
  if (digits.length === 11 && digits.startsWith('1')) {
    const formatted = `+${digits}`; // preserve explicit leading 1
    console.log(`formatPhoneNumber: preserving leading 1 -> ${formatted}`);
    return formatted;
  }

  // If it's longer than 10 but doesn't match above patterns, try to add + and use as-is
  if (digits.length > 10 && digits.length <= 15) {
    const formatted = `+${digits}`;
    console.log(`formatPhoneNumber: best-effort -> ${formatted}`);
    return formatted;
  }

  // Fallback: take last 10 digits and assume India
  const last10 = digits.slice(-10);
  const formatted = `+91${last10}`;
  console.log(`formatPhoneNumber: fallback -> ${formatted}`);
  return formatted;
};

// Send job recommendation notification (email + call)
const sendJobRecommendationNotification = async (student, job, matchPercentage) => {
  const emailSubject = `🎯 Job Recommendation: ${job.title} at ${job.company}`;
  
  const emailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb;">New Job Opportunity!</h2>
      <p>Hi ${student.firstName},</p>
      
      <p>We found a job that matches your skills!</p>
      
      <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin: 0 0 10px 0; color: #1f2937;">${job.title}</h3>
        <p style="margin: 5px 0;"><strong>Company:</strong> ${job.company}</p>
        <p style="margin: 5px 0;"><strong>Location:</strong> ${job.location}</p>
        <p style="margin: 5px 0;"><strong>Type:</strong> ${job.jobType}</p>
        <p style="margin: 5px 0;"><strong>Match Score:</strong> ${Math.round(matchPercentage)}%</p>
        ${job.salaryRange ? `<p style="margin: 5px 0;"><strong>Salary:</strong> $${job.salaryRange.min.toLocaleString()} - $${job.salaryRange.max.toLocaleString()}</p>` : ''}
      </div>
      
      <p><strong>Required Skills:</strong> ${job.requiredSkills.map(s => s.name).join(', ')}</p>
      
      <p><strong>Description:</strong></p>
      <p style="background-color: #f9fafb; padding: 15px; border-left: 4px solid #2563eb;">
        ${job.description}
      </p>
      
      <p>Check out this opportunity on our platform and apply now!</p>
      
      <div style="margin: 30px 0; text-align: center;">
        <a href="http://localhost:3000/dashboard/jobs" 
           style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
          View Job Details
        </a>
      </div>
      
      <p>Best regards,<br>Alumni Network Team</p>
    </div>
  `;
  
  const emailText = `
    Hi ${student.firstName},
    
    We found a job that matches your skills!
    
    Position: ${job.title}
    Company: ${job.company}
    Location: ${job.location}
    Type: ${job.jobType}
    Match Score: ${Math.round(matchPercentage)}%
    ${job.salaryRange ? `Salary: $${job.salaryRange.min.toLocaleString()} - $${job.salaryRange.max.toLocaleString()}` : ''}
    
    Required Skills: ${job.requiredSkills.map(s => s.name).join(', ')}
    
    Description: ${job.description}
    
    Check out this opportunity on our platform: http://localhost:3000/dashboard/jobs
    
    Best regards,
    Alumni Network Team
  `;

  // Voice call message
  const callMessage = `Hello ${student.firstName}, this is Alumni Network. We found a great job opportunity for you! ${job.title} at ${job.company} matches your skills with ${Math.round(matchPercentage)} percent match. Check your email and our platform for more details. Thank you!`;

  // Send email and make call in parallel
  const [emailResult, callResult] = await Promise.allSettled([
    sendEmailNotification(student.email, emailSubject, emailHtml, emailText),
    makeVoiceCall(student.contactNumber, callMessage)
  ]);

  return {
    email: emailResult.status === 'fulfilled' ? emailResult.value : { success: false, error: emailResult.reason },
    call: callResult.status === 'fulfilled' ? callResult.value : { success: false, error: callResult.reason }
  };
};

// Send job posting confirmation to alumni
const sendJobPostingConfirmation = async (alumni, job, notifiedStudentsCount) => {
  const emailSubject = `✅ Job Posted Successfully: ${job.title}`;
  
  const emailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #16a34a;">Job Posted Successfully!</h2>
      <p>Hi ${alumni.firstName},</p>
      
      <p>Your job posting has been successfully created and is now live on our platform!</p>
      
      <div style="background-color: #f0f9f4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #16a34a;">
        <h3 style="margin: 0 0 10px 0; color: #1f2937;">${job.title}</h3>
        <p style="margin: 5px 0;"><strong>Company:</strong> ${job.company}</p>
        <p style="margin: 5px 0;"><strong>Location:</strong> ${job.location}</p>
        <p style="margin: 5px 0;"><strong>Type:</strong> ${job.jobType}</p>
        <p style="margin: 5px 0;"><strong>Students Notified:</strong> ${notifiedStudentsCount}</p>
      </div>
      
      <p>We've automatically notified <strong>${notifiedStudentsCount} students</strong> whose skills match your requirements (50%+ match).</p>
      
      <p>You can manage your job postings and view applications from your dashboard.</p>
      
      <div style="margin: 30px 0; text-align: center;">
        <a href="http://localhost:3000/dashboard/jobs" 
           style="background-color: #16a34a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
          View Your Jobs
        </a>
      </div>
      
      <p>Best regards,<br>Alumni Network Team</p>
    </div>
  `;
  
  const emailText = `
    Hi ${alumni.firstName},
    
    Your job posting has been successfully created!
    
    Position: ${job.title}
    Company: ${job.company}
    Students Notified: ${notifiedStudentsCount}
    
    We've automatically notified ${notifiedStudentsCount} students whose skills match your requirements (50%+ match).
    
    You can manage your job postings from your dashboard: http://localhost:3000/dashboard/jobs
    
    Best regards,
    Alumni Network Team
  `;

  return await sendEmailNotification(alumni.email, emailSubject, emailHtml, emailText);
};

// Send job application notification to alumni
const sendJobApplicationNotification = async (alumni, student, job) => {
  const emailSubject = `📋 New Job Application: ${job.title}`;
  
  const emailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #7c3aed;">New Job Application!</h2>
      <p>Hi ${alumni.firstName},</p>
      
      <p>You have a new job application!</p>
      
      <div style="background-color: #faf5ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #7c3aed;">
        <h3 style="margin: 0 0 10px 0; color: #1f2937;">Application Details</h3>
        <p style="margin: 5px 0;"><strong>Applicant:</strong> ${student.firstName} ${student.lastName}</p>
        <p style="margin: 5px 0;"><strong>Email:</strong> ${student.email}</p>
        <p style="margin: 5px 0;"><strong>Phone:</strong> ${student.contactNumber}</p>
        <p style="margin: 5px 0;"><strong>Position:</strong> ${job.title}</p>
        <p style="margin: 5px 0;"><strong>Applied:</strong> ${new Date().toLocaleDateString()}</p>
      </div>
      
      ${student.skills && student.skills.length > 0 ? `
        <p><strong>Applicant Skills:</strong></p>
        <div style="margin: 10px 0;">
          ${student.skills.map(skill => `<span style="background-color: #e5e7eb; padding: 4px 8px; border-radius: 4px; margin: 2px; display: inline-block; font-size: 12px;">${skill.name} (${skill.level})</span>`).join('')}
        </div>
      ` : ''}
      
      <p>You can review the application and contact the applicant directly using the provided contact information.</p>
      
      <div style="margin: 30px 0; text-align: center;">
        <a href="http://localhost:3000/dashboard/jobs" 
           style="background-color: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
          Manage Applications
        </a>
      </div>
      
      <p>Best regards,<br>Alumni Network Team</p>
    </div>
  `;
  
  const emailText = `
    Hi ${alumni.firstName},
    
    You have a new job application!
    
    Applicant: ${student.firstName} ${student.lastName}
    Email: ${student.email}
    Phone: ${student.contactNumber}
    Position: ${job.title}
    Applied: ${new Date().toLocaleDateString()}
    
    You can review the application and contact the applicant directly.
    
    Manage your applications: http://localhost:3000/dashboard/jobs
    
    Best regards,
    Alumni Network Team
  `;

  return await sendEmailNotification(alumni.email, emailSubject, emailHtml, emailText);
};

module.exports = {
  sendEmailNotification,
  makeVoiceCall,
  sendJobRecommendationNotification,
  sendJobPostingConfirmation,
  sendJobApplicationNotification,
  formatPhoneNumber
};