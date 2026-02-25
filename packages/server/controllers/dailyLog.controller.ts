import type { Request, Response } from 'express';
import z from 'zod';
import { dailyLogService } from '../services/dailyLog.service';

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD');

const getDailySchema = z.object({
   userId: z.string().min(1),
   date: dateSchema,
});

const updateMealSchema = z.object({
   userId: z.string().min(1),
   date: dateSchema,
   slot: z.enum(['breakfast', 'snack1', 'lunch', 'snack2', 'dinner']),
   consumed: z.array(z.string().min(1)).optional(),
   status: z.enum(['planned', 'done', 'skipped']).optional(),
   notes: z.string().optional(),
});

const addWaterSchema = z.object({
   userId: z.string().min(1),
   date: dateSchema,
   ml: z.number().positive(),
});

const setWaterTargetSchema = z.object({
   userId: z.string().min(1),
   date: dateSchema,
   targetMl: z.number().min(500).max(6000),
});

export const dailyLogController = {
   // GET /api/logs/daily?userId=...&date=YYYY-MM-DD
   async getDaily(req: Request, res: Response) {
      try {
         const parsed = getDailySchema.safeParse({
            userId: req.query.userId,
            date: req.query.date,
         });
         if (!parsed.success)
            return res.status(400).json({ errors: parsed.error.flatten() });

         const { log, adherence } = await dailyLogService.getDailyLog(
            parsed.data.userId,
            parsed.data.date
         );
         return res.json({
            log,
            adherence,
            meals: log.meals, // or log.mealStatus
            water: log.water,
         });
      } catch (err: any) {
         console.error('getDaily ERROR:', err?.message ?? err);
         return res
            .status(500)
            .json({ error: err?.message ?? 'Failed to get daily log.' });
      }
   },

   // PATCH /api/logs/daily/meal
   async updateMeal(req: Request, res: Response) {
      try {
         const parsed = updateMealSchema.safeParse(req.body);
         if (!parsed.success)
            return res.status(400).json({ errors: parsed.error.flatten() });

         const { log, adherence } = await dailyLogService.updateMealSlot(
            parsed.data
         );
         return res.json({
            log,
            adherence,
            meals: log.meals, // or log.mealStatus
            water: log.water,
         });
      } catch (err: any) {
         console.error('updateMeal ERROR:', err?.message ?? err);
         return res
            .status(500)
            .json({ error: err?.message ?? 'Failed to update meal.' });
      }
   },

   // POST /api/logs/daily/water/add
   async addWater(req: Request, res: Response) {
      try {
         const parsed = addWaterSchema.safeParse(req.body);
         if (!parsed.success)
            return res.status(400).json({ errors: parsed.error.flatten() });

         const { log, adherence } = await dailyLogService.addWater(parsed.data);
         return res.json({
            log,
            adherence,
            meals: log.meals, // or log.mealStatus
            water: log.water,
         });
      } catch (err: any) {
         console.error('addWater ERROR:', err?.message ?? err);
         return res
            .status(500)
            .json({ error: err?.message ?? 'Failed to add water.' });
      }
   },

   // PATCH /api/logs/daily/water/target
   async setWaterTarget(req: Request, res: Response) {
      try {
         const parsed = setWaterTargetSchema.safeParse(req.body);
         if (!parsed.success)
            return res.status(400).json({ errors: parsed.error.flatten() });

         const { log, adherence } = await dailyLogService.setWaterTarget(
            parsed.data
         );
         return res.json({
            log,
            adherence,
            meals: log.meals, // or log.mealStatus
            water: log.water,
         });
      } catch (err: any) {
         console.error('setWaterTarget ERROR:', err?.message ?? err);
         return res
            .status(500)
            .json({ error: err?.message ?? 'Failed to set water target.' });
      }
   },
};
