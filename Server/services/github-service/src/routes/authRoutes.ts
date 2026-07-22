import express from 'express';
import { authController } from '../controllers/AuthController.js';

const router = express.Router();

router.get('/login', authController.loginRedirect);
router.get('/callback', authController.handleCallback);

export default router;
