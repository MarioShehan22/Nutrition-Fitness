import type { Request, Response } from 'express';
import express from 'express';
import { sendMessage } from './controllers/chat.controller.ts';
import { planController } from './controllers/plan.controller';
import { dailyLogController } from './controllers/dailyLog.controller.ts';
import progressRoutes from './routes/progress.ts';
import logsManualRoutes from './routes/logs.ts';
import PlanActive from './routes/plan-active.ts';
// import logsVisionRoutes from './routes/logs-vision.ts';
import plan from './routes/plan-enrollment.ts';
import adjustedRoutes from './routes/plan.adjusted.routes';

const router = express.Router();

router.get('/', (req: Request, res: Response) => {
   res.send('Hello World!');
});

router.get('/api/hello', (req: Request, res: Response) => {
   res.json({ message: 'Hello World!' });
});

// @ts-ignore
router.post('/api/plan/requirements', planController.createRequirements);
// @ts-ignore
router.post('/api/plan/generate', planController.generatePlan);
// @ts-ignore
router.get('/api/plan/:id', planController.getPlan);
// @ts-ignore
router.get('/api/plans', planController.listPlans);

// @ts-ignore
router.get('/api/logs/daily', dailyLogController.getDaily);
// @ts-ignore
router.patch('/api/logs/daily/meal', dailyLogController.updateMeal);
// @ts-ignore
router.post('/api/logs/daily/water/add', dailyLogController.addWater);
// @ts-ignore
router.patch('/api/logs/daily/water/target', dailyLogController.setWaterTarget);
// @ts-ignore
router.post('/api/chat', sendMessage);

// @ts-ignore
router.post('/api/plan/requirements', planController.createRequirements);
// @ts-ignore
router.post('/api/plan/generate', planController.generatePlan);
// @ts-ignore
router.get('/api/plan/:id', planController.getPlan);
// @ts-ignore
router.use('/api/plan', plan);
router.use('/api/plan-active', PlanActive);

router.use(progressRoutes);
router.use(logsManualRoutes);
// router.use(logsVisionRoutes);
router.use(adjustedRoutes);

export default router;
