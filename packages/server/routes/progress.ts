import express from 'express';
import type { Request, Response } from 'express';
import { DailyLog } from '../models/DailyLog';
import { PlanRequirement } from '../models/PlanRequirement';
import { NutritionPlan } from '../models/NutritionPlan';

const router = express.Router();

function toYMD(d: Date): string {
   const y = d.getFullYear();
   const m = String(d.getMonth() + 1).padStart(2, '0');
   const day = String(d.getDate()).padStart(2, '0');
   return `${y}-${m}-${day}`;
}

function clamp(n: number, lo: number, hi: number) {
   return Math.max(lo, Math.min(hi, n));
}

router.get('/api/progress/timeseries', async (req: Request, res: Response) => {
   const userId = String(req.query.userId || '');
   if (!userId) return res.status(400).json({ error: 'userId required' });

   // behavior controls
   const mode = String(req.query.mode || 'static') as
      | 'static'
      | 'weekly'
      | 'carry';
   const tolerance = clamp(Number(req.query.tolerance ?? 0.1), 0, 0.5); // ±10% default
   const capPct = clamp(Number(req.query.capPct ?? 0.2), 0, 0.5); // carry cap 20%

   // 1) latest requirement & plan
   const reqDoc = await PlanRequirement.findOne({ userId })
      .sort({ createdAt: -1 })
      .lean();

   if (!reqDoc) return res.json({ series: [] });

   const plan = await NutritionPlan.findOne({
      userId,
      requirementId: String(reqDoc._id),
   })
      .sort({ createdAt: -1 })
      .lean();

   // window (server suggested if missing)
   const start = new Date(reqDoc.goal.startDate || new Date());
   const end = new Date(
      reqDoc.goal.endDate ||
         new Date(start.getTime() + (reqDoc.goal.durationDays || 30) * 86400000)
   );

   // base daily target (fallbacks)
   const baseTarget =
      plan?.dailyCalories ?? reqDoc.goal.calorieTargetPerDay ?? 0;

   // 2) pull all logs in window
   const logs = await DailyLog.find({
      userId,
      date: { $gte: toYMD(start), $lte: toYMD(end) },
   }).lean();

   const byDate = new Map(logs.map((l) => [l.date, l]));

   const series: Array<{
      date: string;
      target: number;
      consumed: number;
      delta: number;
      status: 'under' | 'ok' | 'over';
      carry?: number;
      suggestedAdjustment?: string;
   }> = [];

   const MS = 24 * 3600 * 1000;
   const weekStart = (d: Date) => {
      const tmp = new Date(d);
      const day = (tmp.getDay() + 6) % 7;
      tmp.setDate(tmp.getDate() - day);
      tmp.setHours(0, 0, 0, 0);
      return tmp;
   };

   let prevCarry = 0;

   let curWeekStart = weekStart(start);
   let curWeekEnd = new Date(curWeekStart.getTime() + 6 * MS);
   let weeklyBudget = 7 * baseTarget;
   let weeklyConsumedSoFar = 0;

   for (let d = new Date(start); d <= end; d = new Date(d.getTime() + MS)) {
      const key = toYMD(d);
      const consumed = byDate.get(key)?.totalCalories || 0;

      if (mode === 'weekly' && d > curWeekEnd) {
         curWeekStart = weekStart(d);
         curWeekEnd = new Date(curWeekStart.getTime() + 6 * MS);
         weeklyBudget = 7 * baseTarget;
         weeklyConsumedSoFar = 0;
      }

      let target = baseTarget;
      let carryApplied = 0;

      if (mode === 'carry') {
         carryApplied = clamp(
            prevCarry,
            -capPct * baseTarget,
            capPct * baseTarget
         );
         target = clamp(baseTarget + carryApplied, 800, 5000);
      }

      if (mode === 'weekly') {
         const daysLeft =
            Math.floor((curWeekEnd.getTime() - d.getTime()) / MS) + 1;
         const remainingBudget = weeklyBudget - weeklyConsumedSoFar;
         target = clamp(remainingBudget / Math.max(daysLeft, 1), 800, 5000);
         carryApplied = target - baseTarget; // for transparency
      }

      // delta & status with tolerance band
      const delta = consumed - target;
      const low = (1 - tolerance) * target;
      const high = (1 + tolerance) * target;
      let status: 'under' | 'ok' | 'over' = 'ok';
      if (consumed < low) status = 'under';
      else if (consumed > high) status = 'over';

      // suggestions (lightweight text you can show in UI)
      let suggestedAdjustment: string | undefined;
      if (status === 'under') {
         const needed = Math.round(target - consumed);
         // nudge as snack or larger dinner next day
         suggestedAdjustment = `Consider +${needed} kcal via a protein-rich snack or add 1 serving to next meal.`;
      } else if (status === 'over') {
         const extra = Math.round(consumed - target);
         suggestedAdjustment = `You exceeded by ${extra} kcal. Reduce portion at next meal or add 20–30 min brisk walk.`;
      }

      series.push({
         date: key,
         target: Math.round(target),
         consumed: Math.round(consumed),
         delta: Math.round(delta),
         status,
         carry: Math.round(carryApplied),
         suggestedAdjustment,
      });

      // update state for tomorrow
      if (mode === 'carry') {
         // carry today’s delta forward (cap will be applied tomorrow)
         prevCarry = delta;
      }
      if (mode === 'weekly') {
         weeklyConsumedSoFar += consumed;
      }
   }

   res.json({
      mode,
      tolerance,
      baseTarget,
      startDate: toYMD(start),
      endDate: toYMD(end),
      series,
   });
});

export default router;
