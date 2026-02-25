import {
   Router,
   type Request,
   type Response,
   type NextFunction,
   type RequestHandler,
} from 'express';
import { buildAdjustedPlanForDate } from '../services/plan-adjust.service';

const router = Router();

const adjustedHandler: RequestHandler = async (
   req: Request,
   res: Response,
   next: NextFunction
) => {
   try {
      const userId = String(req.query.userId || '');
      const ymd = String((req.query.date || '') as string).trim();
      const mode = String(req.query.mode || 'static') as
         | 'static'
         | 'weekly'
         | 'carry';

      if (!userId || !ymd) {
         res.status(400).json({ error: 'userId and date required' });
         return;
      }

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

router.get('/api/plan/adjusted', adjustedHandler);

export default router;
