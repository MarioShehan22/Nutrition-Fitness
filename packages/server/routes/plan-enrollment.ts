import {
   Router,
   type Request,
   type Response,
   type NextFunction,
   type RequestHandler,
} from 'express';
import z from 'zod';
import mongoose from 'mongoose';
import { NutritionPlan } from '../models/NutritionPlan';
import { PlanEnrollment } from '../models/PlanEnrollment';

const router = Router();

const isObjectId = (s: unknown) =>
   typeof s === 'string' && mongoose.Types.ObjectId.isValid(s);
const ObjectIdSchema = z.string().refine(isObjectId, 'Invalid ObjectId format');

const EnrollSchema = z
   .object({
      userId: z.string().min(1),
      planId: ObjectIdSchema,
      requirementId: ObjectIdSchema,
      chosenKey: z.enum(['A', 'B', 'C']),
      rotation: z.enum(['fixed', 'rotate-daily']).optional().default('fixed'),
      rotationStartKey: z.enum(['A', 'B', 'C']).optional().default('A'),
      startDate: z.coerce.date().optional(),
      endDate: z.coerce.date().optional(),
   })
   .refine((v) => !v.startDate || !v.endDate || v.startDate <= v.endDate, {
      message: 'startDate must be <= endDate',
   });

const postEnroll: RequestHandler = async (
   req: Request,
   res: Response,
   next: NextFunction
) => {
   const parsed = EnrollSchema.safeParse(req.body);
   if (!parsed.success) {
      res.status(400).json({ errors: parsed.error.flatten() });
      return;
   }

   try {
      const {
         userId,
         planId,
         requirementId,
         chosenKey,
         rotation,
         rotationStartKey,
         startDate: sOvr,
         endDate: eOvr,
      } = parsed.data;

      const plan = await NutritionPlan.findById(planId).lean();
      if (!plan) {
         res.status(404).json({ error: 'Plan not found' });
         return;
      }
      if (String(plan.userId) !== userId) {
         res.status(403).json({ error: 'Plan does not belong to this user' });
         return;
      }
      if (String(plan.requirementId) !== requirementId) {
         res.status(409).json({ error: 'Plan requirement mismatch' });
         return;
      }

      const startDate = sOvr ? new Date(sOvr) : new Date(plan.startDate);
      const endDate = eOvr ? new Date(eOvr) : new Date(plan.endDate);
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
         res.status(400).json({ error: 'Invalid startDate or endDate' });
         return;
      }
      if (startDate > endDate) {
         res.status(400).json({ error: 'startDate must be <= endDate' });
         return;
      }

      await PlanEnrollment.updateMany(
         { userId, requirementId, active: true },
         { $set: { active: false } }
      );

      const enrollment = await PlanEnrollment.create({
         userId,
         requirementId,
         planId: plan._id,
         chosenKey,
         rotation,
         rotationStartKey,
         startDate,
         endDate,
         active: true,
      });

      res.json({ ok: true, enrollmentId: String(enrollment._id), enrollment });
      return;
   } catch (err) {
      next(err);
   }
};

const getPlan: RequestHandler = async (
   req: Request,
   res: Response,
   next: NextFunction
) => {
   const id = req.params.id;
   if (!(typeof id === 'string' && mongoose.Types.ObjectId.isValid(id))) {
      res.status(400).json({ error: 'Invalid plan id format' });
      return;
   }
   try {
      const plan = await NutritionPlan.findById(id);
      if (!plan) {
         res.status(404).json({ error: 'Plan not found' });
         return;
      }
      res.json(plan);
   } catch (e) {
      next(e);
   }
};

router.post('/enroll', postEnroll);
router.get('/:id', getPlan);

export default router;
