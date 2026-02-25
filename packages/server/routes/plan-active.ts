import express from 'express';
import { PlanEnrollment } from '../models/PlanEnrollment';
import { NutritionPlan } from '../models/NutritionPlan';

const router = express.Router();

router.get('/today', async (req, res) => {
   const userId = String(req.query.userId || '');
   if (!userId) {
      res.status(400).json({ error: 'userId required' });
      return;
   }

   const enrollment = await PlanEnrollment.findOne({ userId, active: true })
      .sort({ createdAt: -1 })
      .lean();

   if (!enrollment) {
      res.status(404).json({ error: 'No active plan enrollment' });
      return;
   }

   const now = new Date();
   if (
      now < new Date(enrollment.startDate) ||
      now > new Date(enrollment.endDate)
   ) {
      res.status(409).json({ error: 'Enrollment is not active today' });
      return;
   }

   const plan = await NutritionPlan.findById(enrollment.planId).lean();
   if (!plan) {
      res.status(404).json({ error: 'Plan not found' });
      return;
   }

   // decide the key for today
   let key = enrollment.chosenKey as 'A' | 'B' | 'C';

   if (enrollment.rotation === 'rotate-daily') {
      const keys: Array<'A' | 'B' | 'C'> = ['A', 'B', 'C'];
      const baseIdx = keys.indexOf(enrollment.rotationStartKey as any) || 0;
      const days = Math.floor(
         (Date.now() - new Date(enrollment.startDate).getTime()) / 86400000
      );
      // @ts-ignore
      key = keys[(baseIdx + (days % 3) + 3) % 3];
   }

   const todayPlan = plan.plans.find((p: any) => p.key === key);
   if (!todayPlan) {
      res.status(500).json({ error: 'Selected plan key missing' });
      return;
   }

   res.json({
      planId: String(plan._id),
      requirementId: plan.requirementId,
      date: new Date().toISOString().slice(0, 10),
      key,
      meals: todayPlan.meals,
      dailyCalories: plan.dailyCalories,
      mealTargets: plan.mealTargets,
      window: {
         startDate: plan.startDate,
         endDate: plan.endDate,
      },
   });
});

export default router;
