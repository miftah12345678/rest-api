const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  googleId: String,
  githubId: String,
  username: { type: String, unique: true, required: true },
  email: { type: String, unique: true },
  password: String,
  isVerified: { type: Boolean, default: false },
  apiKey: String,
  premium: { type: Boolean, default: false },
  premiumPlan: { type: String, enum: ['free', 'basic', 'medium', 'platinum'], default: 'free' },
  premiumTime: { type: Number, default: 0 },
  limit: { type: Number, default: 100 },
  defaultKey: String,
  profile: String,
  isAdmin: { type: Boolean, default: false },
  otp: String,
  otpExpires: Date,
  loginOtp: String,
  loginOtpExpires: Date,
  apiKeyChangeOtp: String,
  apiKeyChangeOtpExpires: Date,
  telegramChatId: String,
  pendingApiKey: String,
  totalRequests: { type: Number, default: 0 },
  ipAddress: String,
});

const User = mongoose.model('User', UserSchema);
module.exports = User