const nodemailer = require('nodemailer');
const { logger } = require('../middleware/errorHandler');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }

  // Send email notification
  async sendEmail(to, subject, content, options = {}) {
    try {
      const mailOptions = {
        from: process.env.SMTP_FROM || 'noreply@upstar.com',
        to: Array.isArray(to) ? to.join(', ') : to,
        subject: subject,
        html: content,
        text: this.stripHtml(content),
        ...options
      };

      const result = await this.transporter.sendMail(mailOptions);
      
      logger.info(`Email sent to ${to}: ${subject}`);
      return {
        success: true,
        messageId: result.messageId,
        response: result.response
      };
    } catch (error) {
      logger.error('Email sending failed:', error);
      throw new Error(`Email sending failed: ${error.message}`);
    }
  }

  // Send welcome email to new users
  async sendWelcomeEmail(userEmail, userName) {
    const subject = 'Welcome to Upstar!';
    const content = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #2563eb;">Welcome to Upstar, ${userName}!</h1>
        <p>Thank you for joining our platform. We're excited to help you advance your career with AI-powered resume analysis and job matching.</p>
        
        <h2>What you can do next:</h2>
        <ul>
          <li>Upload your resume for AI analysis</li>
          <li>Get personalized job recommendations</li>
          <li>Track your skill development</li>
          <li>Connect with career opportunities</li>
        </ul>
        
        <p>If you have any questions, feel free to reach out to our support team.</p>
        
        <p>Best regards,<br>The Upstar Team</p>
      </div>
    `;

    return await this.sendEmail(userEmail, subject, content);
  }

  // Send job match notification
  async sendJobMatchEmail(userEmail, userName, jobMatches) {
    const subject = `New Job Matches for You - ${jobMatches.length} opportunities found`;
    const content = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #2563eb;">New Job Matches, ${userName}!</h1>
        <p>We found ${jobMatches.length} new job opportunities that match your skills and experience.</p>
        
        <h2>Your Matches:</h2>
        ${jobMatches.map(job => `
          <div style="border: 1px solid #e5e7eb; padding: 15px; margin: 10px 0; border-radius: 8px;">
            <h3 style="margin: 0; color: #1f2937;">${job.title}</h3>
            <p style="margin: 5px 0; color: #6b7280;">${job.organization} - ${job.location}</p>
            <p style="margin: 5px 0; color: #059669;">Match Score: ${job.matchScore}%</p>
            <a href="${job.applicationUrl}" style="color: #2563eb; text-decoration: none;">View Job Details</a>
          </div>
        `).join('')}
        
        <p>Log in to your account to see all matches and apply to positions that interest you.</p>
        
        <p>Best regards,<br>The Upstar Team</p>
      </div>
    `;

    return await this.sendEmail(userEmail, subject, content);
  }

  // Send skill development reminder
  async sendSkillReminderEmail(userEmail, userName, skillsToDevelop) {
    const subject = 'Continue Your Skill Development Journey';
    const content = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #2563eb;">Keep Learning, ${userName}!</h1>
        <p>Based on your profile and career goals, here are some skills you might want to develop:</p>
        
        <h2>Recommended Skills:</h2>
        <ul>
          ${skillsToDevelop.map(skill => `<li>${skill}</li>`).join('')}
        </ul>
        
        <p>Developing these skills will help you advance in your career and qualify for more opportunities.</p>
        
        <p>Best regards,<br>The Upstar Team</p>
      </div>
    `;

    return await this.sendEmail(userEmail, subject, content);
  }

  // Send interview reminder
  async sendInterviewReminderEmail(userEmail, userName, interviewDetails) {
    const subject = 'Interview Reminder - Tomorrow';
    const content = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #2563eb;">Interview Reminder</h1>
        <p>Hi ${userName},</p>
        <p>This is a friendly reminder that you have an interview scheduled for tomorrow.</p>
        
        <h2>Interview Details:</h2>
        <ul>
          <li><strong>Company:</strong> ${interviewDetails.company}</li>
          <li><strong>Position:</strong> ${interviewDetails.position}</li>
          <li><strong>Time:</strong> ${interviewDetails.time}</li>
          <li><strong>Location:</strong> ${interviewDetails.location}</li>
        </ul>
        
        <h2>Tips for Success:</h2>
        <ul>
          <li>Review the job description and company information</li>
          <li>Prepare examples of your relevant experience</li>
          <li>Prepare questions to ask the interviewer</li>
          <li>Dress professionally and arrive early</li>
        </ul>
        
        <p>Good luck with your interview!</p>
        
        <p>Best regards,<br>The Upstar Team</p>
      </div>
    `;

    return await this.sendEmail(userEmail, subject, content);
  }

  // Send password reset email
  async sendPasswordResetEmail(userEmail, resetToken) {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    const subject = 'Password Reset Request';
    const content = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #2563eb;">Password Reset Request</h1>
        <p>You requested to reset your password. Click the link below to create a new password:</p>
        
        <a href="${resetUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Reset Password</a>
        
        <p>This link will expire in 1 hour for security reasons.</p>
        
        <p>If you didn't request this password reset, please ignore this email.</p>
        
        <p>Best regards,<br>The Upstar Team</p>
      </div>
    `;

    return await this.sendEmail(userEmail, subject, content);
  }

  // Send subscription confirmation
  async sendSubscriptionConfirmationEmail(userEmail, userName, subscriptionDetails) {
    const subject = 'Subscription Confirmed - Welcome to Premium!';
    const content = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #2563eb;">Subscription Confirmed, ${userName}!</h1>
        <p>Thank you for upgrading to our premium plan. You now have access to all premium features.</p>
        
        <h2>Subscription Details:</h2>
        <ul>
          <li><strong>Plan:</strong> ${subscriptionDetails.plan}</li>
          <li><strong>Amount:</strong> $${subscriptionDetails.amount}</li>
          <li><strong>Billing Cycle:</strong> ${subscriptionDetails.billingCycle}</li>
          <li><strong>Next Billing:</strong> ${subscriptionDetails.nextBilling}</li>
        </ul>
        
        <h2>Premium Features:</h2>
        <ul>
          <li>Unlimited resume uploads</li>
          <li>Advanced job matching</li>
          <li>Priority support</li>
          <li>Detailed analytics</li>
        </ul>
        
        <p>Best regards,<br>The Upstar Team</p>
      </div>
    `;

    return await this.sendEmail(userEmail, subject, content);
  }

  // Send bulk notification
  async sendBulkNotification(recipients, subject, content) {
    try {
      const results = [];
      
      for (const recipient of recipients) {
        try {
          const result = await this.sendEmail(recipient.email, subject, content);
          results.push({
            email: recipient.email,
            success: true,
            messageId: result.messageId
          });
        } catch (error) {
          results.push({
            email: recipient.email,
            success: false,
            error: error.message
          });
        }
      }
      
      const successCount = results.filter(r => r.success).length;
      const failureCount = results.length - successCount;
      
      logger.info(`Bulk email sent: ${successCount} successful, ${failureCount} failed`);
      
      return {
        success: true,
        totalSent: results.length,
        successful: successCount,
        failed: failureCount,
        results: results
      };
    } catch (error) {
      logger.error('Bulk email sending failed:', error);
      throw new Error(`Bulk email sending failed: ${error.message}`);
    }
  }

  // Send system notification
  async sendSystemNotification(recipients, notification) {
    const subject = notification.title;
    const content = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #2563eb;">${notification.title}</h1>
        <p>${notification.content}</p>
        
        ${notification.actionUrl ? `
          <a href="${notification.actionUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Take Action</a>
        ` : ''}
        
        <p>Best regards,<br>The Upstar Team</p>
      </div>
    `;

    return await this.sendBulkNotification(recipients, subject, content);
  }

  // Strip HTML from content for text version
  stripHtml(html) {
    return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  }

  // Verify email configuration
  async verifyConfiguration() {
    try {
      await this.transporter.verify();
      return {
        success: true,
        message: 'Email configuration is valid'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Get email statistics
  async getEmailStats() {
    // This would typically connect to a database to get email statistics
    // For now, return mock data
    return {
      totalSent: 0,
      successful: 0,
      failed: 0,
      lastSent: null
    };
  }
}

module.exports = new EmailService();

