const mongoose = require("mongoose");

const TestResultSchema = new mongoose.Schema({
  provider: { type: String, required: true },
  email: { type: String, required: true },
  status: {
    type: String,
    enum: ['delivered', 'spam', 'promotions', 'not_received', 'pending'],
    required: true,
  },
  folder: { type: String, required: true },
  receivedAt: { type: Date },
});

const TestSchema = new mongoose.Schema(
  {
    testCode: { type: String, required: true, unique: true, index: true },
    userEmail: { type: String, required: true, lowercase: true, trim: true },
    status: {
      type: String,
      enum: ['created', 'processing', 'completed', 'failed'],
      default: 'created',
    },
    results: [TestResultSchema],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

TestSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

// Fix for the model definition - check if model already exists
module.exports = mongoose.models.Test || mongoose.model('Test', TestSchema);