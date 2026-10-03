import mongoose from 'mongoose';

const subscriptionSchema = new mongoose.Schema({
  member: { type: mongoose.Schema.Types.ObjectId, ref: 'Member', required: true, index: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  durationMonths: { type: Number, required: true, min: 1, max: 36 },
  monthlyRateAr: { type: Number, min: 0, default: 0 },
  totalPriceAr: { type: Number, min: 0, default: 0 },
  status: { type: String, enum: ['pending', 'active', 'expired', 'suspended', 'rejected'], default: 'active', index: true }
}, { timestamps: true });

export default mongoose.model('Subscription', subscriptionSchema);