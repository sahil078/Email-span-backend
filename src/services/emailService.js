const nodemailer = require('nodemailer');
const { google } = require('googleapis');

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
const REFRESH_TOKEN = process.env.GOOGLE_REFRESH_TOKEN || '';
const AUTHORIZED_EMAIL = process.env.AUTHORIZED_EMAIL || '';
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 'https://developers.google.com/oauthplayground';

class EmailService {
  constructor() {
    this.oAuth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
    this.oAuth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });
  }

  // Sends the existing report email using OAuth2 auth
  async sendReportEmail(to, testCode, reportUrl, fromName) {
    const subject = `Email Deliverability Report - ${testCode}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Email Deliverability Report</h2>
        <p>Your email deliverability test has been completed.</p>
        <p><strong>Test Code:</strong> ${testCode}</p>
        <p><a href="${reportUrl}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">View Full Report</a></p>
        <p>This report will be available for 7 days.</p>
      </div>`;

    await this.sendMail({ to, subject, text: `View report: ${reportUrl}`, html, fromName });
  }

  // Generic OAuth2 Gmail sender
  async sendMail(opts) {
    const accessToken = await this.oAuth2Client.getAccessToken();

    const transport = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        type: 'OAuth2',
        user: AUTHORIZED_EMAIL,
        clientId: CLIENT_ID,
        clientSecret: CLIENT_SECRET,
        refreshToken: REFRESH_TOKEN,
        accessToken: accessToken?.token || undefined,
      },
    });

    const fromHeader = opts.fromName ? `${opts.fromName} <${AUTHORIZED_EMAIL}>` : `Sender <${AUTHORIZED_EMAIL}>`;

    await transport.sendMail({
      from: fromHeader,
      to: opts.to,
      subject: opts.subject,
      text: opts.text,
      html: opts.html || opts.text,
    });
  }
}

module.exports = { EmailService };