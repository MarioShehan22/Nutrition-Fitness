import { DailyLog } from '../models/DailyLog';
import { PlanRequirement } from '../models/PlanRequirement';
import { NutritionPlan } from '../models/NutritionPlan';

type ProgressMode = 'static' | 'weekly' | 'carry';

type ProgressTotals = {
   protein_g?: number;
   carbs_g?: number;
   fat_g?: number;
};

type ProgressSeriesItem = {
   date: string;
   target: number;
   consumed: number;
   delta: number;
   status: 'under' | 'ok' | 'over';
   carry?: number;
   suggestedAdjustment?: string;
   totals?: ProgressTotals;
};

type ProgressPoint = {
   date: string;
   totalCalories: number;
   target: number;
   delta: number;
   status: 'under' | 'ok' | 'over';
   carry?: number;
   suggestedAdjustment?: string;
   totals?: ProgressTotals;
};

type GetTimeseriesInput = {
   userId: string;
   mode: ProgressMode;
   tolerance: number;
   capPct: number;
   from?: string;
   to?: string;
};

type DailyLogLean = {
   date: string;
   totalCalories?: number;
   totals?: {
      protein_g?: number;
      carbs_g?: number;
      fat_g?: number;
   };
};

const MS = 24 * 3600 * 1000;

function toYMD(d: Date): string {
   const y = d.getFullYear();
   const m = String(d.getMonth() + 1).padStart(2, '0');
   const day = String(d.getDate()).padStart(2, '0');
   return `${y}-${m}-${day}`;
}

function clamp(n: number, lo: number, hi: number) {
   return Math.max(lo, Math.min(hi, n));
}

function isYMD(s: string): boolean {
   return /^\d{4}-\d{2}-\d{2}$/.test(s);
}

function weekStart(d: Date): Date {
   const tmp = new Date(d);
   const day = (tmp.getDay() + 6) % 7; // monday=0
   tmp.setDate(tmp.getDate() - day);
   tmp.setHours(0, 0, 0, 0);
   return tmp;
}

async function getTimeseries(input: GetTimeseriesInput) {
   const { userId, mode, from = '', to = '' } = input;

   const tolerance = clamp(Number(input.tolerance ?? 0.1), 0, 0.5);
   const capPct = clamp(Number(input.capPct ?? 0.2), 0, 0.5);

   const reqDoc = await PlanRequirement.findOne({ userId })
      .sort({ createdAt: -1 })
      .lean();

   if (!reqDoc) {
      return {
         mode,
         tolerance,
         baseTarget: 0,
         startDate: '',
         endDate: '',
         points: [] as ProgressPoint[],
         series: [] as ProgressSeriesItem[],
      };
   }

   const plan = await NutritionPlan.findOne({
      userId,
      requirementId: String(reqDoc._id),
   })
      .sort({ createdAt: -1 })
      .lean();

   let start = new Date(reqDoc.goal?.startDate || new Date());
   let end = new Date(
      reqDoc.goal?.endDate ||
         new Date(
            start.getTime() + (reqDoc.goal?.durationDays || 30) * 86400000
         )
   );

   if (isYMD(from) && isYMD(to)) {
      start = new Date(from);
      end = new Date(to);
   }

   const baseTarget =
      Number(plan?.dailyCalories ?? reqDoc.goal?.calorieTargetPerDay ?? 0) || 0;

   const logs = (await DailyLog.find({
      userId,
      date: { $gte: toYMD(start), $lte: toYMD(end) },
   }).lean()) as DailyLogLean[];

   const byDate = new Map<string, DailyLogLean>(
      logs.map((l) => [l.date, l] as const)
   );

   const series: ProgressSeriesItem[] = [];

   let prevCarry = 0;

   let curWeekStart = weekStart(start);
   let curWeekEnd = new Date(curWeekStart.getTime() + 6 * MS);
   let weeklyBudget = 7 * baseTarget;
   let weeklyConsumedSoFar = 0;

   for (let d = new Date(start); d <= end; d = new Date(d.getTime() + MS)) {
      const key = toYMD(d);

      const log = byDate.get(key);
      const consumed = Number(log?.totalCalories ?? 0);

      const totals: ProgressTotals | undefined = log?.totals
         ? {
              protein_g: Number(log.totals.protein_g ?? 0),
              carbs_g: Number(log.totals.carbs_g ?? 0),
              fat_g: Number(log.totals.fat_g ?? 0),
           }
         : undefined;

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
         carryApplied = target - baseTarget;
      }

      const delta = consumed - target;
      const low = (1 - tolerance) * target;
      const high = (1 + tolerance) * target;

      let status: 'under' | 'ok' | 'over' = 'ok';
      if (consumed < low) status = 'under';
      else if (consumed > high) status = 'over';

      let suggestedAdjustment: string | undefined;
      if (status === 'under') {
         const needed = Math.round(target - consumed);
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
         totals,
      });

      if (mode === 'carry') {
         prevCarry = delta;
      }

      if (mode === 'weekly') {
         weeklyConsumedSoFar += consumed;
      }
   }

   const points: ProgressPoint[] = series.map((x) => ({
      date: x.date,
      totalCalories: x.consumed,
      target: x.target,
      delta: x.delta,
      status: x.status,
      carry: x.carry,
      suggestedAdjustment: x.suggestedAdjustment,
      totals: x.totals,
   }));

   return {
      mode,
      tolerance,
      baseTarget,
      startDate: toYMD(start),
      endDate: toYMD(end),
      points,
      series,
   };
}

export const progressService = {
   getTimeseries,
};

export default progressService;
