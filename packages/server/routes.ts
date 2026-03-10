import express, {
   type Request,
   type Response,
   type NextFunction,
   type RequestHandler,
} from 'express';
import axios from 'axios';

import { sendMessage } from './controllers/chat.controller';
import planController from './controllers/plan.controller';
import { dailyLogController } from './controllers/dailyLog.controller';
import progressRoutes from './routes/progress';
import logsManualRoutes from './routes/logs';
import PlanActive from './routes/plan-active';
import plan from './routes/plan-enrollment';
import adjustedRoutes from './routes/plan.adjusted.routes';
import { llmClient } from './llm/client';

const router = express.Router();

type AsyncRouteHandler = (
   req: Request,
   res: Response,
   next: NextFunction
) => Promise<void>;

const asyncHandler = (fn: AsyncRouteHandler): RequestHandler => {
   return (req, res, next) => {
      void fn(req, res, next).catch(next);
   };
};

// Plan
router.post('/plan/requirements', planController.createRequirements);
router.post('/plan/generate', planController.generatePlan);
router.get('/plan/:id', planController.getPlan);
router.get('/plans', planController.listPlans);

// Daily Logs
router.get('/logs/daily', dailyLogController.getDaily);
router.patch('/logs/daily/meal', dailyLogController.updateMeal);
router.post('/logs/daily/water/add', dailyLogController.addWater);
router.patch('/logs/daily/water/target', dailyLogController.setWaterTarget);

// Chat
router.post('/chat', sendMessage);

// Nested Routes
router.use('/plan', plan);
router.use('/plan-active', PlanActive);

router.use(progressRoutes);
router.use(logsManualRoutes);
router.use(adjustedRoutes);

router.get(
   '/health/openai',
   asyncHandler(async (_req, res) => {
      try {
         const r = await llmClient.generateText({
            model: process.env.OPENROUTER_MODEL ?? '',
            prompt: 'Reply with exactly: OK',
            temperature: 0,
            maxTokens: 32,
         });

         res.json({
            ok: true,
            model: process.env.OPENROUTER_MODEL ?? null,
            text: r.text,
         });
      } catch (e: unknown) {
         const err = e as {
            response?: { status?: number; data?: any };
            status?: number;
            message?: string;
         };

         const status = err?.response?.status ?? err?.status ?? 500;
         const data = err?.response?.data;

         res.status(status).json({
            ok: false,
            status,
            detail: data?.error?.message ?? err?.message ?? 'Unknown error',
            raw: data ?? null,
         });
      }
   })
);

router.get(
   '/health/openrouter/models',
   asyncHandler(async (_req, res) => {
      try {
         const { data } = await axios.get(
            'https://openrouter.ai/api/v1/models/user',
            {
               headers: {
                  Authorization: `Bearer ${process.env.OPENROUTER_API_KEY ?? ''}`,
               },
               timeout: 60_000,
            }
         );

         res.json(data);
      } catch (e: unknown) {
         const err = e as {
            response?: { status?: number; data?: any };
            message?: string;
         };

         res.status(err?.response?.status ?? 500).json({
            ok: false,
            detail: err?.response?.data ?? err?.message ?? String(e),
         });
      }
   })
);

export default router;
