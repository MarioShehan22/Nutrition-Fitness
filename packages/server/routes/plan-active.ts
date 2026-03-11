import express from 'express';
import { planTodayController } from '../controllers/planToday.controller';

const router = express.Router();

router.get('/today', planTodayController.getToday);

export default router;
