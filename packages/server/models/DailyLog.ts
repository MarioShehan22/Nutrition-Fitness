import { Schema, model } from 'mongoose';

const LogEntrySchema = new Schema(
   {
      source: { type: String, enum: ['manual', 'vision'], required: true },
      time: { type: Date, default: () => new Date() },
      foodId: { type: String },
      foodName: { type: String, required: true },
      portion: { type: String },
      calories: { type: Number, min: 0, required: true },
      macros: {
         protein_g: Number,
         carbs_g: Number,
         fat_g: Number,
      },
      raw: Schema.Types.Mixed,
   },
   { _id: false }
);

const MealSlotSchema = new Schema(
   {
      planned: { type: [String], default: [] },
      consumed: { type: [String], default: [] },
      status: {
         type: String,
         enum: ['planned', 'done', 'skipped'],
         default: 'planned',
      },
      notes: { type: String, default: '' },
   },
   { _id: false }
);

const WaterEntrySchema = new Schema(
   {
      ml: { type: Number, min: 1, required: true },
      ts: { type: Date, default: () => new Date() },
   },
   { _id: false }
);

const DailyLogSchema = new Schema(
   {
      userId: { type: String, index: true, required: true },
      date: { type: String, index: true, required: true }, // YYYY-MM-DD

      // ✅ manual food log
      entries: { type: [LogEntrySchema], default: [] },
      totalCalories: { type: Number, min: 0, default: 0 },
      totals: {
         protein_g: { type: Number, default: 0 },
         carbs_g: { type: Number, default: 0 },
         fat_g: { type: Number, default: 0 },
      },

      // ✅ plan tracking
      planId: { type: String },
      planKey: { type: String, enum: ['A', 'B', 'C'] },

      meals: {
         breakfast: { type: MealSlotSchema, default: () => ({}) },
         snack1: { type: MealSlotSchema, default: () => ({}) },
         lunch: { type: MealSlotSchema, default: () => ({}) },
         snack2: { type: MealSlotSchema, default: () => ({}) },
         dinner: { type: MealSlotSchema, default: () => ({}) },
      },

      water: {
         targetMl: { type: Number, default: 2000 },
         totalMl: { type: Number, default: 0 },
         entries: { type: [WaterEntrySchema], default: [] },
      },
   },
   { timestamps: true }
);

DailyLogSchema.index({ userId: 1, date: 1 }, { unique: true });

export const DailyLog = model('DailyLog', DailyLogSchema);
