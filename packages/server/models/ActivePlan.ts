import { Schema, model } from 'mongoose';

const ActivePlanSchema = new Schema(
   {
      userId: { type: String, required: true, index: true, unique: true },

      // link to generated plan document
      planId: { type: String, required: true, index: true },

      // which option user chose: A/B/C
      planKey: { type: String, enum: ['A', 'B', 'C'], required: true },

      startDate: { type: String, required: true }, // "YYYY-MM-DD" (Asia/Colombo)
      endDate: { type: String }, // optional
      isActive: { type: Boolean, default: true },
   },
   { timestamps: true }
);

export const ActivePlan = model('ActivePlan', ActivePlanSchema);
