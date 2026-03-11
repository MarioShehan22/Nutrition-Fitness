import { Router } from 'express';
import { planEnrollmentController } from '../controllers/planEnrollment.controller';

const router = Router();

router.post('/enroll', planEnrollmentController.postEnroll);
router.get('/:id', planEnrollmentController.getPlan);

export default router;
