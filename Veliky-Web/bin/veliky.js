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
  let interfaces;
  try { interfaces = os.networkInterfaces(); } catch { return '127.0.0.1'; }
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
  .name('veliky')
  .description('🛡️ VELIKY - Sovereign On-Premise Agentic AI Workbench Master Orchestrator')
  .version(JSON.parse(fs.readFileSync(path.join(projectRoot, 'package.json'), 'utf8')).version);

function launchPython(script, args) {
  const venv = path.join(projectsRoot, 'tflite', '.venv', os.platform() === 'win32' ? 'Scripts/python.exe' : 'bin/python');
  const python = process.env.VELIKY_PYTHON || (fs.existsSync(venv) ? venv : os.platform() === 'win32' ? 'python' : 'python3');
  const child = spawn(python, [path.join(projectsRoot, 'tflite', script), ...args], { stdio: 'inherit' });
  child.on('error', err => { console.error('Failed to start VELIKY:', err.message); process.exitCode = 1; });
  child.on('exit', (code, signal) => { process.exitCode = code ?? (signal === 'SIGINT' ? 130 : 1); });
  for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => child.kill(signal));
}

// Command: veliky start / cli
program
  .command('start')
  .alias('cli')
  .description('Launch VELIKY Sovereign Agent CLI (with /model, /agent, /thinking, /tools, /clear)')
  .option('-m, --model <name>', 'Initial model name', process.env.VELIKY_REASONING_MODEL || process.env.MODEL_NAME || 'Qwen/Qwen2.5-1.5B-Instruct')
  .option('--endpoint <url>', 'Use an existing local inference server')
  .option('--no-thinking', 'Disable the thinking indicator')
  .option('--role <role>', 'Knowledge access role', process.env.VELIKY_ROLE || 'analyst')
  .option('--retrieval <mode>', 'vault or hybrid retrieval', 'vault')
  .option('-a, --agent <type>', 'Initial agent persona (general, code, investigator, sre, researcher)', 'general')
  .action((options) => {
    const args = ['--model', options.model, '--agent', options.agent, '--role', options.role, '--retrieval', options.retrieval];
    if (options.endpoint) args.push('--endpoint', options.endpoint);
    if (!options.thinking) args.push('--no-thinking');
    launchPython('veliky_cli.py', args);
  });

for (const [name, description] of [
  ['serve', 'Start the local inference server'],
  ['doctor', 'Check backend dependencies and inference readiness'],
  ['chat', 'Start the tool-enabled harness chat'],
  ['investigate', 'Run a verified investigation'],
  ['rag', 'Search or list knowledge vault notes'],
  ['watch', 'Monitor sensor anomalies'],
]) {
  program.command(name).description(description).allowUnknownOption().allowExcessArguments()
    .helpOption(false).action((_options, command) => launchPython('reinery_cli.py', [name, ...command.args]));
}

// Command: veliky web / open
program
  .command('web')
  .alias('open')
  .description('Open the VELIKY Web Workbench UI in your default browser')
  .action(async () => {
    const url = `http://localhost:${PORT}`;
    console.log(`\n🌐 Opening VELIKY Web Workbench at ${url}...`);
    try {
      await open(url);
      console.log('✅ Browser launched successfully!\n');
    } catch (err) {
      console.error('❌ Could not launch browser automatically:', err.message);
      console.log(`👉 Please open ${url} manually in your browser.\n`);
    }
  });

// Command: veliky pair
program
  .command('pair')
  .description('Generate mobile app pairing QR Code and 6-digit keycode')
  .action(() => {
    const keycode = Math.floor(100000 + Math.random() * 900000).toString();
    const payload = JSON.stringify({
      server: 'VELIKY-DESKTOP-HUB',
      ip: localIP,
      port: PORT,
      code: keycode,
      timestamp: Date.now()
    });

    console.log('\n==================================================');
    console.log('📲 VELIKY MOBILE APP PAIRING');
    console.log('==================================================\n');
    console.log(`🌐 Server IP Address : ${localIP}`);
    console.log(`🔌 Service Port     : ${PORT}`);
    console.log(`🔑 6-Digit Keycode  : \x1b[36m\x1b[1m${keycode}\x1b[0m\n`);

    console.log('Scan the QR code below using your VELIKY Android App:\n');
    qrcode.generate(payload, { small: true });

    console.log('\n💡 Tip: Keep this terminal open while pairing with your phone.\n');
  });

// Command: veliky status
program
  .command('status')
  .description('Check VELIKY system telemetry and service health')
  .action(async () => {
    const totalMem = (os.totalmem() / (1024 * 1024 * 1024)).toFixed(2);
    const freeMem = (os.freemem() / (1024 * 1024 * 1024)).toFixed(2);
    const cpus = os.cpus().length;

    console.log('\n==================================================');
    console.log('📊 VELIKY SYSTEM STATUS TELEMETRY');
    console.log('==================================================\n');
    console.log(`🖥️  Host System       : ${os.type()} ${os.release()} (${os.arch()})`);
    console.log(`💻 CPU Cores         : ${cpus} cores (${os.cpus()[0]?.model || 'Generic CPU'})`);
    console.log(`🧠 Memory            : ${freeMem} GB free of ${totalMem} GB total`);
    console.log(`🌐 Local IP          : ${localIP}`);
    console.log(`🔌 Web Port          : ${PORT}`);
    console.log(`🤖 Agent Runtime     : Veliky Harness (stdio)`);
    for (const [name, url] of [
      ['Web', 'http://127.0.0.1:5173'],
      ['Gateway', 'http://127.0.0.1:8766/health'],
      ['Model API', `${process.env.VELIKY_REASONING_ENDPOINT || 'http://127.0.0.1:8000/v1'}/models`],
    ]) {
      try {
        const response = await fetch(url, { signal: AbortSignal.timeout(2000) });
        console.log(`${name}: ${response.ok ? 'Online' : `HTTP ${response.status}`}`);
        if (!response.ok) process.exitCode = 1;
      } catch { console.log(`${name}: Unreachable`); process.exitCode = 1; }
    }
  });

// Command: veliky update
program
  .command('update')
  .description('Reinstall dependencies and refresh the CLI link for this checkout')
  .action(() => {
    console.log('\n==================================================');
    console.log('🔄 Refreshing VELIKY Installation');
    console.log('==================================================\n');
    console.log('📥 Installing dependencies from this checkout...\n');

    const installScript = os.platform() === 'win32' ? 'install.ps1' : 'install.sh';
    const installerPath = path.join(projectRoot, installScript);

    const updater = spawn(
      os.platform() === 'win32' ? 'powershell' : 'bash',
      [installerPath],
      { stdio: 'inherit', cwd: projectRoot }
    );

    updater.on('error', err => { console.error('Update failed:', err.message); process.exitCode = 1; });
    updater.on('close', (code) => {
      process.exitCode = code ?? 1;
      if (code === 0) {
        console.log('\n✅ VELIKY installation refreshed successfully!\n');
      } else {
        console.error(`\n❌ Update failed with exit code ${code}. Please try running install script manually.\n`);
      }
    });
  });

// Default behavior when typing 'veliky' with no args
if (process.argv.length === 2) {
  process.argv.push('start');
}

program.parse(process.argv);
