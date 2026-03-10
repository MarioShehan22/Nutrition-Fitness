import { Router } from 'express';
import { validateAdjustedPlanQuery } from '../middlewares/validateAdjustedPlan.ts';
import { getAdjustedPlan } from '../controllers/planAdjusted.controller';

const router = Router();

router.get('/plan/adjusted', validateAdjustedPlanQuery, getAdjustedPlan);

export default router;
