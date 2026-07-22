import express from 'express';
import { issueController } from '../controllers/IssueController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.use(authMiddleware);

router.get('/:owner/:repo/issues', issueController.getIssues);
router.post('/:owner/:repo/issues', issueController.createIssue);
router.patch('/:owner/:repo/issues/:number', issueController.updateIssue);
router.post('/:owner/:repo/issues/:number/comments', issueController.createComment);
router.get('/:owner/:repo/issues/:number/comments', issueController.getComments);

export default router;
