import mongoose from 'mongoose';

const subscriptionSchema = new mongoose.Schema({
  member: { type: mongoose.Schema.Types.ObjectId, ref: 'Member', required: true, index: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  durationMonths: { type: Number, required: true, min: 1, max: 36 },
  status: { type: String, enum: ['active', 'expired', 'suspended'], default: 'active', index: true }
}, { timestamps: true });

export default mongoose.model('Subscription', subscriptionSchema);