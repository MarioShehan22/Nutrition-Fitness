import type { RequestHandler } from 'express';
import mongoose from 'mongoose';
import { z } from 'zod';
import { planEnrollmentService } from '../services/planEnrollment.service';

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

type ServiceError = {
   status: number;
   error: string;
};

function isServiceError(value: unknown): value is ServiceError {
   return (
      typeof value === 'object' &&
      value !== null &&
      'status' in value &&
      'error' in value &&
      typeof (value as { status: unknown }).status === 'number' &&
      typeof (value as { error: unknown }).error === 'string'
   );
}

const postEnroll: RequestHandler = async (req, res, next) => {
   const parsed = EnrollSchema.safeParse(req.body);

   if (!parsed.success) {
      res.status(400).json({ errors: parsed.error.flatten() });
      return;
   }

   try {
      const result = await planEnrollmentService.enroll(parsed.data);

      if (isServiceError(result)) {
         res.status(result.status).json({ error: result.error });
         return;
      }

      res.json(result);
   } catch (err) {
      next(err);
   }
};

const getPlan: RequestHandler = async (req, res, next) => {
   const id = req.params.id;

   if (!(typeof id === 'string' && mongoose.Types.ObjectId.isValid(id))) {
      res.status(400).json({ error: 'Invalid plan id format' });
      return;
   }

   try {
      const result = await planEnrollmentService.getPlanById(id);

      if (isServiceError(result)) {
         res.status(result.status).json({ error: result.error });
         return;
      }

      res.json(result);
   } catch (err) {
      next(err);
   }
};

export const planEnrollmentController = {
   postEnroll,
   getPlan,
};

export default planEnrollmentController;
