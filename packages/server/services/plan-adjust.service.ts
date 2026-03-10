import { DailyLog } from '../models/DailyLog';
import { planRepository } from '../repositories/plan.repository';
import { effectiveTargetForDate } from '../utils/targets';
import { adjustPlanForDay } from './adjustment.service';

const toYMD = (d: Date) => {
   const y = d.getFullYear();
   const m = String(d.getMonth() + 1).padStart(2, '0');
   const day = String(d.getDate()).padStart(2, '0');
   return `${y}-${m}-${day}`;
};

export type MealItem = {
   name: string;
   kcal: number;
   tags?: string[];
   portionScale?: number;
   swap?: string;
};

export type Meal = { items: MealItem[]; kcal: number };

export type DayPlan = {
   breakfast: Meal | undefined;
   snack1: Meal | undefined;
   lunch: Meal | undefined;
   snack2: Meal | undefined;
   dinner: Meal | undefined;
};

type StoredPlanMeals = {
   breakfast: string[];
   snack1: string[];
   lunch: string[];
   snack2: string[];
   dinner: string[];
   substitutions: string[];
   conditionNotes: string;
};
const estimateItemFromName = (name: string): MealItem => {
   const lower = name.toLowerCase();

   let kcal = 120;
   const tags: string[] = [];

   if (
      lower.includes('rice') ||
      lower.includes('roti') ||
      lower.includes('bread') ||
      lower.includes('oats') ||
      lower.includes('idli') ||
      lower.includes('dosa') ||
      lower.includes('potato')
   ) {
      kcal = 180;
      tags.push('carb_dense');
   }

   if (
      lower.includes('egg') ||
      lower.includes('chicken') ||
      lower.includes('fish') ||
      lower.includes('curd') ||
      lower.includes('yogurt') ||
      lower.includes('paneer') ||
      lower.includes('tofu') ||
      lower.includes('dal') ||
      lower.includes('chickpea')
   ) {
      kcal = Math.max(kcal, 150);
      tags.push('protein_dense');
   }

   if (
      lower.includes('fried') ||
      lower.includes('paratha') ||
      lower.includes('chips') ||
      lower.includes('pakora')
   ) {
      kcal = Math.max(kcal, 220);
      tags.push('deep_fried');
   }

   if (
      lower.includes('salad') ||
      lower.includes('vegetable') ||
      lower.includes('fruit')
   ) {
      kcal = Math.min(kcal, 100);
   }

   return {
      name,
      kcal,
      tags,
      portionScale: 1,
   };
};

const toMeal = (items?: string[]): Meal | undefined => {
   if (!items || items.length === 0) return undefined;

   const mealItems = items.map(estimateItemFromName);
   const kcal = mealItems.reduce(
      (sum, item) => sum + Math.round(item.kcal * (item.portionScale ?? 1)),
      0
   );

   return {
      items: mealItems,
      kcal,
   };
};

const toDayPlan = (meals: StoredPlanMeals): DayPlan => {
   return {
      breakfast: toMeal(meals.breakfast),
      snack1: toMeal(meals.snack1),
      lunch: toMeal(meals.lunch),
      snack2: toMeal(meals.snack2),
      dinner: toMeal(meals.dinner),
   };
};

export async function buildAdjustedPlanForDate(params: {
   userId: string;
   ymd: string;
   mode: 'static' | 'weekly' | 'carry';
}) {
   const { userId, ymd, mode } = params;

   const reqDoc = await planRepository.getLatestRequirementByUser(userId);
   if (!reqDoc) return { error: 'No requirement found' };

   const plan = await planRepository.getLatestPlanByRequirement(
      userId,
      String(reqDoc._id)
   );
   if (!plan) return { error: 'No plan found' };

   const baseTarget =
      plan.dailyCalories ?? reqDoc.goal?.calorieTargetPerDay ?? 0;

   const start = new Date(reqDoc.goal.startDate || new Date());
   const end = new Date(
      reqDoc.goal.endDate ||
         new Date(start.getTime() + (reqDoc.goal.durationDays || 30) * 86400000)
   );

   const enrollment = await planRepository.getActiveEnrollmentByDate(
      userId,
      ymd
   );
   const chosenKey = enrollment?.chosenKey ?? 'A';

   const rawMeals = plan.plans?.find((p: any) => p.key === chosenKey)?.meals as
      | StoredPlanMeals
      | undefined;

   if (!rawMeals) return { error: 'Chosen plan key not found' };

   const baseDayPlan = toDayPlan(rawMeals);

   const logs = await DailyLog.find({
      userId,
      date: { $gte: toYMD(start), $lte: toYMD(end) },
   }).lean();

   const byDate = new Map(logs.map((l) => [l.date, l]));

   const tInfo = effectiveTargetForDate({
      baseTarget,
      date: new Date(ymd),
      windowStart: start,
      windowEnd: end,
      logsByDate: byDate,
      mode,
   });

   const adjusted = adjustPlanForDay(baseDayPlan, baseTarget, tInfo.target);

   return {
      date: ymd,
      key: chosenKey,
      baseTarget,
      target: adjusted.target,
      scale: adjusted.scale,
      meals: adjusted.meals,
      totalKcal: adjusted.totalKcal,
      adjustments: adjusted.adjustments,
      carryApplied: tInfo.carryApplied ?? 0,
   };
}
