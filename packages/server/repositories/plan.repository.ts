import { PlanRequirement } from '../models/PlanRequirement';
import { NutritionPlan } from '../models/NutritionPlan';
import { PlanEnrollment } from '../models/PlanEnrollment.ts';

export const planRepository = {
   createRequirement(data: any) {
      return PlanRequirement.create(data);
   },

   getRequirement(id: string) {
      return PlanRequirement.findById(id);
   },

   createPlan(data: any) {
      return NutritionPlan.create(data);
   },

   getPlan(id: string) {
      return NutritionPlan.findById(id);
   },

   listPlansByUser(userId: string) {
      return NutritionPlan.find({ userId }).sort({ createdAt: -1 }).limit(50);
   },
   getLatestRequirementByUser(userId: string) {
      return PlanRequirement.findOne({ userId }).sort({ createdAt: -1 }).lean();
   },

   getLatestPlanByRequirement(userId: string, requirementId: string) {
      return NutritionPlan.findOne({ userId, requirementId })
         .sort({ createdAt: -1 })
         .lean();
   },

   getActiveEnrollmentByDate(userId: string, ymd: string) {
      // ymd is 'YYYY-MM-DD'
      return PlanEnrollment.findOne({
         userId,
         active: true,
         startDate: { $lte: new Date(ymd) },
         endDate: { $gte: new Date(ymd) },
      }).lean();
   },
};
