import { NextRequest, NextResponse } from "next/server";
import { getDevelopmentEmails, clearDevelopmentEmails } from "@/lib/email";
import { env } from "@/env";

// Only allow in development
const isDevelopment = env.NODE_ENV === "development";

export async function GET() {
  if (!isDevelopment) {
    return NextResponse.json({ error: "Not available in production" }, { status: 404 });
  }

  const emails = getDevelopmentEmails();
  
  // Create a simple HTML interface to view emails
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Development Emails - Better Auth</title>
    <style>
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            margin: 0; 
            padding: 20px; 
            background: #f5f5f5;
        }
        .header { 
            background: white; 
            padding: 20px; 
            border-radius: 8px; 
            margin-bottom: 20px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        .email-list { 
            max-width: 1200px; 
            margin: 0 auto; 
        }
        .email-item { 
            background: white; 
            margin-bottom: 15px; 
            border-radius: 8px; 
            overflow: hidden;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        .email-header { 
            padding: 15px 20px; 
            background: #f8f9fa; 
            border-bottom: 1px solid #e9ecef;
            cursor: pointer;
        }
        .email-header:hover { background: #e9ecef; }
        .email-content { 
            padding: 20px; 
            display: none; 
        }
        .email-content.open { display: block; }
        .verification-badge { 
            background: #28a745; 
            color: white; 
            padding: 4px 8px; 
            border-radius: 4px; 
            font-size: 12px;
            margin-left: 10px;
        }
        .reset-badge { 
            background: #dc3545; 
            color: white; 
            padding: 4px 8px; 
            border-radius: 4px; 
            font-size: 12px;
            margin-left: 10px;
        }
        .url-link { 
            color: #007bff; 
            text-decoration: none; 
            word-break: break-all;
            background: #f8f9fa;
            padding: 10px;
            border-radius: 4px;
            display: block;
            margin: 10px 0;
        }
        .url-link:hover { text-decoration: underline; }
        .clear-btn {
            background: #dc3545;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 4px;
            cursor: pointer;
            margin-left: 10px;
        }
        .clear-btn:hover { background: #c82333; }
        .empty-state {
            text-align: center;
            padding: 60px 20px;
            color: #6c757d;
        }
        .token { 
            font-family: monospace; 
            background: #e9ecef; 
            padding: 2px 4px; 
            border-radius: 3px;
        }
    </style>
</head>
<body>
    <div class="email-list">
        <div class="header">
            <h1>📧 Development Emails</h1>
            <p>Email verification links for localhost development</p>
            <button onclick="location.reload()">🔄 Refresh</button>
            <button class="clear-btn" onclick="clearEmails()">🗑️ Clear All</button>
        </div>
        
        ${emails.length === 0 ? `
            <div class="empty-state">
                <h3>No emails yet</h3>
                <p>Sign up or request password reset to see emails here</p>
            </div>
        ` : emails.map((email, index) => `
            <div class="email-item">
                <div class="email-header" onclick="toggleEmail(${index})">
                    <strong>${email.to}</strong>
                    <span class="${email.type}-badge">${email.type.toUpperCase()}</span>
                    <div style="font-size: 14px; color: #6c757d; margin-top: 5px;">
                        ${email.subject} • ${email.timestamp.toLocaleString()}
                    </div>
                </div>
                <div class="email-content" id="email-${index}">
                    <h4>🔗 Verification URL:</h4>
                    <a href="${email.url}" class="url-link" target="_blank">${email.url}</a>
                    
                    <h4>🔑 Token:</h4>
                    <span class="token">${email.token}</span>
                    
                    <h4>📧 Email Content:</h4>
                    <div style="background: #f8f9fa; padding: 15px; border-radius: 4px; white-space: pre-wrap;">${email.text}</div>
                </div>
            </div>
        `).join('')}
    </div>

    <script>
        function toggleEmail(index) {
            const content = document.getElementById('email-' + index);
            content.classList.toggle('open');
        }
        
        async function clearEmails() {
            if (confirm('Clear all development emails?')) {
                await fetch('/api/dev-emails', { method: 'DELETE' });
                location.reload();
            }
        }
    </script>
</body>
</html>`;

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html" },
  });
}

export async function DELETE() {
  if (!isDevelopment) {
    return NextResponse.json({ error: "Not available in production" }, { status: 404 });
  }

  clearDevelopmentEmails();
  return NextResponse.json({ success: true });
}

export async function POST(request: NextRequest) {
  if (!isDevelopment) {
    return NextResponse.json({ error: "Not available in production" }, { status: 404 });
  }

  // API endpoint to get emails as JSON
  const emails = getDevelopmentEmails();
  return NextResponse.json({ emails });
}