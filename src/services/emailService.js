const nodemailer = require('nodemailer');

// Create transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

class EmailService {
  // Send password reset email
 static async sendPasswordResetEmail(user, resetToken) {
    try {

      const FRONTEND_URL = user?.role === "admin"?"http://localhost:8080":"http://localhost:3000"

      console.log("user::::===>",user)
      const resetURL = `${FRONTEND_URL}/${user.role === "admin" ?"admin":"auth"}/reset-password/${resetToken}`;
      
      const mailOptions = {
        from: `"E-Commerce Store" <${process.env.EMAIL_USER}>`,
        to: user.email,
        subject: 'Password Reset Request - E-Commerce Store',
        
        html: `
        <div style="font-family:Arial,sans-serif; max-width:600px; margin:0 auto; border:1px solid #eee; border-radius:8px; overflow:hidden;">
          
          <!-- Header -->
          <div style="background:#800000; padding:2rem 2.5rem; text-align:center;">
            <span style="color:#fff; font-size:18px; font-weight:600;">E-Commerce Store</span>
          </div>

          <!-- Body -->
          <div style="padding:2.5rem;">
            <p style="font-size:13px; text-transform:uppercase; color:#888; letter-spacing:0.06em; margin:0 0 8px;">Password Reset</p>
            <h2 style="margin:0 0 16px; color:#1a1a2e;">Hi ${user.firstName || user.name},</h2>
            <p style="color:#555; line-height:1.6;">
              We received a request to reset the password for your account.
              Click the button below to proceed. This link expires in <strong>1 hour</strong>.
            </p>

            <!-- CTA Button -->
            <div style="text-align:center; margin:2rem 0;">
              <a href="${resetURL}" 
                style="display:inline-block; background:#800000; color:#fff; padding:14px 32px; 
                       border-radius:8px; text-decoration:none; font-weight:600; font-size:15px;">
                Reset Your Password
              </a>
            </div>
          </div>

          <!-- Fallback link -->
          <div style="border-top:1px solid #eee; padding:1.25rem 2.5rem; background:#fafafa;">
            <p style="font-size:13px; color:#555; margin:0 0 8px;">Or paste this URL into your browser:</p>
            <code style="font-size:12px; word-break:break-all; color:#800000;">${resetURL}</code>
          </div>

          <!-- Warning -->
          <div style="padding:1rem 2.5rem;">
            <p style="font-size:13px; color:#888; margin:0;">
              If you didn't request this, please ignore this email or contact support.
            </p>
          </div>

          <!-- Footer -->
          <div style="background:#f9f9f9; border-top:1px solid #eee; padding:1.25rem 2.5rem; text-align:center;">
            <p style="font-size:12px; color:#aaa; margin:0;">E-Commerce Store · Privacy Policy</p>
          </div>

        </div>`
      };

      const info = await transporter.sendMail(mailOptions);
      console.log('Password reset email sent: %s', info.messageId);
      return true;
    } catch (error) {
      console.error('Error sending password reset email:', error);
      return false;
    }
  }

  // Send order confirmation email
  static async sendOrderConfirmation(user, order) {
    try {
      const mailOptions = {
        from: `"E-Commerce Store" <${process.env.EMAIL_USER}>`,
        to: user.email,
        subject: `Order Confirmation - #${order._id}`,
        text: `Hello ${user.firstName || user.name},\n\nYour order #${order._id} has been confirmed.\n\nTotal Amount: $${order.total}\n\nThank you for your purchase!`
      };

      const info = await transporter.sendMail(mailOptions);
      console.log('Order confirmation email sent: %s', info.messageId);
      return true;
    } catch (error) {
      console.error('Error sending order confirmation email:', error);
      return false;
    }
  }
}

module.exports = EmailService;
