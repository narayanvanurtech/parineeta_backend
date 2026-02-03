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
      const resetURL = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
      
      const mailOptions = {
        from: `"E-Commerce Store" <${process.env.EMAIL_USER}>`,
        to: user.email,
        subject: 'Password Reset Request - E-Commerce Store',
        text: `Hello ${user.firstName || user.name},\n\nYou requested a password reset. Use this link: ${resetURL}\n\nThis link expires in 1 hour.\n\nIf you didn't request this, please ignore this email.`
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
