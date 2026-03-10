import express from 'express';
import { logsController } from '../controllers/logs.controller';
import { validateManualLog } from '../middlewares/validateManualLog';

const router = express.Router();

router.post('/logs/manual', validateManualLog, logsController.logManual);

export default router;
