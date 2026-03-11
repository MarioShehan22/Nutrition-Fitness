import { NutritionPlan } from '../models/NutritionPlan';
import { PlanEnrollment } from '../models/PlanEnrollment';

type PlanKey = 'A' | 'B' | 'C';
type RotationMode = 'fixed' | 'rotate-daily';

type EnrollInput = {
   userId: string;
   planId: string;
   requirementId: string;
   chosenKey: PlanKey;
   rotation: RotationMode;
   rotationStartKey: PlanKey;
   startDate?: Date;
   endDate?: Date;
};

type ServiceError = {
   status: number;
   error: string;
};

type ServiceSuccess = {
   ok: true;
   enrollmentId: string;
   enrollment: unknown;
};

async function enroll(
   input: EnrollInput
): Promise<ServiceError | ServiceSuccess> {
   const {
      userId,
      planId,
      requirementId,
      chosenKey,
      rotation,
      rotationStartKey,
      startDate: sOvr,
      endDate: eOvr,
   } = input;

   const plan = await NutritionPlan.findById(planId).lean();

   if (!plan) {
      return { status: 404, error: 'Plan not found' };
   }

   if (String(plan.userId) !== userId) {
      return { status: 403, error: 'Plan does not belong to this user' };
   }

   if (String(plan.requirementId) !== requirementId) {
      return { status: 409, error: 'Plan requirement mismatch' };
   }

   const startDate = sOvr ? new Date(sOvr) : new Date(plan.startDate);
   const endDate = eOvr ? new Date(eOvr) : new Date(plan.endDate);

   if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      return { status: 400, error: 'Invalid startDate or endDate' };
   }

   if (startDate > endDate) {
      return { status: 400, error: 'startDate must be <= endDate' };
   }

   await PlanEnrollment.updateMany(
      { userId, requirementId, active: true },
      { $set: { active: false } }
   );

   const enrollment = await PlanEnrollment.create({
      userId,
      requirementId,
      planId: String(plan._id),
      chosenKey,
      rotation,
      rotationStartKey,
      startDate,
      endDate,
      active: true,
   });

   return {
      ok: true,
      enrollmentId: String(enrollment._id),
      enrollment,
   };
}

async function getPlanById(id: string): Promise<ServiceError | unknown> {
   const plan = await NutritionPlan.findById(id);

   if (!plan) {
      return { status: 404, error: 'Plan not found' };
   }

   return plan;
}

export const planEnrollmentService = {
   enroll,
   getPlanById,
};

export default planEnrollmentService;
