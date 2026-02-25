import { Schema, model, type InferSchemaType } from 'mongoose';

const MacroRatiosSchema = new Schema(
   {
      carb: { type: Number, min: 0, max: 1 },
      protein: { type: Number, min: 0, max: 1 },
      fat: { type: Number, min: 0, max: 1 },
   },
   { _id: false }
);

const PreferredMealsSchema = new Schema(
   {
      breakfast: String,
      snack1: String,
      lunch: String,
      snack2: String,
      dinner: String,
   },
   { _id: false }
);

const GoalSchema = new Schema(
   {
      type: {
         type: String,
         enum: ['loss', 'maintenance', 'gain'],
         required: true,
      },
      calorieTargetPerDay: { type: Number, min: 800, max: 5000 },
      macroRatios: { type: MacroRatiosSchema },
      preferredMeals: { type: PreferredMealsSchema },
      durationDays: { type: Number, min: 7, max: 365 },
      startDate: { type: Date },
      endDate: { type: Date },
   },
   { _id: false }
);

const PlanRequirementSchema = new Schema(
   {
      userId: { type: String, index: true },
      age: Number,
      gender: { type: String, enum: ['male', 'female'] },
      heightCm: Number,
      weightKg: Number,
      activityLevel: { type: String, enum: ['low', 'medium', 'high'] },
      goal: { type: GoalSchema, required: true },
      dietaryPreference: {
         type: String,
         enum: ['veg', 'non_veg', 'vegan'],
         required: true,
      },
      allergies: { type: [String], default: [] },
      conditions: { type: [String], default: [] },
      notes: String,
   },
   { timestamps: true }
);

type PlanRequirementDoc = InferSchemaType<typeof PlanRequirementSchema>;

PlanRequirementSchema.pre('save', function (this: PlanRequirementDoc) {
   const g = this.goal;

   if (g && (!g.durationDays || !g.startDate || !g.endDate)) {
      const duration = g.durationDays ?? 30;
      const s = g.startDate ? new Date(g.startDate) : new Date();
      const e = g.endDate
         ? new Date(g.endDate)
         : new Date(s.getTime() + duration * 86400000);

      g.durationDays = duration;
      g.startDate = s;
      g.endDate = e;
   }
});

export const PlanRequirement = model('PlanRequirement', PlanRequirementSchema);
