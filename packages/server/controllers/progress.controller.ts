import type { RequestHandler } from 'express';
import { progressService } from '../services/progress.service';

const getTimeseries: RequestHandler = async (req, res) => {
   try {
      const userId =
         typeof req.query.userId === 'string' ? req.query.userId.trim() : '';

      if (!userId) {
         res.status(400).json({ error: 'userId required' });
         return;
      }

      const modeParam =
         typeof req.query.mode === 'string' ? req.query.mode : 'static';

      const mode: 'static' | 'weekly' | 'carry' =
         modeParam === 'weekly' || modeParam === 'carry' ? modeParam : 'static';

      const toleranceRaw =
         typeof req.query.tolerance === 'string'
            ? Number(req.query.tolerance)
            : 0.1;

      const capPctRaw =
         typeof req.query.capPct === 'string' ? Number(req.query.capPct) : 0.2;

      const from =
         typeof req.query.from === 'string' ? req.query.from.trim() : '';

      const to = typeof req.query.to === 'string' ? req.query.to.trim() : '';

      const result = await progressService.getTimeseries({
         userId,
         mode,
         tolerance: toleranceRaw,
         capPct: capPctRaw,
         from,
         to,
      });

      res.json(result);
   } catch (err: unknown) {
      const error = err as { message?: string };
      res.status(500).json({
         error: error?.message ?? 'Failed to load progress timeseries',
      });
   }
};

export const progressController = {
   getTimeseries,
};

export default progressController;
