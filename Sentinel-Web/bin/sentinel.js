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

// Command: sentinel start / cli
program
  .command('start')
  .alias('cli')
  .alias('serve')
  .description('Launch SENTINEL Sovereign Agent CLI (with /model, /agent, /thinking, /tools, /clear)')
  .option('-m, --model <name>', 'Initial model name', 'Qwen/Qwen2.5-0.5B-Instruct')
  .option('-a, --agent <type>', 'Initial agent persona (general, code, investigator, sre, researcher)', 'general')
  .action((options) => {
    const homeTflitePython = path.join(os.homedir(), 'tflite', '.venv', 'bin', 'python');
    const projectsTflitePython = path.join(projectsRoot, 'tflite', '.venv', 'bin', 'python');
    const systemPython = os.platform() === 'win32' ? 'python' : 'python3';
    const pythonBin = fs.existsSync(homeTflitePython) ? homeTflitePython : (fs.existsSync(projectsTflitePython) ? projectsTflitePython : systemPython);
    const scriptPath = path.join(__dirname, 'deepseek_cli.py');

    const cli = spawn(pythonBin, [scriptPath, '--model', options.model, '--agent', options.agent], {
      cwd: process.cwd(),
      stdio: 'inherit'
    });

    cli.on('error', (err) => {
      console.error('❌ Failed to start SENTINEL CLI:', err.message);
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
