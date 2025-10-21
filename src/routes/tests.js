const express = require('express');
const crypto = require('crypto');
const Test = require('../models/Test');
const { EmailService } = require('../services/emailService');
const { checkTestCode } = require('../services/gmailChecker');
const router = express.Router();

const emailService = new EmailService();

router.post('/create', async (req, res, next) => {
  try {
    const { userEmail } = req.body || {};
    if (!userEmail) return res.status(400).json({ error: 'userEmail is required' });

    const code = crypto.randomBytes(3).toString('hex'); // 6 hex chars
    const test = await Test.create({
      testCode: code,
      userEmail: String(userEmail).toLowerCase().trim(),
    });

    res.status(201).json({ ok: true, testCode: test.testCode });
  } catch (err) {
    if (err && err.code === 11000) {
      return res.status(409).json({ error: 'Duplicate testCode' });
    }
    next(err);
  }
});

router.get('/:testCode', async (req, res, next) => {
  try {
    const { testCode } = req.params;
    const test = await Test.findOne({ testCode });
    if (!test) return res.status(404).json({ error: 'Test not found' });
    res.json({ ok: true, test });
  } catch (err) {
    next(err);
  }
});

router.post('/:testCode/process', async (req, res, next) => {
  try {
    const { testCode } = req.params;
    const test = await Test.findOneAndUpdate(
      { testCode },
      { $set: { status: 'processing', updatedAt: new Date() } },
      { new: true }
    );
    if (!test) return res.status(404).json({ error: 'Test not found' });
    // Simulate processing work here
    res.json({ ok: true, status: test.status });
  } catch (err) {
    next(err);
  }
});

// Send mail: force from AUTHORIZED_EMAIL and a safe display name
router.post('/send-email', async (req, res) => {
  try {
    const { to, subject, text, html, testCode } = req.body || {};
    if (!to) return res.status(400).json({ error: 'Missing "to"' });

    await emailService.sendMail({
      to,
      subject: subject || (testCode ? `Email Deliverability Report - ${testCode}` : 'Test email'),
      text: text || 'This is a test email.',
      html,
      fromName: 'EmailSpan', // enforce display name; actual sender is AUTHORIZED_EMAIL
    });

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('send-email error', err);
    return res.status(500).json({ error: 'Failed to send email' });
  }
});

// Process: use the exported function directly
router.post('/process', async (req, res) => {
  try {
    const { testCode } = req.body || {};
    if (!testCode) return res.status(400).json({ error: 'Missing testCode' });

    const gmail = await checkTestCode(testCode);
    const results = [gmail.result].filter(Boolean);

    const scoreMap = { delivered: 100, promotions: 80, spam: 20, not_received: 0 };
    const overallScore = results.length
      ? Math.round(results.reduce((s, r) => s + (scoreMap[r.status] ?? 0), 0) / results.length)
      : 0;

    const data = {
      testCode,
      status: 'completed',
      results,
      overallScore,
      completedAt: new Date().toISOString(),
    };

    return res.status(200).json({ ok: true, data });
  } catch (err) {
    console.error('process error', err);
    return res.status(500).json({ error: 'Failed to process test' });
  }
});

module.exports = router;
