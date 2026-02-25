import { Schema, model } from 'mongoose';

const PlanEnrollmentSchema = new Schema(
   {
      userId: { type: String, index: true, required: true },
      planId: { type: String, index: true, required: true },
      requirementId: { type: String, index: true, required: true },
      chosenKey: { type: String, enum: ['A', 'B', 'C'], required: true },
      rotation: {
         type: String,
         enum: ['fixed', 'rotate-daily'],
         default: 'fixed',
      },
      rotationStartKey: { type: String, enum: ['A', 'B', 'C'], default: 'A' },
      startDate: { type: Date, required: true },
      endDate: { type: Date, required: true },
      active: { type: Boolean, default: true },
   },
   { timestamps: true }
);

export const PlanEnrollment = model('PlanEnrollment', PlanEnrollmentSchema);
