import type { RequestHandler } from 'express';
import { z } from 'zod';
import { dailyLogService } from '../services/dailyLog.service';

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD');

const getDailySchema = z.object({
   userId: z.string().min(1),
   date: dateSchema,
});

const LogEntrySchema = z.object({
   foodName: z.string().min(1),
   calories: z.number().min(0),
   portion: z.string().optional(),
   time: z.string().optional(),
   macros: z
      .object({
         protein_g: z.number().min(0).optional(),
         carbs_g: z.number().min(0).optional(),
         fat_g: z.number().min(0).optional(),
      })
      .optional(),
});

const manualLogSchema = z.object({
   userId: z.string().min(1),
   date: dateSchema,
   entries: z.array(LogEntrySchema).min(1),
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

const getDaily: RequestHandler = async (req, res) => {
   try {
      const parsed = getDailySchema.safeParse({
         userId: req.query.userId,
         date: req.query.date,
      });

      if (!parsed.success) {
         res.status(400).json({ errors: parsed.error.flatten() });
         return;
      }

      const { log, adherence } = await dailyLogService.getDailyLog(
         parsed.data.userId,
         parsed.data.date
      );

      res.json({
         log,
         adherence,
         meals: log.meals,
         water: log.water,
      });
   } catch (err: unknown) {
      const error = err as { message?: string };
      console.error('getDaily ERROR:', error?.message ?? err);

      res.status(500).json({
         error: error?.message ?? 'Failed to get daily log.',
      });
   }
};

const logManual: RequestHandler = async (req, res) => {
   try {
      const parsed = manualLogSchema.safeParse(req.body);

      if (!parsed.success) {
         res.status(400).json({ errors: parsed.error.flatten() });
         return;
      }

      const { log, adherence } = await dailyLogService.addManualEntries(
         parsed.data.userId,
         parsed.data.date,
         parsed.data.entries
      );

      res.json({
         log,
         adherence,
         meals: log.meals,
         water: log.water,
      });
   } catch (err: unknown) {
      const error = err as { message?: string };
      console.error('logManual ERROR:', error?.message ?? err);

      res.status(500).json({
         error: error?.message ?? 'Failed to log manual food.',
      });
   }
};

const updateMeal: RequestHandler = async (req, res) => {
   try {
      const parsed = updateMealSchema.safeParse(req.body);

      if (!parsed.success) {
         res.status(400).json({ errors: parsed.error.flatten() });
         return;
      }

      const { log, adherence } = await dailyLogService.updateMealSlot(
         parsed.data
      );

      res.json({
         log,
         adherence,
         meals: log.meals,
         water: log.water,
      });
   } catch (err: unknown) {
      const error = err as { message?: string };
      console.error('updateMeal ERROR:', error?.message ?? err);

      res.status(500).json({
         error: error?.message ?? 'Failed to update meal.',
      });
   }
};

const addWater: RequestHandler = async (req, res) => {
   try {
      const parsed = addWaterSchema.safeParse(req.body);

      if (!parsed.success) {
         res.status(400).json({ errors: parsed.error.flatten() });
         return;
      }

      const { log, adherence } = await dailyLogService.addWater(parsed.data);

      res.json({
         log,
         adherence,
         meals: log.meals,
         water: log.water,
      });
   } catch (err: unknown) {
      const error = err as { message?: string };
      console.error('addWater ERROR:', error?.message ?? err);

      res.status(500).json({
         error: error?.message ?? 'Failed to add water.',
      });
   }
};

const setWaterTarget: RequestHandler = async (req, res) => {
   try {
      const parsed = setWaterTargetSchema.safeParse(req.body);

      if (!parsed.success) {
         res.status(400).json({ errors: parsed.error.flatten() });
         return;
      }

      const { log, adherence } = await dailyLogService.setWaterTarget(
         parsed.data
      );

      res.json({
         log,
         adherence,
         meals: log.meals,
         water: log.water,
      });
   } catch (err: unknown) {
      const error = err as { message?: string };
      console.error('setWaterTarget ERROR:', error?.message ?? err);

      res.status(500).json({
         error: error?.message ?? 'Failed to set water target.',
      });
   }
};

export const dailyLogController = {
   getDaily,
   logManual,
   updateMeal,
   addWater,
   setWaterTarget,
};
