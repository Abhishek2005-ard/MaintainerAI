import express from 'express';

const router = express.Router();

// No auth needed — used by Docker, k8s probes, and monitoring tools
router.get('/health', (_req, res) => {
  res.status(200).json({
    service: 'MaintainerAI Agent Service',
    status: 'active',
    timestamp: new Date().toISOString(),
  });
});

export default router;
