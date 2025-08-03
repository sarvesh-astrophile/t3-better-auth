import nodemailer from "nodemailer";
import { env } from "@/env";

// Development email storage for localhost
const developmentEmails: Array<{
  to: string;
  subject: string;
  html: string;
  text: string;
  url: string;
  token: string;
  type: 'verification' | 'reset';
  timestamp: Date;
}> = [];

// Check if we're in development mode
const isDevelopment = env.NODE_ENV === "development";

// Create transporter using Plunk SMTP
export const createEmailTransporter = () => {
  // For development, we can skip SMTP validation
  if (!isDevelopment) {
    if (!env.SMTP_HOST || !env.SMTP_PASSWORD) {
      throw new Error("SMTP configuration is missing. Please set SMTP_HOST and SMTP_PASSWORD environment variables.");
    }

    if (!env.EMAIL_FROM) {
      throw new Error("EMAIL_FROM environment variable is required. Please set it to a verified email address in your Plunk account.");
    }
  }

  return nodemailer.createTransport({
    host: env.SMTP_HOST || "localhost",
    port: parseInt(env.SMTP_PORT || "465"),
    secure: env.SMTP_PORT !== "587", // Use SSL/TLS for port 465, STARTTLS for 587
    auth: env.SMTP_USERNAME && env.SMTP_PASSWORD ? {
      user: env.SMTP_USERNAME || "plunk",
      pass: env.SMTP_PASSWORD,
    } : undefined,
  });
};

// Development email display functions
const logEmailToConsole = (email: typeof developmentEmails[0]) => {
  console.log("\n" + "=".repeat(80));
  console.log("📧 EMAIL VERIFICATION (DEVELOPMENT MODE)");
  console.log("=".repeat(80));
  console.log(`📬 To: ${email.to}`);
  console.log(`📌 Subject: ${email.subject}`);
  console.log(`🔗 Verification URL: ${email.url}`);
  console.log(`🔑 Token: ${email.token}`);
  console.log(`⏰ Sent: ${email.timestamp.toLocaleString()}`);
  console.log("=".repeat(80));
  console.log("📖 Email Content (Text):");
  console.log(email.text);
  console.log("=".repeat(80) + "\n");
};

// Get development emails (for API endpoint)
export const getDevelopmentEmails = () => developmentEmails;

// Clear development emails
export const clearDevelopmentEmails = () => {
  developmentEmails.length = 0;
};

// Send email verification
export const sendVerificationEmail = async ({
  to,
  url,
  token,
}: {
  to: string;
  url: string;
  token: string;
}) => {
  const { host } = new URL(url);
  const escapedHost = host.replace(/\./g, "&#8203;.");
  
  const emailData = {
    to,
    subject: `Verify your email address for ${host}`,
    html: getVerificationEmailHtml({ url, host: escapedHost }),
    text: getVerificationEmailText({ url, host }),
    url,
    token,
    type: 'verification' as const,
    timestamp: new Date(),
  };

  // In development, log to console and store for API access
  if (isDevelopment) {
    developmentEmails.unshift(emailData); // Add to beginning of array
    
    // Keep only last 20 emails
    if (developmentEmails.length > 20) {
      developmentEmails.length = 20;
    }
    
    logEmailToConsole(emailData);
    
    // Return mock success response
    return {
      messageId: `dev-${Date.now()}`,
      accepted: [to],
      rejected: [],
      pending: [],
    };
  }

  // Production: send real email
  const transporter = createEmailTransporter();
  
  try {
    const result = await transporter.sendMail({
      from: env.EMAIL_FROM,
      to,
      subject: emailData.subject,
      html: emailData.html,
      text: emailData.text,
    });

    const failed = result.rejected.concat(result.pending).filter(Boolean);
    if (failed.length) {
      throw new Error(`Email(s) (${failed.join(", ")}) could not be sent`);
    }
    
    return result;
  } catch (error: any) {
    console.error("Email sending error:", error);
    
    // Provide more helpful error messages for common issues
    if (error.code === 'EENVELOPE' && error.response?.includes('domain is not associated')) {
      throw new Error("The email domain is not verified with your Plunk account. Please verify your domain in the Plunk dashboard or use a verified email address.");
    }
    
    if (error.code === 'EAUTH') {
      throw new Error("SMTP authentication failed. Please check your Plunk API key in the SMTP_PASSWORD environment variable.");
    }
    
    throw error;
  }
};

// Send password reset email
export const sendPasswordResetEmail = async ({
  to,
  url,
  token,
}: {
  to: string;
  url: string;
  token: string;
}) => {
  const { host } = new URL(url);
  const escapedHost = host.replace(/\./g, "&#8203;.");
  
  const emailData = {
    to,
    subject: `Reset your password for ${host}`,
    html: getPasswordResetEmailHtml({ url, host: escapedHost }),
    text: getPasswordResetEmailText({ url, host }),
    url,
    token,
    type: 'reset' as const,
    timestamp: new Date(),
  };

  // In development, log to console and store for API access
  if (isDevelopment) {
    developmentEmails.unshift(emailData); // Add to beginning of array
    
    // Keep only last 20 emails
    if (developmentEmails.length > 20) {
      developmentEmails.length = 20;
    }
    
    logEmailToConsole(emailData);
    
    // Return mock success response
    return {
      messageId: `dev-${Date.now()}`,
      accepted: [to],
      rejected: [],
      pending: [],
    };
  }

  // Production: send real email
  const transporter = createEmailTransporter();
  
  try {
    const result = await transporter.sendMail({
      from: env.EMAIL_FROM,
      to,
      subject: emailData.subject,
      html: emailData.html,
      text: emailData.text,
    });

    const failed = result.rejected.concat(result.pending).filter(Boolean);
    if (failed.length) {
      throw new Error(`Email(s) (${failed.join(", ")}) could not be sent`);
    }
    
    return result;
  } catch (error: any) {
    console.error("Email sending error:", error);
    
    // Provide more helpful error messages for common issues
    if (error.code === 'EENVELOPE' && error.response?.includes('domain is not associated')) {
      throw new Error("The email domain is not verified with your Plunk account. Please verify your domain in the Plunk dashboard or use a verified email address.");
    }
    
    if (error.code === 'EAUTH') {
      throw new Error("SMTP authentication failed. Please check your Plunk API key in the SMTP_PASSWORD environment variable.");
    }
    
    throw error;
  }
};

// Email verification HTML template
const getVerificationEmailHtml = ({ url, host }: { url: string; host: string }) => {
  const brandColor = "#346df1";
  const color = {
    background: "#f9f9f9",
    text: "#444",
    mainBackground: "#fff",
    buttonBackground: brandColor,
    buttonBorder: brandColor,
    buttonText: "#fff",
  };

  return `
<body style="background: ${color.background};">
  <table width="100%" border="0" cellspacing="20" cellpadding="0"
    style="background: ${color.mainBackground}; max-width: 600px; margin: auto; border-radius: 10px;">
    <tr>
      <td align="center"
        style="padding: 10px 0px; font-size: 22px; font-family: Helvetica, Arial, sans-serif; color: ${color.text};">
        Verify your email for <strong>${host}</strong>
      </td>
    </tr>
    <tr>
      <td align="center" style="padding: 20px 0;">
        <table border="0" cellspacing="0" cellpadding="0">
          <tr>
            <td align="center" style="border-radius: 5px;" bgcolor="${color.buttonBackground}">
              <a href="${url}" target="_blank"
                style="font-size: 18px; font-family: Helvetica, Arial, sans-serif; color: ${color.buttonText}; text-decoration: none; border-radius: 5px; padding: 10px 20px; border: 1px solid ${color.buttonBorder}; display: inline-block; font-weight: bold;">
                Verify Email
              </a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td align="center"
        style="padding: 0px 0px 10px 0px; font-size: 16px; line-height: 22px; font-family: Helvetica, Arial, sans-serif; color: ${color.text};">
        If you did not request this email you can safely ignore it.
      </td>
    </tr>
  </table>
</body>
`;
};

// Email verification text template (fallback)
const getVerificationEmailText = ({ url, host }: { url: string; host: string }) => {
  return `Verify your email for ${host}\n\nClick this link to verify your email:\n${url}\n\nIf you did not request this email you can safely ignore it.`;
};

// Password reset HTML template
const getPasswordResetEmailHtml = ({ url, host }: { url: string; host: string }) => {
  const brandColor = "#dc2626";
  const color = {
    background: "#f9f9f9",
    text: "#444",
    mainBackground: "#fff",
    buttonBackground: brandColor,
    buttonBorder: brandColor,
    buttonText: "#fff",
  };

  return `
<body style="background: ${color.background};">
  <table width="100%" border="0" cellspacing="20" cellpadding="0"
    style="background: ${color.mainBackground}; max-width: 600px; margin: auto; border-radius: 10px;">
    <tr>
      <td align="center"
        style="padding: 10px 0px; font-size: 22px; font-family: Helvetica, Arial, sans-serif; color: ${color.text};">
        Reset your password for <strong>${host}</strong>
      </td>
    </tr>
    <tr>
      <td align="center" style="padding: 20px 0;">
        <table border="0" cellspacing="0" cellpadding="0">
          <tr>
            <td align="center" style="border-radius: 5px;" bgcolor="${color.buttonBackground}">
              <a href="${url}" target="_blank"
                style="font-size: 18px; font-family: Helvetica, Arial, sans-serif; color: ${color.buttonText}; text-decoration: none; border-radius: 5px; padding: 10px 20px; border: 1px solid ${color.buttonBorder}; display: inline-block; font-weight: bold;">
                Reset Password
              </a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td align="center"
        style="padding: 0px 0px 10px 0px; font-size: 16px; line-height: 22px; font-family: Helvetica, Arial, sans-serif; color: ${color.text};">
        If you did not request this email you can safely ignore it. This link will expire in 24 hours.
      </td>
    </tr>
  </table>
</body>
`;
};

// Password reset text template (fallback)
const getPasswordResetEmailText = ({ url, host }: { url: string; host: string }) => {
  return `Reset your password for ${host}\n\nClick this link to reset your password:\n${url}\n\nIf you did not request this email you can safely ignore it. This link will expire in 24 hours.`;
};