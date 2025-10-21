"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GmailChecker = void 0;
const googleapis_1 = require("googleapis");
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
const REFRESH_TOKEN = process.env.GOOGLE_REFRESH_TOKEN || '';
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 'https://developers.google.com/oauthplayground';
class GmailChecker {
    constructor() {
        const oAuth2Client = new googleapis_1.google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
        oAuth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });
        this.gmail = googleapis_1.google.gmail({ version: 'v1', auth: oAuth2Client });
    }
    async checkEmail(testCode, email) {
        try {
            // Search for emails with the test code addressed to the given email
            const response = await this.gmail.users.messages.list({
                userId: 'me',
                q: `"${testCode}" to:${email}`,
                maxResults: 1,
            });
            if (!response.data.messages || response.data.messages.length === 0) {
                return { status: 'not_received', folder: 'Not Found' };
            }
            // Get the latest message
            const message = await this.gmail.users.messages.get({
                userId: 'me',
                id: response.data.messages[0].id,
                format: 'metadata',
            });
            const labels = message.data.labelIds || [];
            if (labels.includes('INBOX')) {
                return { status: 'delivered', folder: 'Inbox' };
            }
            else if (labels.includes('SPAM')) {
                return { status: 'spam', folder: 'Spam' };
            }
            else if (labels.includes('CATEGORY_PROMOTIONS')) {
                return { status: 'promotions', folder: 'Promotions' };
            }
            else {
                return { status: 'delivered', folder: 'Other' };
            }
        }
        catch (error) {
            console.error('Gmail check error:', error);
            return { status: 'not_received', folder: 'Error' };
        }
    }
}
exports.GmailChecker = GmailChecker;
