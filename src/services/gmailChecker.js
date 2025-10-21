const { google } = require('googleapis');

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
const REFRESH_TOKEN = process.env.GOOGLE_REFRESH_TOKEN || '';
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 'https://developers.google.com/oauthplayground';

const oAuth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
oAuth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });

function pickHeader(headers, name) {
  return headers?.find(h => h.name?.toLowerCase() === name.toLowerCase())?.value || '';
}

function classifyByLabels(labelIds = []) {
  // Note: With the authorized Gmail account, you'll often see SENT (sender mailbox).
  if (labelIds.includes('SPAM')) return { status: 'spam', folder: 'spam' };
  if (labelIds.includes('CATEGORY_PROMOTIONS')) return { status: 'promotions', folder: 'promotions' };
  if (labelIds.includes('INBOX')) return { status: 'delivered', folder: 'inbox' };
  if (labelIds.includes('SENT')) return { status: 'delivered', folder: 'sent' };
  return { status: 'delivered', folder: 'other' };
}

async function checkTestCode(testCode) {
  if (!testCode) throw new Error('Missing testCode');

  const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });
  const q = `in:anywhere "${testCode}" newer_than:7d`;

  const list = await gmail.users.messages.list({ userId: 'me', q, maxResults: 10 });
  const messages = list.data.messages || [];

  if (messages.length === 0) {
    return {
      found: false,
      result: {
        provider: 'gmail',
        email: '',
        status: 'not_received',
        folder: 'unknown',
        receivedAt: undefined,
      },
    };
  }

  const first = await gmail.users.messages.get({
    userId: 'me',
    id: messages[0].id,
    format: 'metadata',
    metadataHeaders: ['Subject', 'From', 'To', 'Date', 'Message-Id'],
  });

  const labelIds = first.data.labelIds || [];
  const headers = first.data.payload?.headers || [];
  const { status, folder } = classifyByLabels(labelIds);
  const toHeader = pickHeader(headers, 'To');
  const dateHeader = pickHeader(headers, 'Date');
  const internalDate = first.data.internalDate ? Number(first.data.internalDate) : undefined;

  return {
    found: true,
    messageId: first.data.id,
    result: {
      provider: 'gmail',
      email: toHeader || '',
      status,                 // 'delivered' | 'spam' | 'promotions' | 'not_received'
      folder,                 // 'inbox' | 'spam' | 'promotions' | 'sent' | 'other'
      receivedAt: internalDate
        ? new Date(internalDate).toISOString()
        : (dateHeader ? new Date(dateHeader).toISOString() : undefined),
    },
  };
}

module.exports = { checkTestCode };