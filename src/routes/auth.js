const express = require('express');
const User = require('../models/User');

const router = express.Router();

router.post('/identify', async (req, res, next) => {
  try {
    const { email } = req.body || {};
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const normalized = String(email).toLowerCase().trim();
    const user = await User.findOneAndUpdate(
      { email: normalized },
      { $setOnInsert: { createdAt: new Date() } },
      { new: true, upsert: true }
    );

    res.json({ ok: true, userId: user._id, email: user.email });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
