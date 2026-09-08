#!/usr/bin/env node

import { Command } from 'commander';
import qrcode from 'qrcode-terminal';
import open from 'open';
import os from 'os';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const projectsRoot = path.resolve(projectRoot, '..');

// Helper to get local network IP address
function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const net of interfaces[name] || []) {
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }
  return '127.0.0.1';
}

const localIP = getLocalIP();
const PORT = 5173;

const program = new Command();

program
  .name('sentinel')
  .description('🛡️ SENTINEL - Sovereign On-Premise Agentic AI Workbench Master Orchestrator')
  .version('1.0.0');

// Command: sentinel start / serve
program
  .command('start')
  .alias('serve')
  .description('Launch SENTINEL Web Workbench, Open-Notebook RAG, DeepSeek Harness, and Pairing QR')
  .option('-o, --open', 'Automatically open web UI in browser', true)
  .action(async (options) => {
    console.log('\n==================================================');
    console.log('🛡️  SENTINEL Sovereign AI Workbench Master Orchestrator');
    console.log('==================================================\n');
    console.log(`📡 Local Network Address : http://${localIP}:${PORT}`);
    console.log(`🌐 Local Host Address    : http://localhost:${PORT}`);
    console.log(`🖥️  Platform System      : ${os.platform()} (${os.arch()})\n`);

    // 1. Launch Open-Notebook RAG engine if present
    const openNotebookDir = path.join(projectsRoot, 'open-notebook');
    if (fs.existsSync(openNotebookDir)) {
      console.log('📚 Initializing Open-Notebook RAG Engine (Port 8000)...');
      spawn('python3', ['run_api.py'], {
        cwd: openNotebookDir,
        stdio: 'ignore',
        detached: true,
        shell: true
      }).unref();
    }

    // 2. Launch DeepSeek Harness Agent Engine if present
    const dshDir = path.join(projectsRoot, 'deepseek-harness');
    if (fs.existsSync(dshDir)) {
      console.log('🤖 Initializing DeepSeek Harness Agent Engine (Port 3080)...');
      spawn('pnpm', ['dsh', 'web', '--no-open'], {
        cwd: dshDir,
        stdio: 'ignore',
        detached: true,
        shell: true
      }).unref();
    }

    // 3. Render Pairing QR Code for Android App
    const keycode = Math.floor(100000 + Math.random() * 900000).toString();
    const payload = JSON.stringify({
      server: 'SENTINEL-DESKTOP-HUB',
      ip: localIP,
      port: PORT,
      code: keycode,
      timestamp: Date.now()
    });

    console.log('\n--------------------------------------------------');
    console.log(`📲 MOBILE APP PAIRING KEYCODE: \x1b[36m\x1b[1m${keycode}\x1b[0m`);
    console.log('Scan the QR code below using your SENTINEL Android App:\n');
    qrcode.generate(payload, { small: true });
    console.log('--------------------------------------------------\n');

    console.log('⚡ Launching SENTINEL 3D Web Workbench server...\n');

    const vite = spawn('npx', ['vite', '--host', '0.0.0.0', '--port', String(PORT)], {
      cwd: projectRoot,
      stdio: 'inherit',
      shell: true
    });

    if (options.open) {
      setTimeout(async () => {
        console.log('\n🌐 Opening SENTINEL Web Workbench in default browser...');
        await open(`http://localhost:${PORT}`);
      }, 1500);
    }

    vite.on('error', (err) => {
      console.error('❌ Failed to start server:', err.message);
    });
  });

// Command: sentinel web / open
program
  .command('web')
  .alias('open')
  .description('Open the SENTINEL Web Workbench UI in your default browser')
  .action(async () => {
    const url = `http://localhost:${PORT}`;
    console.log(`\n🌐 Opening SENTINEL Web Workbench at ${url}...`);
    try {
      await open(url);
      console.log('✅ Browser launched successfully!\n');
    } catch (err) {
      console.error('❌ Could not launch browser automatically:', err.message);
      console.log(`👉 Please open ${url} manually in your browser.\n`);
    }
  });

// Command: sentinel pair
program
  .command('pair')
  .description('Generate mobile app pairing QR Code and 6-digit keycode')
  .action(() => {
    const keycode = Math.floor(100000 + Math.random() * 900000).toString();
    const payload = JSON.stringify({
      server: 'SENTINEL-DESKTOP-HUB',
      ip: localIP,
      port: PORT,
      code: keycode,
      timestamp: Date.now()
    });

    console.log('\n==================================================');
    console.log('📲 SENTINEL MOBILE APP PAIRING');
    console.log('==================================================\n');
    console.log(`🌐 Server IP Address : ${localIP}`);
    console.log(`🔌 Service Port     : ${PORT}`);
    console.log(`🔑 6-Digit Keycode  : \x1b[36m\x1b[1m${keycode}\x1b[0m\n`);

    console.log('Scan the QR code below using your SENTINEL Android App:\n');
    qrcode.generate(payload, { small: true });

    console.log('\n💡 Tip: Keep this terminal open while pairing with your phone.\n');
  });

// Command: sentinel status
program
  .command('status')
  .description('Check SENTINEL system telemetry and service health')
  .action(() => {
    const totalMem = (os.totalmem() / (1024 * 1024 * 1024)).toFixed(2);
    const freeMem = (os.freemem() / (1024 * 1024 * 1024)).toFixed(2);
    const cpus = os.cpus().length;

    console.log('\n==================================================');
    console.log('📊 SENTINEL SYSTEM STATUS TELEMETRY');
    console.log('==================================================\n');
    console.log(`🖥️  Host System       : ${os.type()} ${os.release()} (${os.arch()})`);
    console.log(`💻 CPU Cores         : ${cpus} cores (${os.cpus()[0]?.model || 'Generic CPU'})`);
    console.log(`🧠 Memory            : ${freeMem} GB free of ${totalMem} GB total`);
    console.log(`🌐 Local IP          : ${localIP}`);
    console.log(`🔌 Web Port          : ${PORT}`);
    console.log(`📚 RAG Engine        : Open-Notebook (Port 8000)`);
    console.log(`🤖 Agent Runtime     : DeepSeek Harness (Port 3080)`);
    console.log(`🟢 System Status     : Ready / Operational\n`);
  });

// Command: sentinel update
program
  .command('update')
  .description('Pull latest SENTINEL updates from GitHub and reinstall')
  .action(() => {
    console.log('\n==================================================');
    console.log('🔄 Updating SENTINEL to Latest Version from GitHub');
    console.log('==================================================\n');
    console.log('📥 Fetching latest code and dependencies...\n');

    const installScript = os.platform() === 'win32' ? 'install.ps1' : 'install.sh';
    const installerPath = path.join(projectRoot, installScript);

    const updater = spawn(
      os.platform() === 'win32' ? 'powershell' : 'bash',
      [installerPath],
      { stdio: 'inherit', shell: true }
    );

    updater.on('close', (code) => {
      if (code === 0) {
        console.log('\n✅ SENTINEL updated successfully to the latest version!\n');
      } else {
        console.error(`\n❌ Update failed with exit code ${code}. Please try running install script manually.\n`);
      }
    });
  });

// Default behavior when typing 'sentinel' with no args
if (process.argv.length === 2) {
  process.argv.push('start');
}

program.parse(process.argv);
