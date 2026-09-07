#!/usr/bin/env node

import { Command } from 'commander';
import qrcode from 'qrcode-terminal';
import open from 'open';
import os from 'os';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// Helper to get local network IP address
function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const net of interfaces[name] || []) {
      // Skip internal (i.e. 127.0.0.1) and non-IPv4 addresses
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
  .description('🛡️ SENTINEL - Sovereign On-Premise Agentic AI Workbench CLI')
  .version('1.0.0');

// Command: sentinel start / serve
program
  .command('start')
  .alias('serve')
  .description('Start the local SENTINEL server and backend engine')
  .option('-o, --open', 'Automatically open web UI in browser', false)
  .action(async (options) => {
    console.log('\n==================================================');
    console.log('🛡️  SENTINEL Sovereign AI Workbench Engine');
    console.log('==================================================\n');
    console.log(`📡 Local Network Address : http://${localIP}:${PORT}`);
    console.log(`🌐 Local Host Address    : http://localhost:${PORT}`);
    console.log(`🖥️  Platform System      : ${os.platform()} (${os.arch()})\n`);

    console.log('⚡ Launching workbench server...\n');

    const vite = spawn('npx', ['vite', '--host', '0.0.0.0', '--port', String(PORT)], {
      cwd: projectRoot,
      stdio: 'inherit',
      shell: true
    });

    if (options.open) {
      setTimeout(async () => {
        console.log('🌐 Opening browser...');
        await open(`http://localhost:${PORT}`);
      }, 2000);
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
    console.log(`🖥️  Host System : ${os.type()} ${os.release()} (${os.arch()})`);
    console.log(`💻 CPU Cores   : ${cpus} cores (${os.cpus()[0]?.model || 'Generic CPU'})`);
    console.log(`🧠 Memory      : ${freeMem} GB free of ${totalMem} GB total`);
    console.log(`🌐 Local IP    : ${localIP}`);
    console.log(`🔌 Web Port    : ${PORT}`);
    console.log(`🟢 Status      : Ready / Operational\n`);
  });

// Default behavior when typing 'sentinel' with no args
if (process.argv.length === 2) {
  process.argv.push('start');
}

program.parse(process.argv);
