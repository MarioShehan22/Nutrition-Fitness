import type { Request, Response, NextFunction } from 'express';

export type AdjustMode = 'static' | 'weekly' | 'carry';

export interface AdjustedPlanQuery {
   userId: string;
   ymd: string;
   mode: AdjustMode;
}

export function validateAdjustedPlanQuery(
   req: Request,
   res: Response,
   next: NextFunction
) {
   const userId = String(req.query.userId || '').trim();
   const ymd = String(req.query.date || '').trim();
   const modeRaw = String(req.query.mode || 'static');

   const mode: AdjustMode =
      modeRaw === 'weekly' || modeRaw === 'carry' ? modeRaw : 'static';

   if (!userId || !ymd) {
      res.status(400).json({ error: 'userId and date required' });
      return;
   }

   if (!/^\d{4}-\d{2}-\d{2}$/.test(ymd)) {
      res.status(400).json({ error: 'date must be YYYY-MM-DD' });
      return;
   }

   (req as any).adjustedQuery = { userId, ymd, mode };

   next();
}
