import express, { type Request, type Response } from 'express';
import z from 'zod';
import { DailyLog } from '../models/DailyLog';

const router = express.Router();

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
   date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD
   entries: z.array(LogEntrySchema).min(1),
});

router.post('/api/logs/manual', async (req: Request, res: Response) => {
   const parsed = ManualLogSchema.safeParse(req.body);
   if (!parsed.success) {
      res.status(400).json({ errors: parsed.error.flatten() });
      return;
   }

   const { userId, date, entries } = parsed.data;

   const update = entries.reduce(
      (acc, e) => {
         acc.$push.entries.$each.push({
            source: 'manual',
            time: e.time ?? new Date(),
            foodId: e.foodId,
            foodName: e.foodName,
            portion: e.portion,
            calories: e.calories,
            macros: e.macros,
         });

         acc.$inc.totalCalories += e.calories;

         if (e.macros) {
            acc.$inc['totals.protein_g'] += e.macros.protein_g ?? 0;
            acc.$inc['totals.carbs_g'] += e.macros.carbs_g ?? 0;
            acc.$inc['totals.fat_g'] += e.macros.fat_g ?? 0;
         }

         return acc;
      },
      {
         $setOnInsert: {
            userId,
            date,
         },
         $push: {
            entries: { $each: [] as any[] },
         },
         $inc: {
            totalCalories: 0,
            'totals.protein_g': 0,
            'totals.carbs_g': 0,
            'totals.fat_g': 0,
         } as any,
      }
   );

   const doc = await DailyLog.findOneAndUpdate({ userId, date }, update, {
      upsert: true,
      new: true,
   });

   res.json(doc);
});

export default router;
