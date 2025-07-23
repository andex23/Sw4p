// backend/services/emailService.js
const nodemailer = require('nodemailer');

// Configure the email transporter
// For Gmail, you might need to use an "App Password" if you have 2FA enabled
// See: https://support.google.com/accounts/answer/185833
const transporter = nodemailer.createTransport({
  service: 'gmail',  // or another service like 'outlook', 'hotmail', etc.
  auth: {
    user: process.env.EMAIL_USER || 'your-email@gmail.com',
    pass: process.env.EMAIL_PASS || 'your-email-password'
  }
});

/**
 * Send an email notification
 * @param {Object} transaction - The transaction details
 * @returns {Promise} - Promise that resolves when email is sent
 */
async function sendTransactionNotification(transaction) {
  try {
    // Format the transaction details for the email
    const subject = `New Sw4p Transaction: ${transaction.fromAmount} ${transaction.fromCurrency} to ${transaction.toCurrency}`;
    
    const htmlContent = `
      <h2>New Sw4p Transaction Received</h2>
      <p>A new cryptocurrency swap transaction has been submitted and requires your attention.</p>
      
      <h3>Transaction Details:</h3>
      <table style="border-collapse: collapse; width: 100%;">
        <tr style="background-color: #f2f2f2;">
          <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Transaction ID</th>
          <td style="border: 1px solid #ddd; padding: 8px;">${transaction.id}</td>
        </tr>
        <tr>
          <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">From</th>
          <td style="border: 1px solid #ddd; padding: 8px;">${transaction.fromAmount} ${transaction.fromCurrency}</td>
        </tr>
        <tr style="background-color: #f2f2f2;">
          <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">To</th>
          <td style="border: 1px solid #ddd; padding: 8px;">${transaction.toAmount} ${transaction.toCurrency}</td>
        </tr>
        <tr>
          <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Fee (1.7%)</th>
          <td style="border: 1px solid #ddd; padding: 8px;">${transaction.feeAmount} ${transaction.toCurrency}</td>
        </tr>
        <tr style="background-color: #f2f2f2;">
          <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Receiving Address</th>
          <td style="border: 1px solid #ddd; padding: 8px;">${transaction.receivingAddress}</td>
        </tr>
        <tr>
          <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Status</th>
          <td style="border: 1px solid #ddd; padding: 8px;">${transaction.status}</td>
        </tr>
        <tr style="background-color: #f2f2f2;">
          <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Time</th>
          <td style="border: 1px solid #ddd; padding: 8px;">${new Date(transaction.timestamp).toLocaleString()}</td>
        </tr>
      </table>
      
      <p style="margin-top: 20px;">Please log in to your admin panel to process this transaction.</p>
      <p><a href="http://localhost:5001/admin.html" style="background-color: #4CAF50; color: white; padding: 10px 15px; text-align: center; text-decoration: none; display: inline-block; border-radius: 4px;">Go to Admin Panel</a></p>
    `;
    
    // Configure email options
    const mailOptions = {
      from: process.env.EMAIL_USER || 'your-email@gmail.com',
      to: process.env.ADMIN_EMAIL || 'your-admin-email@gmail.com',
      subject: subject,
      html: htmlContent,
      text: `New Sw4p Transaction: ${transaction.fromAmount} ${transaction.fromCurrency} to ${transaction.toAmount} ${transaction.toCurrency} (Fee: ${transaction.feeAmount} ${transaction.toCurrency}). Receiving address: ${transaction.receivingAddress}. Status: ${transaction.status}. Transaction ID: ${transaction.id}.`
    };
    
    // Send the email
    const info = await transporter.sendMail(mailOptions);
    console.log('Email notification sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending email notification:', error);
    throw error;
  }
}

module.exports = {
  sendTransactionNotification
};