import { Schema, model } from 'mongoose';

const MealTargetsSchema = new Schema(
   {
      breakfast: Number,
      snack1: Number,
      lunch: Number,
      snack2: Number,
      dinner: Number,
   },
   { _id: false }
);

const DayPlanSchema = new Schema(
   {
      key: { type: String, enum: ['A', 'B', 'C'], required: true },
      meals: {
         breakfast: [String],
         snack1: [String],
         lunch: [String],
         snack2: [String],
         dinner: [String],
         substitutions: { type: [String], default: [] },
         conditionNotes: { type: String, default: '' },
      },
   },
   { _id: false }
);

const NutritionPlanSchema = new Schema(
   {
      userId: { type: String, index: true },
      requirementId: { type: String, index: true },
      provider: String,
      model: String,
      dailyCalories: { type: Number, required: true },
      mealTargets: { type: MealTargetsSchema, required: true },
      plans: { type: [DayPlanSchema], validate: (v: any[]) => v?.length === 3 },
      durationDays: { type: Number, min: 7, max: 365, required: true },
      startDate: { type: Date, required: true },
      endDate: { type: Date, required: true },

      rawText: String,
      parseOk: { type: Boolean, default: true },
   },
   { timestamps: true }
);

export const NutritionPlan = model('NutritionPlan', NutritionPlanSchema);
