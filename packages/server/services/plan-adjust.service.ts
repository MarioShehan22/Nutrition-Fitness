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

export async function buildAdjustedPlanForDate(params: {
   userId: string;
   ymd: string; // date for which we generate adjustments
   mode: 'static' | 'weekly' | 'carry';
}) {
   const { userId, ymd, mode } = params;

   // 1) requirement + plan
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

   // 2) find active enrollment to get chosenKey (A/B/C)
   const enrollment = await planRepository.getActiveEnrollmentByDate(
      userId,
      ymd
   );
   const chosenKey = enrollment?.chosenKey ?? 'A';

   // pull that day’s plan (we assume your NutritionPlan stores plans[].meals per key)
   const baseDayPlan = plan.plans?.find((p: any) => p.key === chosenKey)?.meals;
   if (!baseDayPlan) return { error: 'Chosen plan key not found' };

   // 3) build logs map for target calc
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

   // 4) adjust
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
