import type { RequestHandler } from 'express';
import { planTodayService } from '../services/planToday.service';

const getToday: RequestHandler = async (req, res) => {
   try {
      const userId =
         typeof req.query.userId === 'string' ? req.query.userId.trim() : '';

      if (!userId) {
         res.status(400).json({ error: 'userId required' });
         return;
      }

      const result = await planTodayService.getTodayPlan(userId);

      if ('error' in result) {
         res.status(result.status).json({ error: result.error });
         return;
      }

      res.json(result);
   } catch (err: unknown) {
      const error = err as { message?: string };
      res.status(500).json({
         error: error?.message ?? 'Failed to get today plan',
      });
   }
};

export const planTodayController = {
   getToday,
};

export default planTodayController;
