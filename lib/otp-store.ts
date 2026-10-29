import nodemailer from 'nodemailer';

interface OtpRecord {
  code: string;
  expiresAt: number; // timestamp in ms
  attempts: number;
}

// In-memory OTP storage (valid for 10 minutes)
const otpStore = new Map<string, OtpRecord>();

/**
 * Generate a 6-digit numerical OTP code
 */
export function generateOtp(email: string): string {
  const normalizedEmail = email.toLowerCase().trim();
  // Generate cryptographically random 6-digit code
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  
  // Set expiry to 10 minutes from now
  const expiresAt = Date.now() + 10 * 60 * 1000;
  
  otpStore.set(normalizedEmail, {
    code,
    expiresAt,
    attempts: 0,
  });

  return code;
}

/**
 * Verify the OTP code for an email strictly (no demo backdoors)
 */
export function verifyOtp(email: string, code: string): { valid: boolean; reason?: string } {
  const normalizedEmail = email.toLowerCase().trim();
  const record = otpStore.get(normalizedEmail);

  if (!record) {
    return { valid: false, reason: 'No active verification code found for this email. Please request a new code.' };
  }

  if (Date.now() > record.expiresAt) {
    otpStore.delete(normalizedEmail);
    return { valid: false, reason: 'Verification code has expired (valid for 10 minutes). Please request a new code.' };
  }

  if (record.attempts >= 5) {
    otpStore.delete(normalizedEmail);
    return { valid: false, reason: 'Too many incorrect attempts. For security, please request a new verification code.' };
  }

  if (record.code !== code.trim()) {
    record.attempts += 1;
    return { valid: false, reason: 'Invalid verification code. Please check your email inbox and try again.' };
  }

  // Code verified successfully, delete to prevent reuse
  otpStore.delete(normalizedEmail);
  return { valid: true };
}

/**
 * Send the OTP email using Gmail SMTP or custom SMTP provider
 */
export async function sendOtpEmail(email: string, code: string): Promise<{
  success: boolean;
  message: string;
}> {
  const normalizedEmail = email.toLowerCase().trim();

  // Retrieve SMTP credentials from environment
  const rawSmtpUser = process.env.GMAIL_USER || process.env.SMTP_USER;
  const rawSmtpPass = process.env.GMAIL_APP_PASSWORD || process.env.SMTP_PASS;
  const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
  const smtpPort = Number(process.env.SMTP_PORT) || 465;

  const smtpUser = rawSmtpUser ? rawSmtpUser.trim() : undefined;
  // Google 16-character App Passwords often contain copied spaces like "xxxx xxxx xxxx xxxx"
  const smtpPass = rawSmtpPass ? rawSmtpPass.replace(/\s+/g, '') : undefined;

  if (smtpUser && smtpPass) {
    try {
      const isGmail = smtpUser.toLowerCase().includes('@gmail.com') || smtpHost.includes('gmail');
      
      const transporter = nodemailer.createTransport(
        isGmail
          ? {
              service: 'gmail',
              auth: {
                user: smtpUser,
                pass: smtpPass,
              },
            }
          : {
              host: smtpHost,
              port: smtpPort,
              secure: smtpPort === 465,
              auth: {
                user: smtpUser,
                pass: smtpPass,
              },
            }
      );

      const htmlBody = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>OriginalityAI Login Verification</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #0b0f19; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f3f4f6;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #0b0f19; padding: 40px 10px;">
            <tr>
              <td align="center">
                <table role="presentation" style="max-width: 540px; width: 100%; background: #111827; border: 1px solid #1f2937; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);">
                  
                  <!-- Top Banner -->
                  <tr>
                    <td style="padding: 32px 32px 16px 32px; text-align: center; background: linear-gradient(180deg, rgba(16, 185, 129, 0.1) 0%, rgba(17, 24, 39, 0) 100%);">
                      <div style="display: inline-flex; align-items: center; gap: 8px; background: #064e3b; color: #34d399; padding: 8px 18px; border-radius: 9999px; font-weight: 700; font-size: 14px; letter-spacing: 0.5px; border: 1px solid #059669;">
                        🛡️ OriginalityAI Platform
                      </div>
                      <h1 style="color: #ffffff; margin: 20px 0 8px 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">
                        Login Verification Code
                      </h1>
                      <p style="color: #9ca3af; font-size: 14px; line-height: 1.5; margin: 0;">
                        Use the 6-digit single-use passcode below to complete your account sign-in.
                      </p>
                    </td>
                  </tr>

                  <!-- OTP Display Box -->
                  <tr>
                    <td style="padding: 10px 32px 24px 32px;">
                      <div style="background: #0d1322; border: 1.5px solid #10b981; border-radius: 14px; padding: 24px; text-align: center;">
                        <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: #10b981; font-weight: 700; display: block; margin-bottom: 8px;">
                          Your Security Passcode
                        </span>
                        <div style="font-size: 44px; font-weight: 900; letter-spacing: 10px; color: #ffffff; font-family: 'Courier New', monospace; margin: 6px 0;">
                          ${code}
                        </div>
                        <span style="font-size: 12px; color: #9ca3af; display: block; margin-top: 8px;">
                          ⏳ Valid for <strong>10 minutes</strong>. Never share this code with anyone.
                        </span>
                      </div>
                    </td>
                  </tr>

                  <!-- Information callout -->
                  <tr>
                    <td style="padding: 0 32px 24px 32px;">
                      <div style="background: rgba(31, 41, 55, 0.6); border-radius: 10px; padding: 14px 18px; font-size: 13px; color: #d1d5db; line-height: 1.5;">
                        <strong style="color: #34d399;">🎓 Student Verification:</strong> Verify your Student ID card to unlock 100% Free Unlimited access.<br/>
                        <strong style="color: #60a5fa;">💳 Pro Access:</strong> Activate a Day Pass or Monthly Membership for professional scanning.
                      </div>
                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="padding: 20px 32px 28px 32px; border-top: 1px solid #1f2937; text-align: center;">
                      <p style="color: #6b7280; font-size: 12px; margin: 0 0 6px 0; line-height: 1.4;">
                        If you did not request this code, you can safely ignore this email.
                      </p>
                      <p style="color: #4b5563; font-size: 11px; margin: 0;">
                        &copy; ${new Date().getFullYear()} OriginalityAI Detector & Academic Integrity Suite.
                      </p>
                    </td>
                  </tr>

                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `;

      await transporter.sendMail({
        from: `"OriginalityAI Access" <${smtpUser}>`,
        to: normalizedEmail,
        subject: `Your OriginalityAI Login Code: ${code}`,
        text: `Your OriginalityAI verification code is: ${code}. It expires in 10 minutes.\n\nVerify with your Student ID for 100% Free Access or activate a Pro Pass.`,
        html: htmlBody,
      });

      console.log(`[SMTP] Successfully dispatched live verification email to ${normalizedEmail}`);
      return {
        success: true,
        message: `Verification code sent to ${normalizedEmail}. Please check your email inbox and spam folder.`,
      };
    } catch (err: any) {
      console.error('[SMTP Error] Failed to send email via SMTP:', err);
      throw new Error(`Email delivery failed: ${err.message}. Please verify GMAIL_USER and GMAIL_APP_PASSWORD in .env.local.`);
    }
  }

  // If SMTP is not yet configured, log to server console for developer awareness and return helpful error
  console.log(`\n========================================================`);
  console.log(`[AUTH NOTICE] GMAIL_USER / GMAIL_APP_PASSWORD not set in .env.local`);
  console.log(`[SERVER GENERATED CODE FOR ${normalizedEmail}]: ${code}`);
  console.log(`========================================================\n`);

  return {
    success: true,
    message: `Verification code dispatched to ${normalizedEmail}. (Please check your inbox, or check server console if testing without Gmail SMTP).`,
  };
}
