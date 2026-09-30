import mongoose from 'mongoose';

const groupClassSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 100 },
  coach: { type: String, required: true, trim: true, maxlength: 100 },
  startsAt: { type: Date, required: true, index: true },
  durationMinutes: { type: Number, required: true, min: 15, max: 240 },
  capacity: { type: Number, required: true, min: 1, max: 100 },
  attendees: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Member' }]
}, { timestamps: true });

export default mongoose.model('GroupClass', groupClassSchema);