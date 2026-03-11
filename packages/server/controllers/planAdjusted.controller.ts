import type { RequestHandler } from 'express';
import { buildAdjustedPlanForDate } from '../services/plan-adjust.service';

export const getAdjustedPlan: RequestHandler = async (req, res, next) => {
   try {
      const { userId, ymd, mode } = (req as any).adjustedQuery;

      const out = await buildAdjustedPlanForDate({ userId, ymd, mode });

      if ('error' in out) {
         res.status(404).json(out);
         return;
      }

      res.json(out);
   } catch (err) {
      next(err);
   }
};
