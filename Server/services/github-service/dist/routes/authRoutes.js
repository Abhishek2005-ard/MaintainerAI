import express from 'express';
import * as authController from '../controllers/AuthController.js';
const router = express.Router();
router.get('/login', authController.loginRedirect);
router.get('/callback', authController.handleCallback);
router.get('/install', authController.getInstallUrl);
router.get('/installation/callback', authController.handleInstallationCallback);
export default router;
