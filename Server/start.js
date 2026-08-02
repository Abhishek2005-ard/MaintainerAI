import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const services = [
  { name: 'Gateway',        dir: path.join(__dirname, 'gateway'),                   script: 'index.js' },
  { name: 'AI Service',     dir: path.join(__dirname, 'services', 'ai-service'),     script: path.join('src', 'index.js') },
  { name: 'GitHub Service', dir: path.join(__dirname, 'services', 'github-service'), script: path.join('src', 'index.js') },
  { name: 'Report Service', dir: path.join(__dirname, 'services', 'report-service'), script: path.join('src', 'index.js') },
];

console.log('🚀 Starting all MaintainerAI Backend Microservices...\n');

const children = [];

services.forEach(({ name, dir, script }) => {
  const child = spawn('node', [script], {
    cwd: dir,
    stdio: 'inherit',
    shell: true,
  });

  children.push(child);

  child.on('exit', (code) => {
    if (code !== 0 && code !== null) {
      console.error(`❌ [${name}] exited with code ${code}`);
    } else {
      console.log(`ℹ️ [${name}] stopped.`);
    }
  });
});

function cleanup() {
  console.log('\n🛑 Stopping all MaintainerAI microservices...');
  children.forEach((child) => {
    try {
      if (child.pid) process.kill(child.pid);
    } catch {}
  });
  process.exit(0);
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
