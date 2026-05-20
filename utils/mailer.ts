import nodemailer from 'nodemailer';

let transporter: nodemailer.Transporter | null = null;

/**
 * Returns or initializes the nodemailer transporter.
 * If SMTP environment variables are not provided, it falls back to an Ethereal test account.
 */
export const getTransporter = async (): Promise<nodemailer.Transporter> => {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (host && user && pass) {
    console.log('⚡ Initializing custom SMTP transporter...');
    transporter = nodemailer.createTransport({
      host,
      port,
      secure: process.env.SMTP_SECURE === 'true' || port === 465,
      auth: { user, pass },
    });
  } else {
    console.log('⚠️ SMTP credentials not fully configured in .env. Creating Ethereal sandbox account...');
    try {
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
      console.log('------------------------------------------------------------');
      console.log('✨ Ethereal SMTP test account successfully generated!');
      console.log(`📧 Sandbox User: ${testAccount.user}`);
      console.log(`🔑 Sandbox Pass: ${testAccount.pass}`);
      console.log('------------------------------------------------------------');
    } catch (err) {
      console.error('❌ Failed to create Ethereal test account:', err);
      throw err;
    }
  }

  return transporter;
};

/**
 * Sends a verification email with a premium HTML template.
 */
export const sendVerificationEmail = async (to: string, name: string, verificationLink: string): Promise<boolean> => {
  try {
    const activeTransporter = await getTransporter();
    
    const emailFrom = process.env.EMAIL_FROM || '"Storeverse Support" <noreply@storeverse.com>';
    
    const mailOptions = {
      from: emailFrom,
      to,
      subject: 'Verify Your Storeverse Account',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verify Your Storeverse Account</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
              background-color: #f8fafc;
              margin: 0;
              padding: 0;
              -webkit-font-smoothing: antialiased;
            }
            .container {
              max-width: 600px;
              margin: 40px auto;
              padding: 0 20px;
            }
            .card {
              background-color: #ffffff;
              border-radius: 16px;
              box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
              border: 1px solid #e2e8f0;
              overflow: hidden;
            }
            .header {
              background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
              padding: 40px 20px;
              text-align: center;
            }
            .header h1 {
              color: #ffffff;
              font-size: 28px;
              font-weight: 800;
              margin: 0;
              letter-spacing: -0.5px;
            }
            .content {
              padding: 40px 30px;
            }
            .welcome-text {
              font-size: 16px;
              color: #334155;
              line-height: 1.6;
              margin-bottom: 24px;
            }
            .btn-container {
              text-align: center;
              margin: 32px 0;
            }
            .btn {
              display: inline-block;
              background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
              color: #ffffff !important;
              text-decoration: none;
              padding: 14px 32px;
              border-radius: 8px;
              font-weight: bold;
              font-size: 16px;
              box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);
            }
            .instruction {
              font-size: 14px;
              color: #64748b;
              margin-top: 12px;
              text-align: center;
            }
            .link-fallback {
              margin-top: 24px;
              padding-top: 20px;
              border-top: 1px solid #f1f5f9;
            }
            .link-fallback-text {
              font-size: 12px;
              color: #64748b;
              line-height: 1.5;
              margin: 0;
            }
            .link-url {
              font-size: 12px;
              color: #4f46e5;
              word-break: break-all;
              margin: 8px 0 0 0;
            }
            .info-box {
              background-color: #eff6ff;
              border-left: 4px solid #3b82f6;
              border-radius: 4px;
              padding: 16px;
              margin-bottom: 24px;
            }
            .info-text {
              font-size: 14px;
              color: #1e3a8a;
              line-height: 1.5;
              margin: 0;
            }
            .footer {
              text-align: center;
              padding: 30px;
              background-color: #f8fafc;
              border-top: 1px solid #f1f5f9;
            }
            .footer p {
              font-size: 12px;
              color: #94a3b8;
              margin: 4px 0;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="card">
              <div class="header">
                <h1>Storeverse</h1>
              </div>
              <div class="content">
                <p class="welcome-text">Hi ${name},</p>
                <p class="welcome-text">Thank you for getting started with <strong>Storeverse</strong>! To verify your email address and continue setting up your account, please click the button below:</p>
                
                <div class="btn-container">
                  <a href="${verificationLink}" class="btn" target="_blank">Verify Email Address</a>
                  <div class="instruction">This verification link is valid for 24 hours.</div>
                </div>

                <div class="link-fallback">
                  <p class="link-fallback-text">If you're having trouble clicking the button above, copy and paste the URL below into your web browser:</p>
                  <p class="link-url"><a href="${verificationLink}" style="color: #4f46e5; text-decoration: underline;">${verificationLink}</a></p>
                </div>

                <div style="margin-top: 24px;" class="info-box">
                  <p class="info-text"><strong>Security Notice:</strong> If you did not request this email, please ignore it. Your email will not be verified or registered unless you click the link.</p>
                </div>
                
                <p class="welcome-text">Best regards,<br>The Storeverse Team</p>
              </div>
              <div class="footer">
                <p>&copy; ${new Date().getFullYear()} Storeverse. All rights reserved.</p>
                <p>Designed to supercharge your e-commerce experience.</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `
    };

    const info = await activeTransporter.sendMail(mailOptions);
    console.log(`✅ Verification email sent to: ${to}`);
    
    // If it's an Ethereal sandbox account, log the URL to view the message!
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log('------------------------------------------------------------');
      console.log('🔗 VIEW SENT EMAIL SANDBOX PREVIEW HERE:');
      console.log(previewUrl);
      console.log('------------------------------------------------------------');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Error sending verification email:', error);
    return false;
  }
};
