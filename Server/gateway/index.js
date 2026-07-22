import express from 'express';
import cors from 'cors';
import proxy from 'express-http-proxy';

const app = express();
const PORT = 8000;

// Microservice Ports & URLs
const AUTH_SERVICE_URL = 'http://localhost:8001';
const TRIAGE_SERVICE_URL = 'http://localhost:8002';
const GITHUB_SERVICE_URL = 'http://localhost:8003';

app.use(cors());

// 1. Auth Service Route -> http://localhost:8001
app.use('/api/auth', proxy(AUTH_SERVICE_URL));

// 2. Triage Service Route -> http://localhost:8002
app.use('/api/triage', proxy(TRIAGE_SERVICE_URL));

// 3. GitHub Service Route -> http://localhost:8003
app.use('/api/github', proxy(GITHUB_SERVICE_URL));

// Gateway Health Check
app.get('/health', (req, res) => {
  res.send('API Gateway is running');
});

app.listen(PORT, () => {
  console.log(`API Gateway listening on http://localhost:${PORT}`);
  console.log(`- Proxying /api/auth -> ${AUTH_SERVICE_URL}`);
  console.log(`- Proxying /api/triage -> ${TRIAGE_SERVICE_URL}`);
  console.log(`- Proxying /api/github -> ${GITHUB_SERVICE_URL}`);
});
