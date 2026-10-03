import mongoose from 'mongoose';

const clubSettingsSchema = new mongoose.Schema({
  key: { type: String, default: 'main', unique: true },
  courseTypes: {
    type: [String],
    default: ['HIIT', 'Boxe cardio', 'Pilates', 'Yoga', 'Renforcement', 'Danse']
  },
  coaches: { type: [String], default: ['Doda', 'Camille Martin', 'Alexandre Morel'] },
  monthlyPriceAr: { type: Number, min: 1000, max: 10000000, default: 22000 }
}, { timestamps: true });

export default mongoose.model('ClubSettings', clubSettingsSchema);