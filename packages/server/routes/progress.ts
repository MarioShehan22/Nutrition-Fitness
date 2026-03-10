import express from 'express';
import { progressController } from '../controllers/progress.controller';

const router = express.Router();

router.get('/progress/timeseries', progressController.getTimeseries);

export default router;
