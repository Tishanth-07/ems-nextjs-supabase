/**
 * Generate a random 6-digit verification code
 */
export function generateVerificationCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString()
}

/**
 * Email template for verification code
 */
export function getVerificationEmailTemplate(fullName: string, code: string): { subject: string; html: string; text: string } {
    const subject = 'Verify Your Employee Account'

    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: #1e293b; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
                .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
                .code { background: white; border: 2px dashed #3b82f6; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 8px; margin: 20px 0; border-radius: 8px; color: #1e293b; }
                .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }
                .warning { color: #f59e0b; margin-top: 20px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Employee Management System</h1>
                </div>
                <div class="content">
                    <h2>Hi ${fullName},</h2>
                    <p>Welcome! Your employee account has been created.</p>
                    <p>To activate your account, please use the verification code below:</p>
                    
                    <div class="code">${code}</div>
                    
                    <p><strong>This code will expire in 10 minutes.</strong></p>
                    
                    <p>If you didn't request this account, please ignore this email or contact your administrator.</p>
                    
                    <div class="footer">
                        <p>This is an automated message. Please do not reply to this email.</p>
                    </div>
                </div>
            </div>
        </body>
        </html>
    `

    const text = `
Hi ${fullName},

Welcome! Your employee account has been created.

Your verification code is: ${code}

This code will expire in 10 minutes.

If you didn't request this account, please ignore this email or contact your administrator.

---
This is an automated message. Please do not reply to this email.
    `

    return { subject, html, text }
}
