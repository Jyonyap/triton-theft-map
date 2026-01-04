// Email Verification service
// Handles email verification for UCSD accounts

import crypto from 'crypto';
import { query } from '../config/database.js';

export class EmailVerificationService {
  /**
   * Send verification email to user
   * @param {string} email - User's email address
   * @param {string} userId - User ID
   * @returns {Promise<void>}
   */
  async sendVerificationEmail(email, userId) {
    // Generate verification token
    const token = this.generateToken(userId);
    
    // Store token in database with 24-hour expiry
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    
    await query(
      `INSERT INTO email_verification_tokens (user_id, token, expires_at)
       VALUES ($1, $2, $3)`,
      [userId, token, expiresAt]
    );

    // Build verification URL
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;

    // Email content
    const emailContent = {
      to: email,
      subject: 'Verify your Bike Angel account',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Welcome to Bike Angel!</h2>
          <p>Thank you for registering with Bike Angel, the UCSD campus bicycle safety platform.</p>
          <p>Please verify your email address by clicking the button below:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" 
               style="background-color: #2563eb; color: white; padding: 12px 24px; 
                      text-decoration: none; border-radius: 6px; display: inline-block;">
              Verify Email Address
            </a>
          </div>
          <p>Or copy and paste this link into your browser:</p>
          <p style="color: #6b7280; word-break: break-all;">${verificationUrl}</p>
          <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
            This link will expire in 24 hours. If you didn't create an account with Bike Angel, 
            you can safely ignore this email.
          </p>
        </div>
      `,
      text: `
        Welcome to Bike Angel!
        
        Thank you for registering with Bike Angel, the UCSD campus bicycle safety platform.
        
        Please verify your email address by visiting this link:
        ${verificationUrl}
        
        This link will expire in 24 hours. If you didn't create an account with Bike Angel, 
        you can safely ignore this email.
      `
    };

    // Send email based on configured service
    const emailService = process.env.EMAIL_SERVICE || 'sendgrid';
    
    if (emailService === 'sendgrid') {
      await this.sendWithSendGrid(emailContent);
    } else if (emailService === 'ses') {
      await this.sendWithSES(emailContent);
    } else {
      // For development: log email instead of sending
      console.log('📧 Email verification (dev mode):');
      console.log(`To: ${emailContent.to}`);
      console.log(`Subject: ${emailContent.subject}`);
      console.log(`Verification URL: ${verificationUrl}`);
      console.log(`Token: ${token}`);
    }
  }

  /**
   * Send email using SendGrid
   * @param {Object} emailContent - Email content
   * @returns {Promise<void>}
   */
  async sendWithSendGrid(emailContent) {
    // Only import SendGrid if it's configured
    if (!process.env.EMAIL_API_KEY) {
      console.warn('⚠️  SendGrid API key not configured. Email not sent.');
      console.log('📧 Verification email would be sent to:', emailContent.to);
      return;
    }

    try {
      const sgMail = (await import('@sendgrid/mail')).default;
      sgMail.setApiKey(process.env.EMAIL_API_KEY);

      const msg = {
        to: emailContent.to,
        from: process.env.EMAIL_FROM || 'noreply@bikeangel.ucsd.edu',
        subject: emailContent.subject,
        text: emailContent.text,
        html: emailContent.html,
      };

      await sgMail.send(msg);
      console.log('✅ Verification email sent via SendGrid');
    } catch (error) {
      console.error('❌ SendGrid email error:', error);
      // Don't throw - allow registration to complete even if email fails
      console.log('📧 Verification email would be sent to:', emailContent.to);
    }
  }

  /**
   * Send email using AWS SES
   * @param {Object} emailContent - Email content
   * @returns {Promise<void>}
   */
  async sendWithSES(emailContent) {
    // Only import AWS SDK if it's configured
    if (!process.env.AWS_ACCESS_KEY_ID) {
      console.warn('⚠️  AWS credentials not configured. Email not sent.');
      console.log('📧 Verification email would be sent to:', emailContent.to);
      return;
    }

    try {
      const { SESClient, SendEmailCommand } = await import('@aws-sdk/client-ses');
      
      const sesClient = new SESClient({
        region: process.env.AWS_REGION || 'us-west-2',
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        },
      });

      const params = {
        Source: process.env.EMAIL_FROM || 'noreply@bikeangel.ucsd.edu',
        Destination: {
          ToAddresses: [emailContent.to],
        },
        Message: {
          Subject: {
            Data: emailContent.subject,
          },
          Body: {
            Text: {
              Data: emailContent.text,
            },
            Html: {
              Data: emailContent.html,
            },
          },
        },
      };

      const command = new SendEmailCommand(params);
      await sesClient.send(command);
      console.log('✅ Verification email sent via AWS SES');
    } catch (error) {
      console.error('❌ AWS SES email error:', error);
      // Don't throw - allow registration to complete even if email fails
      console.log('📧 Verification email would be sent to:', emailContent.to);
    }
  }

  /**
   * Verify token validity and update user
   * @param {string} token - Verification token
   * @returns {Promise<boolean>} - True if token is valid
   */
  async verifyToken(token) {
    // Find token in database
    const result = await query(
      `SELECT user_id, expires_at 
       FROM email_verification_tokens 
       WHERE token = $1`,
      [token]
    );

    if (result.rows.length === 0) {
      return false;
    }

    const { user_id, expires_at } = result.rows[0];

    // Check if token is expired
    if (new Date() > new Date(expires_at)) {
      return false;
    }

    // Update user's email_verified status
    await query(
      'UPDATE users SET email_verified = TRUE WHERE id = $1',
      [user_id]
    );

    // Delete used token
    await query(
      'DELETE FROM email_verification_tokens WHERE token = $1',
      [token]
    );

    return true;
  }

  /**
   * Generate verification token
   * @param {string} userId - User ID
   * @returns {string} - Verification token
   */
  generateToken(userId) {
    // Generate a secure random token
    const randomBytes = crypto.randomBytes(32).toString('hex');
    // Include userId for additional uniqueness
    return `${randomBytes}-${userId}`;
  }
}
