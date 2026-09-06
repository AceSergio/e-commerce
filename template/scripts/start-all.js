#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const frontendDir = path.join(rootDir, 'frontend');

console.log('\n=============================================================');
console.log('🚀  LANCEMENT COMPLET DE LA PLATEFORME E-COMMERCE');
console.log('=============================================================\n');

const processes = [];

function startProcess(name, command, args, cwd) {
  const isNpm = command === 'npm';
  const proc = spawn(command, args, {
    cwd,
    stdio: 'inherit',
    shell: isNpm,
    env: { ...process.env, FORCE_COLOR: '1' }
  });

  processes.push({ name, proc });

  proc.on('close', (code) => {
    if (code !== 0 && code !== null) {
      console.error(`❌ [${name}] Le processus s'est arrêté avec le code ${code}`);
    }
  });

  return proc;
}

// 1. API Server (Port 3000)
startProcess('API Backend', 'node', [path.join(rootDir, 'server.js')], rootDir);

// 2. Frontend Vite Server (Port 5173) - Boutique & Console Admin intégrée
startProcess('Frontend Vite', 'npm', ['run', 'dev'], frontendDir);

console.log('✨ Tous les services sont en cours de démarrage :');
console.log('  🛒 Boutique & Console Admin : http://localhost:5173');
console.log('  ⚡ API Backend             : http://localhost:3000\n');

function cleanExit() {
  console.log('\n🛑 Arrêt de tous les services...');
  processes.forEach(({ name, proc }) => {
    try {
      proc.kill('SIGINT');
    } catch (e) {
      // Ignore
    }
  });
  setTimeout(() => process.exit(0), 500);
}

process.on('SIGINT', cleanExit);
process.on('SIGTERM', cleanExit);
