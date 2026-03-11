import { PlanEnrollment } from '../models/PlanEnrollment';
import { NutritionPlan } from '../models/NutritionPlan';

type PlanKey = 'A' | 'B' | 'C';

type ServiceError = {
   status: number;
   error: string;
};

type TodayPlanResponse = {
   planId: string;
   requirementId: unknown;
   date: string;
   key: PlanKey;
   meals: unknown;
   dailyCalories: unknown;
   mealTargets: unknown;
   window: {
      startDate: unknown;
      endDate: unknown;
   };
};

const PLAN_KEYS: PlanKey[] = ['A', 'B', 'C'];

function resolvePlanKey(value: unknown, fallback: PlanKey = 'A'): PlanKey {
   return PLAN_KEYS.includes(value as PlanKey) ? (value as PlanKey) : fallback;
}

function getDateOnlyString(date: Date): string {
   return date.toISOString().slice(0, 10);
}

function diffDays(from: Date, to: Date): number {
   return Math.floor((to.getTime() - from.getTime()) / 86400000);
}

async function getTodayPlan(
   userId: string
): Promise<TodayPlanResponse | ServiceError> {
   const enrollment = await PlanEnrollment.findOne({ userId, active: true })
      .sort({ createdAt: -1 })
      .lean();

   if (!enrollment) {
      return { status: 404, error: 'No active plan enrollment' };
   }

   const now = new Date();
   const startDate = new Date(enrollment.startDate);
   const endDate = new Date(enrollment.endDate);

   if (now < startDate || now > endDate) {
      return { status: 409, error: 'Enrollment is not active today' };
   }

   const plan = await NutritionPlan.findById(enrollment.planId).lean();
   if (!plan) {
      return { status: 404, error: 'Plan not found' };
   }

   let key: PlanKey = resolvePlanKey(enrollment.chosenKey, 'A');

   if (enrollment.rotation === 'rotate-daily') {
      const startKey = resolvePlanKey(enrollment.rotationStartKey, 'A');
      const baseIdx = Math.max(0, PLAN_KEYS.indexOf(startKey));
      const days = diffDays(startDate, now);
      key = PLAN_KEYS[(baseIdx + (days % 3) + 3) % 3];
   }

   const todayPlan = Array.isArray(plan.plans)
      ? plan.plans.find((p: any) => p.key === key)
      : undefined;

   if (!todayPlan) {
      return { status: 500, error: 'Selected plan key missing' };
   }

   return {
      planId: String(plan._id),
      requirementId: plan.requirementId,
      date: getDateOnlyString(now),
      key,
      meals: todayPlan.meals,
      dailyCalories: plan.dailyCalories,
      mealTargets: plan.mealTargets,
      window: {
         startDate: plan.startDate,
         endDate: plan.endDate,
      },
   };
}

export const planTodayService = {
   getTodayPlan,
};

export default planTodayService;
