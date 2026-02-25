import { DailyLog } from '../models/DailyLog';
import { ActivePlan } from '../models/ActivePlan';
import { NutritionPlan } from '../models/NutritionPlan';

export type MealSlot = 'breakfast' | 'snack1' | 'lunch' | 'snack2' | 'dinner';
export type MealStatus = 'planned' | 'done' | 'skipped';

const SLOT_LIST: MealSlot[] = [
   'breakfast',
   'snack1',
   'lunch',
   'snack2',
   'dinner',
];

function assertDate(date: string) {
   // YYYY-MM-DD
   if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw new Error('Invalid date format. Use YYYY-MM-DD.');
   }
}

function computeAdherence(log: any) {
   const doneCount = SLOT_LIST.filter(
      (s) => log?.meals?.[s]?.status === 'done'
   ).length;
   const mealAdherence = Math.round((doneCount / SLOT_LIST.length) * 100);

   const totalMl = Number(log?.water?.totalMl ?? 0);
   const targetMl = Number(log?.water?.targetMl ?? 2000);
   const waterAdherence =
      targetMl > 0 ? Math.min(100, Math.round((totalMl / targetMl) * 100)) : 0;

   return { mealAdherence, waterAdherence, doneCount, totalMl, targetMl };
}

async function buildPlannedMealsFromActivePlan(userId: string) {
   const active = await ActivePlan.findOne({ userId, isActive: true }).lean();
   if (!active) return null;

   const planDoc: any = await NutritionPlan.findById(active.planId).lean();
   const option = planDoc?.plans?.find((p: any) => p.key === active.planKey);

   const meals = option?.meals ?? {};

   return {
      planId: String(active.planId),
      planKey: active.planKey,
      plannedMeals: {
         breakfast: meals.breakfast ?? [],
         snack1: meals.snack1 ?? [],
         lunch: meals.lunch ?? [],
         snack2: meals.snack2 ?? [],
         dinner: meals.dinner ?? [],
      },
   };
}

export const dailyLogService = {
   // Create daily log if not exists, and auto-fill planned meals from active plan
   async ensureDailyLog(userId: string, date: string) {
      assertDate(date);

      // If already exists, return it
      const existing = await DailyLog.findOne({ userId, date });
      if (existing) {
         const needsMeals = !existing.get('meals');
         const needsWater = !existing.get('water');

         if (needsMeals || needsWater) {
            await DailyLog.updateOne(
               { _id: existing._id },
               {
                  $set: {
                     ...(needsMeals
                        ? {
                             meals: {
                                breakfast: {
                                   planned: [],
                                   consumed: [],
                                   status: 'planned',
                                   notes: '',
                                },
                                snack1: {
                                   planned: [],
                                   consumed: [],
                                   status: 'planned',
                                   notes: '',
                                },
                                lunch: {
                                   planned: [],
                                   consumed: [],
                                   status: 'planned',
                                   notes: '',
                                },
                                snack2: {
                                   planned: [],
                                   consumed: [],
                                   status: 'planned',
                                   notes: '',
                                },
                                dinner: {
                                   planned: [],
                                   consumed: [],
                                   status: 'planned',
                                   notes: '',
                                },
                             },
                          }
                        : {}),
                     ...(needsWater
                        ? { water: { targetMl: 2000, entries: [], totalMl: 0 } }
                        : {}),
                  },
               }
            );
            return await DailyLog.findById(existing._id);
         }

         return existing;
      }

      // Build plan-based defaults for today
      const planData = await buildPlannedMealsFromActivePlan(userId);

      const insertDoc: any = {
         userId,
         date,
         meals: {
            breakfast: {
               planned: [],
               consumed: [],
               status: 'planned',
               notes: '',
            },
            snack1: { planned: [], consumed: [], status: 'planned', notes: '' },
            lunch: { planned: [], consumed: [], status: 'planned', notes: '' },
            snack2: { planned: [], consumed: [], status: 'planned', notes: '' },
            dinner: { planned: [], consumed: [], status: 'planned', notes: '' },
         },
         water: { targetMl: 2000, entries: [], totalMl: 0 },
      };

      if (planData) {
         insertDoc.planId = planData.planId;
         insertDoc.planKey = planData.planKey;

         for (const slot of SLOT_LIST) {
            insertDoc.meals[slot].planned = planData.plannedMeals[slot];
         }
      }

      // Use upsert in case a race condition creates it between check and insert
      const doc = await DailyLog.findOneAndUpdate(
         { userId, date },
         { $setOnInsert: insertDoc },
         { upsert: true, new: true }
      );

      return doc;
   },

   async getDailyLog(userId: string, date: string) {
      const log = await this.ensureDailyLog(userId, date);
      const adherence = computeAdherence(log);
      return { log, adherence };
   },

   async updateMealSlot(input: {
      userId: string;
      date: string;
      slot: MealSlot;
      consumed?: string[];
      status?: MealStatus;
      notes?: string;
   }) {
      assertDate(input.date);

      await this.ensureDailyLog(input.userId, input.date);

      const update: any = {};
      if (input.consumed)
         update[`meals.${input.slot}.consumed`] = input.consumed;
      if (input.status) update[`meals.${input.slot}.status`] = input.status;
      if (typeof input.notes === 'string')
         update[`meals.${input.slot}.notes`] = input.notes;

      const log = await DailyLog.findOneAndUpdate(
         { userId: input.userId, date: input.date },
         { $set: update },
         { new: true }
      );

      const adherence = computeAdherence(log);
      return { log, adherence };
   },

   async addWater(input: { userId: string; date: string; ml: number }) {
      assertDate(input.date);

      const ml = Number(input.ml);
      if (!Number.isFinite(ml) || ml <= 0)
         throw new Error('ml must be a positive number.');
      if (ml > 2000) throw new Error('ml too high for a single entry.');

      await this.ensureDailyLog(input.userId, input.date);

      const log = await DailyLog.findOneAndUpdate(
         { userId: input.userId, date: input.date },
         {
            $push: { 'water.entries': { ml, ts: new Date() } },
            $inc: { 'water.totalMl': ml },
         },
         { new: true }
      );

      const adherence = computeAdherence(log);
      return { log, adherence };
   },

   async setWaterTarget(input: {
      userId: string;
      date: string;
      targetMl: number;
   }) {
      assertDate(input.date);

      const targetMl = Number(input.targetMl);
      if (!Number.isFinite(targetMl) || targetMl < 500 || targetMl > 6000) {
         throw new Error('targetMl must be between 500 and 6000.');
      }

      await this.ensureDailyLog(input.userId, input.date);

      const log = await DailyLog.findOneAndUpdate(
         { userId: input.userId, date: input.date },
         { $set: { 'water.targetMl': targetMl } },
         { new: true }
      );

      const adherence = computeAdherence(log);
      return { log, adherence };
   },
};
