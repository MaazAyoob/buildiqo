const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  phone: { type: String, default: '' },
  password: { type: String, required: true },
  role: { type: String, default: 'Homeowner / Individual Builder' },
  firmName: { type: String, default: '' },
  isAdmin: { type: Boolean, default: false },
  hasSelectedPlan: { type: Boolean, default: false },
  avatar: { type: String, default: 'U' }
}, { timestamps: true });

module.exports = mongoose.models.User || mongoose.model('User', userSchema);
