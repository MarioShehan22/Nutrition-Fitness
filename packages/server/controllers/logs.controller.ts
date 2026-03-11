import type { RequestHandler } from 'express';
import { z } from 'zod';
import { logsService } from '../services/logs.service';

const LogEntrySchema = z.object({
   time: z.coerce.date().optional(),
   foodId: z.string().optional(),
   foodName: z.string().min(1),
   portion: z.string().optional(),
   calories: z.number().min(0),
   macros: z
      .object({
         protein_g: z.number().min(0).optional(),
         carbs_g: z.number().min(0).optional(),
         fat_g: z.number().min(0).optional(),
      })
      .partial()
      .optional(),
});

const ManualLogSchema = z.object({
   userId: z.string().min(1),
   date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
   entries: z.array(LogEntrySchema).min(1),
});

const logManual: RequestHandler = async (req, res, next) => {
   const parsed = ManualLogSchema.safeParse(req.body);

   if (!parsed.success) {
      res.status(400).json({ errors: parsed.error.flatten() });
      return;
   }

   try {
      const doc = await logsService.addManualLog(parsed.data);
      res.json(doc);
   } catch (err) {
      next(err);
   }
};

export const logsController = {
   logManual,
};

export default logsController;
