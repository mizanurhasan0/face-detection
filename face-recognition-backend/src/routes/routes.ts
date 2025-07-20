import { Router } from 'express';
import { checkOrSaveFace, getLocation } from '../controller/face.controller';

const router = Router();

router.post('/check-or-save', checkOrSaveFace);
router.get('/location', getLocation);

export default router;
