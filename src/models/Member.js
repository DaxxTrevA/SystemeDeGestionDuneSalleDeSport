import mongoose from 'mongoose';

const memberSchema = new mongoose.Schema({
  firstName: { type: String, required: true, trim: true, maxlength: 60 },
  lastName: { type: String, required: true, trim: true, maxlength: 60 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  phone: { type: String, trim: true, maxlength: 30, default: '' },
  dateOfBirth: { type: Date, default: null }
}, { timestamps: true });

export default mongoose.model('Member', memberSchema);