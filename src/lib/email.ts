import nodemailer from "nodemailer";
import { env } from "@/env";

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
const logOTPToConsole = (to: string, otp: string, type: string) => {
  console.log("\n" + "=".repeat(80));
  console.log(`📧 EMAIL VERIFICATION OTP (DEVELOPMENT MODE)`);
  console.log("=".repeat(80));
  console.log(`📬 To: ${to}`);
  console.log(`🔐 OTP CODE: ${otp}`);
  console.log(`📋 Type: ${type}`);
  console.log(`⏰ Sent: ${new Date().toLocaleString()}`);
  console.log("=".repeat(80) + "\n");
};

const logEmailToConsole = (to: string, subject: string, url?: string, token?: string) => {
  console.log("\n" + "=".repeat(80));
  console.log(`📧 EMAIL (DEVELOPMENT MODE)`);
  console.log("=".repeat(80));
  console.log(`📬 To: ${to}`);
  console.log(`📌 Subject: ${subject}`);
  if (url) {
    console.log(`🔗 URL: ${url}`);
  }
  if (token) {
    console.log(`🔑 Token: ${token}`);
  }
  console.log(`⏰ Sent: ${new Date().toLocaleString()}`);
  console.log("=".repeat(80) + "\n");
};

// Send OTP email
export const sendOTPEmail = async ({
  to,
  otp,
  type,
}: {
  to: string;
  otp: string;
  type: 'email-verification' | 'sign-in' | 'forget-password';
}) => {
  const host = env.BETTER_AUTH_URL ? new URL(env.BETTER_AUTH_URL).host : 'localhost:3000';
  
  // In development, just log OTP to console and return success
  if (isDevelopment) {
    logOTPToConsole(to, otp, type);
    
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
      subject: getOTPSubject(type, host),
      html: getOTPEmailHtml({ otp, type, host }),
      text: getOTPEmailText({ otp, type, host }),
    });

    const failed = result.rejected.concat(result.pending).filter(Boolean);
    if (failed.length) {
      throw new Error(`Email(s) (${failed.join(", ")}) could not be sent`);
    }
    
    return result;
  } catch (error: any) {
    console.error("OTP email sending error:", error);
    
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

// Send email verification (deprecated - keeping for compatibility)
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
  const subject = `Verify your email address for ${host}`;

  // In development, just log to console and return success
  if (isDevelopment) {
    logEmailToConsole(to, subject, url, token);
    
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
      subject,
      html: getVerificationEmailHtml({ url, host: escapedHost }),
      text: getVerificationEmailText({ url, host }),
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
  const subject = `Reset your password for ${host}`;

  // In development, just log to console and return success
  if (isDevelopment) {
    logEmailToConsole(to, subject, url, token);
    
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
      subject,
      html: getPasswordResetEmailHtml({ url, host: escapedHost }),
      text: getPasswordResetEmailText({ url, host }),
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

// OTP email helper functions
const getOTPSubject = (type: 'email-verification' | 'sign-in' | 'forget-password', host: string) => {
  switch (type) {
    case 'email-verification':
      return `Verify your email address for ${host}`;
    case 'sign-in':
      return `Your sign-in code for ${host}`;
    case 'forget-password':
      return `Reset your password for ${host}`;
    default:
      return `Your verification code for ${host}`;
  }
};

// OTP email HTML template
const getOTPEmailHtml = ({ otp, type, host }: { otp: string; type: string; host: string }) => {
  const brandColor = type === 'forget-password' ? "#dc2626" : "#346df1";
  const color = {
    background: "#f9f9f9",
    text: "#444",
    mainBackground: "#fff",
    buttonBackground: brandColor,
    buttonBorder: brandColor,
    buttonText: "#fff",
  };

  const getTitle = () => {
    switch (type) {
      case 'email-verification':
        return `Verify your email for <strong>${host}</strong>`;
      case 'sign-in':
        return `Sign in to <strong>${host}</strong>`;
      case 'forget-password':
        return `Reset your password for <strong>${host}</strong>`;
      default:
        return `Your verification code for <strong>${host}</strong>`;
    }
  };

  const getInstructions = () => {
    switch (type) {
      case 'email-verification':
        return 'Enter this code to verify your email address:';
      case 'sign-in':
        return 'Enter this code to sign in to your account:';
      case 'forget-password':
        return 'Enter this code to reset your password:';
      default:
        return 'Enter this verification code:';
    }
  };

  return `
<body style="background: ${color.background};">
  <table width="100%" border="0" cellspacing="20" cellpadding="0"
    style="background: ${color.mainBackground}; max-width: 600px; margin: auto; border-radius: 10px;">
    <tr>
      <td align="center"
        style="padding: 10px 0px; font-size: 22px; font-family: Helvetica, Arial, sans-serif; color: ${color.text};">
        ${getTitle()}
      </td>
    </tr>
    <tr>
      <td align="center"
        style="padding: 10px 0px; font-size: 16px; font-family: Helvetica, Arial, sans-serif; color: ${color.text};">
        ${getInstructions()}
      </td>
    </tr>
    <tr>
      <td align="center" style="padding: 20px 0;">
        <div style="background: ${color.buttonBackground}; border-radius: 8px; padding: 15px 30px; display: inline-block;">
          <span style="font-size: 32px; font-family: 'Courier New', monospace; color: ${color.buttonText}; font-weight: bold; letter-spacing: 8px;">
            ${otp}
          </span>
        </div>
      </td>
    </tr>
    <tr>
      <td align="center"
        style="padding: 0px 0px 10px 0px; font-size: 16px; line-height: 22px; font-family: Helvetica, Arial, sans-serif; color: ${color.text};">
        This code will expire in 5 minutes. If you did not request this code, you can safely ignore this email.
      </td>
    </tr>
  </table>
</body>
`;
};

// OTP email text template (fallback)
const getOTPEmailText = ({ otp, type, host }: { otp: string; type: string; host: string }) => {
  const getInstructions = () => {
    switch (type) {
      case 'email-verification':
        return `Verify your email for ${host}`;
      case 'sign-in':
        return `Sign in to ${host}`;
      case 'forget-password':
        return `Reset your password for ${host}`;
      default:
        return `Your verification code for ${host}`;
    }
  };

  return `${getInstructions()}\n\nYour verification code is: ${otp}\n\nThis code will expire in 5 minutes. If you did not request this code, you can safely ignore this email.`;
};