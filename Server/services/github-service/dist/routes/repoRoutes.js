import express from 'express';
import * as repositoryController from '../controllers/RepositoryController.js';
import { authMiddleware } from '../middleware/auth.js';
const router = express.Router();
router.use(authMiddleware);
router.get('/', repositoryController.getRepositories);
router.post('/sync', repositoryController.syncRepositories);
router.post('/triage', repositoryController.toggleTriageRules);
export default router;
