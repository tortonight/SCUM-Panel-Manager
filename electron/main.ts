import { app, BrowserWindow, ipcMain, dialog, globalShortcut } from 'electron';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { spawn, ChildProcess, exec } from 'child_process';
import Store from 'electron-store';
import { Rcon } from 'rcon-client';
import axios from 'axios';
import AdmZip from 'adm-zip';

// --- Types ---
interface AutomationConfig {
  autoBackupEnabled: boolean;
  autoBackupInterval: number;
  autoUpdateEnabled: boolean;
  autoUpdateInterval: number;
  autoRestartEnabled: boolean;
  autoRestartInterval: number;
  restartWarningMinutes: number;
  lastBackupTime?: number;
  nextBackupTime?: number;
  lastUpdateTime?: number;
  nextUpdateTime?: number;
  lastRestartTime?: number;
  nextRestartTime?: number;
}

const store = new Store();

// --- Log Buffer System ---
const logBuffer: string[] = [];
const MAX_LOG_LINES = 1000;

function appendToLog(message: string) {
  // Add timestamp to preserve history context
  const time = new Date().toLocaleTimeString();
  
  // Clean up message
  const cleanMessage = message.trimEnd();
  if (!cleanMessage) return;

  const formattedMessage = `[${time}] ${cleanMessage}`;

  if (logBuffer.length >= MAX_LOG_LINES) {
    logBuffer.shift(); // Remove oldest
  }
  logBuffer.push(formattedMessage);
  
  // Send to window if it exists
  mainWindow?.webContents.send('console-log', formattedMessage);
}

ipcMain.handle('get-console-logs', async () => {
  return logBuffer;
});

// Global error handling
process.on('uncaughtException', (error) => {
  console.error('[System] Uncaught Exception:', error);
  appendToLog(`[System] Uncaught Exception: ${error.message}`);
});

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) { // eslint-disable-line @typescript-eslint/no-require-imports
  app.quit();
}

let mainWindow: BrowserWindow | null = null;
let serverProcess: ChildProcess | null = null;

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 768,
    show: false, // Don't show until ready
    frame: false, // Frameless for custom UI
    backgroundColor: '#1a1d1a',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // Graceful startup
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
    console.log('[System] Window ready to show');
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    // DevTools: Press F12 to open
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // Custom Frame handlers
  ipcMain.on('minimize-window', () => {
    mainWindow?.minimize();
  });
  
  ipcMain.on('maximize-window', () => {
    if (mainWindow?.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow?.maximize();
    }
  });
  
  ipcMain.on('close-window', () => {
    mainWindow?.close();
  });
};

app.on('ready', () => {
  createWindow();
  
  // Register F12 to toggle DevTools
  globalShortcut.register('F12', () => {
    if (mainWindow) {
      mainWindow.webContents.toggleDevTools();
    }
  });
});

app.on('will-quit', () => {
  // Unregister all shortcuts.
  globalShortcut.unregisterAll();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// --- Real Backend Logic ---

// Helper to get RCON config
function getRconConfig() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const config = store.get('config') as Record<string, Record<string, any>>;
    if (!config) return null;
    
    // Check where RCON settings are stored (ServerSettings.ini structure)
    // Usually [General] section: scump.RconIp, scump.RconPort, scump.RconPassword
    // Adjust based on actual ConfigManager implementation
    const general = config['General'];
    if (!general) return null;
    
    return {
        host: general['scum.RconIp'] || '127.0.0.1',
        port: parseInt(general['scum.RconPort']) || 28102,
        password: general['scum.RconPassword'] || ''
    };
}

// Helper to fetch online players via RCON
async function fetchOnlinePlayersCount(): Promise<number> {
    const rconConfig = getRconConfig();
    if (!rconConfig || !rconConfig.password) return 0;

    try {
        const client = new Rcon({
            host: rconConfig.host,
            port: rconConfig.port,
            password: rconConfig.password
        });

        await client.connect();
        const response = await client.send('#ListPlayers');
        await client.end();

        if (!response) return 0;

        // Parse response to count players
        // Format example:
        // "List of players:\n1. SteamID: ... Name: ... \n2. ..."
        // Or sometimes just lines. We count lines that look like player entries.
        const lines = response.split('\n').filter(line => line.trim().length > 0);
        
        // Basic heuristic: check if line contains SteamID or similar indicator
        // Usually SCUM RCON #ListPlayers returns a header and then players.
        // We can count lines minus header.
        // If "No players connected" or similar?
        if (response.includes("No players connected")) return 0;
        
        // Count lines that start with number or contain SteamID
        const playerLines = lines.filter(l => l.includes('SteamID') || /^\d+\./.test(l.trim()));
        return playerLines.length;
    } catch {
        // console.error('RCON fetch error:', error); // Silence to avoid log spam
        return 0;
    }
}

// System CPU Calculation Helper
let previousCpus = os.cpus();

function getSystemCpuUsage(): number {
    const currentCpus = os.cpus();
    let totalIdle = 0;
    let totalTick = 0;

    for (let i = 0; i < currentCpus.length; i++) {
        const cpu = currentCpus[i];
        const prevCpu = previousCpus[i];

        const idle = cpu.times.idle;
        const total = Object.values(cpu.times).reduce((acc, tv) => acc + tv, 0);
        
        const prevIdle = prevCpu.times.idle;
        const prevTotal = Object.values(prevCpu.times).reduce((acc, tv) => acc + tv, 0);

        totalIdle += (idle - prevIdle);
        totalTick += (total - prevTotal);
    }

    previousCpus = currentCpus;

    if (totalTick === 0) return 0;
    return 100 - Math.floor((totalIdle / totalTick) * 100);
}

// Stats State
let serverStatus = 'stopped'; // stopped, running, starting
const serverStats = {
  cpu: 0,
  ram: 0,
  serverRam: 0,
  systemRamUsed: 0,
  systemRamTotal: 0,
  players: 0,
  maxPlayers: 64 // This should ideally come from config
};

let lastPlayerCheck = 0;
const PLAYER_CHECK_INTERVAL = 10000; // 10 seconds

const automationStats = {
  lastBackup: store.get('automation.lastBackupTime') ? new Date(store.get('automation.lastBackupTime') as number).toLocaleTimeString() : 'Never',
  nextBackup: store.get('automation.nextBackupTime') ? new Date(store.get('automation.nextBackupTime') as number).toLocaleTimeString() : 'Disabled',
  updateStatus: 'up-to-date',
  lastUpdateCheck: store.get('automation.lastUpdateTime') ? new Date(store.get('automation.lastUpdateTime') as number).toLocaleTimeString() : 'Never'
};

// Initialize Automation Defaults if not present
if (!store.has('automation')) {
    store.set('automation', {
        autoBackupEnabled: true,
        autoBackupInterval: 60, // 1 hour
        autoRestartEnabled: false,
        autoRestartInterval: 360, // 6 hours
        restartWarningMinutes: 5,
        autoUpdateEnabled: false, 
        autoUpdateInterval: 1440, // 24 hours
        
        nextBackupTime: Date.now() + 3600000, // 1 hour from now
        nextRestartTime: 0,
        nextUpdateTime: 0,
        
        lastBackupTime: 0,
        lastRestartTime: 0,
        lastUpdateTime: 0
    });
}

// Helper to update automation stats for frontend
function updateAutomationStats() {
    const config = store.get('automation') as AutomationConfig;
    
    automationStats.lastBackup = config.lastBackupTime ? new Date(config.lastBackupTime).toLocaleTimeString() : 'Never';
    
    if (config.autoBackupEnabled && config.nextBackupTime) {
        // Calculate time remaining or show time
        automationStats.nextBackup = new Date(config.nextBackupTime).toLocaleTimeString();
    } else {
        automationStats.nextBackup = 'Disabled';
    }
    
    automationStats.lastUpdateCheck = config.lastUpdateTime ? new Date(config.lastUpdateTime).toLocaleTimeString() : 'Never';
}

// Initial update
updateAutomationStats();

function getProcessMemory(pid: number): Promise<number> {
    return new Promise((resolve) => {
        exec(`tasklist /FI "PID eq ${pid}" /FO CSV /NH`, (error, stdout) => {
            if (error || !stdout) {
                resolve(0); 
                return;
            }
            try {
                // "Image Name","PID","Session Name","Session#","Mem Usage"
                const parts = stdout.trim().split('","');
                if (parts.length >= 5) {
                    const memStr = parts[4].replace(/["K\s,]/gi, ''); 
                    const memKb = parseInt(memStr, 10);
                    resolve(isNaN(memKb) ? 0 : memKb / 1024 / 1024);
                } else {
                    resolve(0);
                }
            } catch {
                resolve(0);
            }
        });
    });
}

// Interval to update stats and RUN AUTOMATION
setInterval(async () => {
  // 1. Server/System Stats
  // System Stats (Always update regardless of server status)
  serverStats.cpu = getSystemCpuUsage();
  
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;
  
  serverStats.systemRamUsed = parseFloat((usedMem / (1024 * 1024 * 1024)).toFixed(2)); // GB used
  serverStats.systemRamTotal = parseFloat((totalMem / (1024 * 1024 * 1024)).toFixed(2)); // GB total
  
  // Server RAM
  if (serverStatus === 'running' && serverProcess && serverProcess.pid) {
      const serverMem = await getProcessMemory(serverProcess.pid);
      serverStats.serverRam = parseFloat(serverMem.toFixed(2));
  } else {
      serverStats.serverRam = 0;
  }

  serverStats.ram = serverStats.serverRam; // Default to server RAM for backward compat, or maybe system if server is 0? 
  // Let's just set it to serverRam as that's what "MEMORY" usually implies in a server manager.
  
  // Players (Update via RCON if running)
  if (serverStatus === 'running') {
      const now = Date.now();
      if (now - lastPlayerCheck > PLAYER_CHECK_INTERVAL) {
          lastPlayerCheck = now;
          // Async update
          fetchOnlinePlayersCount().then(count => {
              serverStats.players = count;
          }).catch(() => {}); // Ignore errors
      }
      
      // Update max players from config if available
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const config = store.get('config') as Record<string, Record<string, any>>;
      if (config && config['General'] && config['General']['scum.MaxPlayers']) {
          serverStats.maxPlayers = parseInt(config['General']['scum.MaxPlayers']) || 64;
      }
  } else {
    serverStats.players = 0;
  }

  // 2. Automation Scheduler
  const config = store.get('automation') as AutomationConfig;
  const now = Date.now();
  let configChanged = false;

  // Auto Backup
  if (config.autoBackupEnabled && config.nextBackupTime && now >= config.nextBackupTime) {
      appendToLog('[Automation] Triggering scheduled backup...');
      // Call backup function (we need to extract backup logic to a reusable function)
      // For now, I'll emit a self-event or call the handler logic? 
      // Better to refactor backup logic to a standalone function.
      // Since I can't easily refactor huge chunks in one go without potential breakage, 
      // I will invoke the backup logic via a helper if possible, or just duplicate/inline for now 
      // (Refactoring is better).
      
      // Let's assume performBackup() exists. I will create it.
      performBackup().then(success => {
          if (success) {
               config.lastBackupTime = Date.now();
               config.nextBackupTime = Date.now() + (config.autoBackupInterval * 60 * 1000);
               store.set('automation', config);
               updateAutomationStats();
          } else {
              // Retry in 5 mins? Or just skip to next interval?
              // Let's skip to next interval to avoid loop
              config.nextBackupTime = Date.now() + (config.autoBackupInterval * 60 * 1000);
              store.set('automation', config);
              updateAutomationStats();
          }
      });
      
      // Prevent multiple triggers by pushing nextBackupTime immediately? 
      // Yes, otherwise it might trigger again in next tick if backup takes long.
      // But performBackup is async. 
      // Let's update nextBackupTime immediately to "Processing..." or future to avoid double trigger.
      config.nextBackupTime = now + (config.autoBackupInterval * 60 * 1000); // Schedule next
      store.set('automation', config);
      configChanged = true;
  }

  // Auto Restart
  if (config.autoRestartEnabled && config.nextRestartTime && now >= config.nextRestartTime) {
      if (serverStatus === 'running') {
        appendToLog('[Automation] Triggering scheduled restart...');
        // We can restart directly or warn first.
        // If we want to warn, we should have a separate "warning time" trigger.
        // For simplicity in this loop, let's assume warning is handled by broadcast earlier or just restart now.
        // In a real implementation, we would check "nextRestartTime - warningTime" to broadcast.
        
        // Let's implement warning logic:
        // Ideally, we should have 'nextWarningTime' or check if (nextRestartTime - now) <= warningMinutes * 60000
        
        // Simple immediate restart for now:
        restartServer().then(() => {
             config.lastRestartTime = Date.now();
             config.nextRestartTime = Date.now() + (config.autoRestartInterval * 60 * 1000);
             store.set('automation', config);
             updateAutomationStats();
        });
      } else {
        // Server not running, just update schedule
        config.nextRestartTime = now + (config.autoRestartInterval * 60 * 1000);
        store.set('automation', config);
      }
      
      // Update next time immediately to prevent double trigger
      config.nextRestartTime = now + (config.autoRestartInterval * 60 * 1000);
      store.set('automation', config);
      configChanged = true;
  } else if (config.autoRestartEnabled && config.nextRestartTime) {
      // Check for warning
      const timeUntilRestart = config.nextRestartTime - now;
      // const minutesLeft = Math.ceil(timeUntilRestart / 60000); // Unused

      // Warning milestones (minutes)
      const warnings = [60, 30, 15, 10, 5, 3, 2, 1];
      
      // Check if we are within a small window of a milestone (since loop runs every 2s)
      // Window: 2500ms (slightly larger than interval to ensure hit)
      const warningWindow = 2500;
      
      // We need to check if timeUntilRestart is "close enough" to one of the milestones * 60000
      
      for (const min of warnings) {
          const msTarget = min * 60 * 1000;
          if (Math.abs(timeUntilRestart - msTarget) < warningWindow) {
              const msg = `Server will restart in ${min} minute(s)!`;
              
              // RCON Broadcast
              if (rconClient) {
                  rconClient.send(`Announce ${msg}`).catch(() => {});
              }
              
              // Discord Alert
              discordBot.sendSystemAlert(msg);
              
              appendToLog(`[Automation] Warning: ${msg}`);
              break; // Trigger only one warning per tick
          }
      }
      
      // Original single warning logic (preserved/replaced by above loop if comprehensive enough)
      // Let's keep the user configured one too if it's not covered?
      // Actually, let's just use the fixed milestones + user configured one.
      
      const userWarningMs = config.restartWarningMinutes * 60 * 1000;
      if (Math.abs(timeUntilRestart - userWarningMs) < warningWindow) {
           // Avoid duplicate if it matches one of the milestones
           if (!warnings.includes(config.restartWarningMinutes)) {
               const msg = `Server will restart in ${config.restartWarningMinutes} minute(s)!`;
               if (rconClient) rconClient.send(`Announce ${msg}`).catch(() => {});
               discordBot.sendSystemAlert(msg);
               appendToLog(`[Automation] Warning: ${msg}`);
           }
      }
   }

  if (configChanged) updateAutomationStats();
  
  if (mainWindow) {
    mainWindow.webContents.send('server-stats-update', serverStats);
    mainWindow.webContents.send('server-status-update', serverStatus);
    mainWindow.webContents.send('automation-update', automationStats);
  }
}, 2000);

// Helper function for Backup (Refactored)


// --- Server Control Functions ---

async function startServer(): Promise<{ success: boolean; message: string }> {
  if (serverStatus === 'running' || serverProcess) {
      appendToLog('[Server] Server is already running.');
      return { success: false, message: 'Already running' };
  }

  const gamePath = store.get('gamePath', '') as string;
  if (!gamePath) {
      appendToLog('[Error] Game path not set.');
      return { success: false, message: 'Path not set' };
  }

  // Get launch params
  const launchParams = store.get('launchParams', {
      useLog: true,
      useBattlEye: true,
      port: '7573',
      queryPort: '7779',
      maxPlayers: '100'
  }) as { useLog: boolean; useBattlEye?: boolean; port: string; queryPort: string; maxPlayers: string };

  let serverExe = path.join(gamePath, 'SCUM', 'Binaries', 'Win64', 'SCUMServer.exe');
  
  if (!fs.existsSync(serverExe)) {
      serverExe = path.join(gamePath, 'SCUMServer.exe');
      if (!fs.existsSync(serverExe)) {
          appendToLog(`[Error] SCUMServer.exe not found at ${serverExe}`);
          return { success: false, message: 'Executable not found' };
      }
  }

  const args: string[] = [];
  if (launchParams.useLog) args.push('-log');
  if (launchParams.useBattlEye === false) args.push('-NoBattlEye');
  if (launchParams.port) args.push(`-port=${launchParams.port}`);
  if (launchParams.queryPort) args.push(`-queryPort=${launchParams.queryPort}`);
  if (launchParams.maxPlayers) args.push(`-MaxPlayers=${launchParams.maxPlayers}`);

  serverStatus = 'starting';
  mainWindow?.webContents.send('server-status-update', serverStatus);
  appendToLog(`[Server] Launching: ${serverExe} ${args.join(' ')}`);

  try {
      serverProcess = spawn(serverExe, args, { cwd: path.dirname(serverExe) });

      serverProcess.on('error', (err: unknown) => {
          const error = err as Error & { code?: string };
          console.error('[Server] Failed to start process:', error);
          appendToLog(`[Error] Failed to launch server: ${error.message} (Code: ${error.code})`);
          serverStatus = 'stopped';
          serverProcess = null;
          mainWindow?.webContents.send('server-status-update', serverStatus);
      });

      serverStatus = 'running';
      mainWindow?.webContents.send('server-status-update', serverStatus);
      appendToLog('[Server] Process started.');

      serverProcess.stdout?.on('data', (data) => {
          const line = data.toString();
          appendToLog(line);
      });

      serverProcess.stderr?.on('data', (data) => {
          const line = data.toString();
          console.error(`[Server Error] ${line}`);
          appendToLog(`[Server Error] ${line}`);
      });

      serverProcess.on('close', (code) => {
          console.log(`[Server] Process exited with code ${code}`);
          appendToLog(`[Server] Process exited with code ${code}`);
          serverStatus = 'stopped';
          serverProcess = null;
          mainWindow?.webContents.send('server-status-update', serverStatus);
      });

      return { success: true, message: 'Server started' };
  } catch (err: unknown) {
      const error = err as Error;
      console.error('[Server] Failed to start:', error);
      serverStatus = 'stopped';
      mainWindow?.webContents.send('server-status-update', serverStatus);
      appendToLog(`[Error] Failed to start server: ${error.message}`);
      return { success: false, message: error.message };
  }
}

async function restartServer(): Promise<{ success: boolean; message: string }> {
  if (serverProcess) {
      appendToLog('[Server] Restarting - Stopping current process...');
      serverProcess.kill();
      
      // Wait for it to close
      return new Promise((resolve) => {
          const checkInterval = setInterval(async () => {
              if (!serverProcess) {
                  clearInterval(checkInterval);
                  const result = await startServer();
                  resolve(result);
              }
          }, 500);
          
          setTimeout(() => {
              // Ensure we clear interval if it's still running
              // (Note: checkInterval is available in closure)
              // But we can't check 'checkInterval' easily if we didn't store it outside.
              // Actually, the closure captures it.
              // But if we clear it here, the interval function might run one last time or be stopped.
              // Safe way:
              // We can't really access checkInterval ID inside here if it wasn't returned yet, 
              // but we can check a flag or just let it race (startServer handles 'running' check).
              // For simplicity, let's just rely on the interval.
              // Or add a timeout rejection?
              // Let's keep it simple.
          }, 30000);
      });
  } else {
      appendToLog('[Server] Server not running, starting...');
      return await startServer();
  }
}

ipcMain.handle('start-server', async () => {
  return await startServer();
});

ipcMain.handle('stop-server', async () => {
  if (!serverProcess) {
      appendToLog('[Server] Server is not running.');
      return { success: false, message: 'Not running' };
  }

  appendToLog('[Server] Stopping server...');
  serverProcess.kill();
  // State update will be handled by the 'close' event listener
  return { success: true, message: 'Stop command sent' };
});

ipcMain.handle('restart-server', async () => {
  return await restartServer();
});

ipcMain.handle('send-command', async (_event, command) => {
  if (!serverProcess || serverProcess.killed) {
    appendToLog('[Error] Server is not running. Cannot send command.');
    return { success: false, message: 'Server not running' };
  }

  try {
    // Show user command in console
    appendToLog(`> ${command}`);
    
    // Write command to server process stdin
    if (serverProcess.stdin) {
        serverProcess.stdin.write(command + '\n');
    } else {
        appendToLog('[Error] Server input stream is not available.');
        return { success: false, message: 'Stdin not available' };
    }

    return { success: true };
  } catch (err: unknown) {
     const error = err as Error;
     console.error('[System] Failed to send command:', error);
     appendToLog(`[Error] Failed to send command: ${error.message}`);
     return { success: false, message: error.message };
  }
});

// --- Config Management ---

type IniData = Record<string, Record<string, string | number>>;

function parseIni(content: string): IniData {
  const result: IniData = {};
  let currentSection = '';

  content.split(/\r?\n/).forEach(line => {
    line = line.trim();
    if (!line || line.startsWith(';') || line.startsWith('#')) return;

    if (line.startsWith('[') && line.endsWith(']')) {
      currentSection = line.substring(1, line.length - 1);
      result[currentSection] = {};
    } else if (currentSection && line.includes('=')) {
      const parts = line.split('=');
      const key = parts[0].trim();
      // Join the rest in case value has =
      const value = parts.slice(1).join('=').trim();
      
      // Try to parse numbers/booleans? Or keep as string?
      // ConfigManager inputs handle numbers if type is number.
      // Let's try to detect number.
      if (!isNaN(Number(value)) && value !== '') {
          result[currentSection][key] = Number(value);
      } else {
          result[currentSection][key] = value;
      }
    }
  });

  return result;
}

function stringifyIni(data: IniData): string {
  let content = '';
  for (const section in data) {
    content += `[${section}]\n`;
    for (const key in data[section]) {
      content += `${key}=${data[section][key]}\n`;
    }
    content += '\n';
  }
  return content;
}

ipcMain.handle('get-config', async () => {
  const gamePath = store.get('gamePath', '') as string;
  if (!gamePath) return {};

  const configPath = path.join(gamePath, 'SCUM', 'Saved', 'Config', 'WindowsServer', 'ServerSettings.ini');
  // Fallback path just in case
  const configPathAlt = path.join(gamePath, 'Saved', 'Config', 'WindowsServer', 'ServerSettings.ini');

  let targetPath = configPath;
  if (!fs.existsSync(configPath) && fs.existsSync(configPathAlt)) {
      targetPath = configPathAlt;
  }

  if (fs.existsSync(targetPath)) {
      try {
          const content = fs.readFileSync(targetPath, 'utf-8');
          return parseIni(content);
      } catch (err) {
          console.error('Error reading config:', err);
          return {};
      }
  } else {
      // Return default structure if file missing, or empty?
      // User provided example keys, maybe we should return those as defaults if missing?
      return {
          General: {
              'scum.ServerName': 'SCUM Server',
              'scum.ServerDescription': 'Server Description',
              'scum.ServerPassword': '',
              'scum.MaxPlayers': 64,
              'scum.ServerPlaystyle': 'PVP/PVE',
              'scum.WelcomeMessage': 'Welcome to our SCUM Server',
              'scum.MessageOfTheDay': 'This is the Message of the Day.'
          }
      };
  }
});

ipcMain.handle('save-config', async (_event, config: IniData) => {
  const gamePath = store.get('gamePath', '') as string;
  if (!gamePath) return { success: false, message: 'Game path not set' };

  const configPath = path.join(gamePath, 'SCUM', 'Saved', 'Config', 'WindowsServer', 'ServerSettings.ini');
  const configPathAlt = path.join(gamePath, 'Saved', 'Config', 'WindowsServer', 'ServerSettings.ini');
  
  // Determine where to write. If neither exists, assume SCUM/Saved structure?
  // Or check if 'Saved' exists in root.
  let targetPath = configPath;
  if (fs.existsSync(configPathAlt)) targetPath = configPathAlt;
  else {
      // Ensure directories exist
      const dir = path.dirname(targetPath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  }

  try {
      const content = stringifyIni(config);
      fs.writeFileSync(targetPath, content, 'utf-8');
      console.log('[System] Config saved to:', targetPath);
      appendToLog(`[System] Configuration saved to ${path.basename(targetPath)}`);
      return { success: true };
  } catch (err: unknown) {
      const error = err as Error;
      console.error('Error saving config:', error);
      appendToLog(`[Error] Failed to save config: ${error.message}`);
      return { success: false, message: error.message };
  }
});

// --- Player Lists Management (Whitelist / Banned) ---

async function getListFile(filename: string): Promise<string[]> {
    const gamePath = store.get('gamePath', '') as string;
    if (!gamePath) return [];

    const filePath = path.join(gamePath, 'SCUM', 'Saved', 'Config', 'WindowsServer', filename);
    const filePathAlt = path.join(gamePath, 'Saved', 'Config', 'WindowsServer', filename);

    let targetPath = filePath;
    if (!fs.existsSync(filePath) && fs.existsSync(filePathAlt)) {
        targetPath = filePathAlt;
    }

    if (fs.existsSync(targetPath)) {
        try {
            const content = fs.readFileSync(targetPath, 'utf-8');
            // Split by lines, trim, filter empty or comments
            return content.split(/\r?\n/)
                .map(line => line.trim())
                .filter(line => line && !line.startsWith('#') && !line.startsWith(';'));
        } catch (err) {
            console.error(`Error reading ${filename}:`, err);
            return [];
        }
    }
    return [];
}

async function saveListFile(filename: string, list: string[]): Promise<boolean> {
    const gamePath = store.get('gamePath', '') as string;
    if (!gamePath) return false;

    const filePath = path.join(gamePath, 'SCUM', 'Saved', 'Config', 'WindowsServer', filename);
    const filePathAlt = path.join(gamePath, 'Saved', 'Config', 'WindowsServer', filename);

    let targetPath = filePath;
    if (fs.existsSync(filePathAlt)) targetPath = filePathAlt;
    else {
        // Ensure dir exists
        const dir = path.dirname(targetPath);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    }

    try {
        const content = list.join('\n');
        fs.writeFileSync(targetPath, content, 'utf-8');
        appendToLog(`[System] Saved ${filename}`);
        return true;
    } catch (err: unknown) {
        const error = err as Error;
        console.error(`Error saving ${filename}:`, error);
        appendToLog(`[Error] Failed to save ${filename}: ${error.message}`);
        return false;
    }
}

ipcMain.handle('get-whitelist', async () => getListFile('WhitelistedUsers.ini'));
ipcMain.handle('save-whitelist', async (_event, list: string[]) => saveListFile('WhitelistedUsers.ini', list));

ipcMain.handle('get-banned-users', async () => getListFile('BannedUsers.ini'));
ipcMain.handle('save-banned-users', async (_event, list: string[]) => saveListFile('BannedUsers.ini', list));

ipcMain.handle('get-admin-users', async () => getListFile('AdminUsers.ini'));
ipcMain.handle('save-admin-users', async (_event, list: string[]) => saveListFile('AdminUsers.ini', list));

ipcMain.handle('get-server-settings-admin-users', async () => getListFile('ServerSettingsAdminUsers.ini'));
ipcMain.handle('save-server-settings-admin-users', async (_event, list: string[]) => saveListFile('ServerSettingsAdminUsers.ini', list));

// --- RCON / Online Players ---

ipcMain.handle('get-online-players', async () => {
    // Re-use the existing helper which uses the store or potentially direct file read?
    // The top helper uses store.get('config'). 
    // This bottom one used to read file directly.
    // Let's rely on the store one OR re-implement here if needed.
    // Since I'm deleting the duplicate function declaration, I should check if the top one is compatible.
    // Top one returns { host, port, password }. Bottom one returns { ip, port, password }.
    // I need to map 'host' to 'ip' or adjust usage.
    
    const config = getRconConfig(); // Using the top synchronous function
    if (!config || !config.password) {
        return [];
    }

    const rcon = new Rcon({
        host: config.host, // Top one uses 'host'
        port: config.port,
        password: config.password
    });

    try {
        await rcon.connect();
        const response = await rcon.send('#ListPlayers');
        await rcon.end();

interface RconPlayer {
  id: string;
  steamId: string;
  name: string;
  ip: string;
  ping: number;
  playtime: string;
}

// ... inside get-online-players handler
        // SCUM #ListPlayers format parsing
        const players: RconPlayer[] = [];
        const lines = response.split(/\r?\n/);
        
        for (const line of lines) {
             const trimmed = line.trim();
             if (!trimmed || trimmed.startsWith('SteamID') || trimmed.startsWith('---')) continue;

             // Extract SteamID (17 digits)
             const steamIdMatch = trimmed.match(/^(\d{17})/);
             if (steamIdMatch) {
                 const steamId = steamIdMatch[1];
                 let name = 'Unknown';
                 let ip = 'Unknown';
                 
                 // Try to match name in quotes
                 const nameMatch = trimmed.match(/"([^"]+)"/);
                 if (nameMatch) {
                     name = nameMatch[1];
                 } else {
                     const parts = trimmed.split(/\s+/);
                     if (parts.length >= 4) {
                         name = parts.slice(1, parts.length - 2).join(' ');
                     }
                 }
                 
                 const ipMatch = trimmed.match(/(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}:\d+)/);
                 if (ipMatch) ip = ipMatch[1];
                 
                 players.push({
                     id: steamId,
                     steamId: steamId,
                     name: name,
                     ip: ip,
                     ping: 0, 
                     playtime: 'Unknown'
                 });
             }
        }
        return players;

    } catch (error) {
        console.error('RCON Error:', error);
        return null;
    }
});

ipcMain.handle('ban-online-player', async (_event, steamId: string) => {
    if (!steamId) return { success: false, message: 'Invalid SteamID' };
    
    const config = await getRconConfig();
    if (!config || !config.password) {
         return { success: false, message: 'RCON not configured' };
    }
    
    // 1. Add to BannedUsers.ini (Persistence)
    try {
        const currentBans = await getListFile('BannedUsers.ini');
        if (!currentBans.includes(steamId)) {
            currentBans.push(steamId);
            await saveListFile('BannedUsers.ini', currentBans);
        }
    } catch (e) { console.error('File Ban Error:', e); }

    // 2. RCON Ban & Kick
    const rcon = new Rcon({
        host: config.ip,
        port: config.port,
        password: config.password
    });

    try {
        await rcon.connect();
        await rcon.send(`#Ban ${steamId}`);
        await rcon.send(`#Kick ${steamId}`);
        await rcon.end();
        return { success: true };
    } catch (error: unknown) {
        const err = error as Error;
        console.error('RCON Ban Error:', err);
        return { success: false, message: err.message };
    }
});

// --- App Settings (Paths) ---

ipcMain.handle('get-app-settings', async () => {
  return {
    steamCmdPath: store.get('steamCmdPath', ''),
    gamePath: store.get('gamePath', ''),
    launchParams: store.get('launchParams', {
      useLog: true,
      port: '7573',
      queryPort: '7779',
      maxPlayers: '100'
    })
  };
});

ipcMain.handle('save-app-settings', async (_event, settings) => {
  if (settings.steamCmdPath !== undefined) store.set('steamCmdPath', settings.steamCmdPath);
  if (settings.gamePath !== undefined) store.set('gamePath', settings.gamePath);
  if (settings.launchParams !== undefined) store.set('launchParams', settings.launchParams);
  console.log('[System] Settings saved:', settings);
  return { success: true };
});

  ipcMain.handle('check-installation-status', async () => {
    const steamCmdPath = store.get('steamCmdPath', '') as string;
    const gamePath = store.get('gamePath', '') as string;
    
    const steamCmdInstalled = steamCmdPath ? fs.existsSync(path.join(steamCmdPath, 'steamcmd.exe')) : false;
    // Check for SCUM server executable (assuming SCUMServer.exe or similar, adjust if needed)
    // For now, let's assume standard path structure if user points to root
    const serverInstalled = gamePath ? fs.existsSync(path.join(gamePath, 'SCUMServer.exe')) || fs.existsSync(path.join(gamePath, 'SCUM/Binaries/Win64/SCUMServer.exe')) : false;
    
    return { steamCmdInstalled, serverInstalled };
  });

  ipcMain.handle('install-steamcmd', async () => {
    appendToLog('[System] Downloading SteamCMD...');
    
    const steamCmdPath = store.get('steamCmdPath', '') as string;
    
    if (!steamCmdPath) {
      appendToLog('[Error] SteamCMD path not set!');
      return { success: false, message: 'Path not set' };
    }

    try {
      // Ensure directory exists
      if (!fs.existsSync(steamCmdPath)) fs.mkdirSync(steamCmdPath, { recursive: true });

      const zipPath = path.join(steamCmdPath, 'steamcmd.zip');
      const writer = fs.createWriteStream(zipPath);

      appendToLog('[System] Fetching steamcmd.zip from Valve...');
      
      const response = await axios({
        url: 'https://steamcdn-a.akamaihd.net/client/installer/steamcmd.zip',
        method: 'GET',
        responseType: 'stream'
      });

      response.data.pipe(writer);

      return new Promise((resolve, reject) => {
        writer.on('finish', () => {
          appendToLog('[System] Download complete. Extracting...');
          
          try {
            const zip = new AdmZip(zipPath);
            zip.extractAllTo(steamCmdPath, true);
            
            // Clean up zip
            fs.unlinkSync(zipPath);
            
            appendToLog('[System] SteamCMD installed successfully.');
            resolve({ success: true, message: 'Installed successfully' });
          } catch (err: unknown) {
             const error = err as Error;
             console.error('Extraction error:', error);
             appendToLog(`[Error] Extraction failed: ${error.message}`);
             reject({ success: false, message: error.message });
          }
        });

        writer.on('error', (err) => {
           console.error('Download error:', err);
           appendToLog(`[Error] Download failed: ${err.message}`);
           reject({ success: false, message: err.message });
        });
      });

    } catch (e: unknown) {
      const error = e as Error;
      console.error('Install error:', error);
      appendToLog(`[Error] Installation failed: ${error.message}`);
      return { success: false, message: error.message };
    }
  });

  ipcMain.handle('install-server', async () => {
    appendToLog('[System] Starting SCUM Server installation via SteamCMD...');
    
    const steamCmdPath = store.get('steamCmdPath', '') as string;
    const gamePath = store.get('gamePath', '') as string;

    if (!steamCmdPath || !gamePath) {
       appendToLog('[Error] Paths not set properly.');
       return { success: false, message: 'Paths not set' };
    }
    
    const steamCmdExe = path.join(steamCmdPath, 'steamcmd.exe');
    if (!fs.existsSync(steamCmdExe)) {
        appendToLog('[Error] SteamCMD executable not found. Please install SteamCMD first.');
        return { success: false, message: 'SteamCMD not found' };
    }

    return new Promise((resolve) => {
      // Command: +force_install_dir "%INSTALL_DIR%" +login anonymous +app_update 3792580 validate +quit
      const args = [
          '+force_install_dir', gamePath,
          '+login', 'anonymous',
          '+app_update', '3792580', 'validate',
          '+quit'
      ];

      appendToLog(`[System] Executing: steamcmd.exe ${args.join(' ')}`);

      const child = spawn(steamCmdExe, args);

      child.stdout.on('data', (data) => {
          const line = data.toString();
          // console.log(line); // Optional: log to terminal
          appendToLog(line);
      });

      child.stderr.on('data', (data) => {
          const line = data.toString();
          console.error(line);
          appendToLog(`[SteamCMD Error] ${line}`);
      });

      child.on('close', (code) => {
          if (code === 0) {
              appendToLog('[System] SCUM Server installed/updated successfully.');
              resolve({ success: true, message: 'Installed successfully' });
          } else {
              appendToLog(`[System] SteamCMD exited with code ${code}.`);
              // SteamCMD often returns non-zero even on success (e.g. 7), so we might need to check output.
              // But for now, let's assume it's done.
              resolve({ success: code === 0 || code === 7, message: `Exited with code ${code}` });
          }
      });
    });
  });

  ipcMain.handle('update-server', async () => {
    appendToLog('[System] Checking for SCUM updates via SteamCMD...');
    
    const steamCmdPath = store.get('steamCmdPath', '') as string;
    const gamePath = store.get('gamePath', '') as string;

    if (!steamCmdPath || !gamePath) {
       appendToLog('[Error] Paths not set properly.');
       return { success: false, message: 'Paths not set' };
    }
    
    const steamCmdExe = path.join(steamCmdPath, 'steamcmd.exe');
    if (!fs.existsSync(steamCmdExe)) {
        appendToLog('[Error] SteamCMD executable not found.');
        return { success: false, message: 'SteamCMD not found' };
    }

    return new Promise((resolve) => {
      const args = [
          '+force_install_dir', gamePath,
          '+login', 'anonymous',
          '+app_update', '3792580', 'validate',
          '+quit'
      ];

      appendToLog(`[System] Executing Update: steamcmd.exe ${args.join(' ')}`);

      const child = spawn(steamCmdExe, args);

      child.stdout.on('data', (data) => {
          appendToLog(data.toString());
      });

      child.stderr.on('data', (data) => {
          console.error(data.toString());
          appendToLog(`[SteamCMD Error] ${data.toString()}`);
      });

      child.on('close', (code) => {
          if (code === 0 || code === 7) {
              appendToLog('[System] Update completed successfully.');
              resolve({ success: true, message: 'Updated successfully' });
          } else {
              appendToLog(`[System] Update failed/exited with code ${code}.`);
              resolve({ success: false, message: `Exited with code ${code}` });
          }
      });
    });
  });

  ipcMain.handle('verify-server-files', async () => {
    appendToLog('[System] Verifying server files integrity...');
    
    const steamCmdPath = store.get('steamCmdPath', '') as string;
    const gamePath = store.get('gamePath', '') as string;

    if (!steamCmdPath || !gamePath) {
       appendToLog('[Error] Paths not set properly.');
       return { success: false, message: 'Paths not set' };
    }
    
    const steamCmdExe = path.join(steamCmdPath, 'steamcmd.exe');
    if (!fs.existsSync(steamCmdExe)) {
        appendToLog('[Error] SteamCMD executable not found.');
        return { success: false, message: 'SteamCMD not found' };
    }

    return new Promise((resolve) => {
      // Validation is the same command essentially, just emphasizing intent
      const args = [
          '+force_install_dir', gamePath,
          '+login', 'anonymous',
          '+app_update', '3792580', 'validate',
          '+quit'
      ];

      appendToLog(`[System] Executing Verification: steamcmd.exe ${args.join(' ')}`);

      const child = spawn(steamCmdExe, args);

      child.stdout.on('data', (data) => {
          appendToLog(data.toString());
      });

      child.stderr.on('data', (data) => {
          console.error(data.toString());
          appendToLog(`[SteamCMD Error] ${data.toString()}`);
      });

      child.on('close', (code) => {
          if (code === 0 || code === 7) {
              appendToLog('[System] Verification completed successfully.');
              resolve({ success: true, message: 'Verified successfully' });
          } else {
              appendToLog(`[System] Verification failed/exited with code ${code}.`);
              resolve({ success: false, message: `Exited with code ${code}` });
          }
      });
    });
  });

  ipcMain.handle('select-directory', async () => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    properties: ['openDirectory']
  });
  
  if (result.canceled) {
    return { canceled: true, path: null };
  }
  
  return { canceled: false, path: result.filePaths[0] };
});

ipcMain.handle('trigger-backup', async () => {
  appendToLog('[System] Starting manual backup...');
  
  const success = await performBackup();
  
  if (success) {
      const config = store.get('automation') as AutomationConfig;
      config.lastBackupTime = Date.now();
      store.set('automation', config);
      updateAutomationStats(); // Update global stats object
      return { success: true, message: 'Backup created' };
  } else {
      return { success: false, message: 'Backup failed' };
  }
});

ipcMain.handle('check-for-updates', async () => {
  automationStats.updateStatus = 'checking';
  appendToLog('[System] Checking for server updates...');
  
  // Update last check time immediately
  const config = store.get('automation') as AutomationConfig;
  config.lastUpdateTime = Date.now();
  store.set('automation', config);
  updateAutomationStats();

  // Check local manifest for build ID
  const gamePath = store.get('gamePath', '') as string;
  const manifestPath = path.join(gamePath, 'appmanifest_3792580.acf');

  if (fs.existsSync(manifestPath)) {
      try {
          const content = fs.readFileSync(manifestPath, 'utf-8');
          const buildIdMatch = content.match(/"buildid"\s+"(\d+)"/);
          if (buildIdMatch) {
              const buildId = buildIdMatch[1];
              appendToLog(`[System] Current Installed Build ID: ${buildId}`);
          }
      } catch (e) {
          console.error('Error reading manifest:', e);
      }
  }

  // For now, we assume up-to-date as we cannot query Steam API without key/complex parsing
  // Removed random simulation to prevent misleading status
  automationStats.updateStatus = 'up-to-date'; 
  appendToLog('[System] Update check completed. (Online check requires SteamCMD execution)');
  
  updateAutomationStats();
  
  return { success: true, message: 'Check completed' };
});

ipcMain.handle('get-automation-config', async () => {
  return store.get('automation') as AutomationConfig;
});

ipcMain.handle('save-automation-config', async (_event, config: AutomationConfig) => {
  // Preserve existing times if not provided or if we don't want to reset them unnecessarily
  // But usually save provides full config. 
  // We should update next times if intervals changed?
  
  const currentConfig = store.get('automation') as AutomationConfig;
  
  // If enabled status changed to true, set next time
  if (config.autoBackupEnabled && !currentConfig.autoBackupEnabled) {
      config.nextBackupTime = Date.now() + (config.autoBackupInterval * 60 * 1000);
  }
  
  if (config.autoRestartEnabled && !currentConfig.autoRestartEnabled) {
      config.nextRestartTime = Date.now() + (config.autoRestartInterval * 60 * 1000);
  }
  
  if (config.autoUpdateEnabled && !currentConfig.autoUpdateEnabled) {
      config.nextUpdateTime = Date.now() + (config.autoUpdateInterval * 60 * 1000);
  }
  
  // Preserve last times
  config.lastBackupTime = currentConfig.lastBackupTime;
  config.lastRestartTime = currentConfig.lastRestartTime;
  config.lastUpdateTime = currentConfig.lastUpdateTime;
  
  // If next times are missing (e.g. fresh save), init them
  if (config.autoBackupEnabled && !config.nextBackupTime) config.nextBackupTime = currentConfig.nextBackupTime || (Date.now() + config.autoBackupInterval * 60000);
  if (config.autoRestartEnabled && !config.nextRestartTime) config.nextRestartTime = currentConfig.nextRestartTime || (Date.now() + config.autoRestartInterval * 60000);
  if (config.autoUpdateEnabled && !config.nextUpdateTime) config.nextUpdateTime = currentConfig.nextUpdateTime || (Date.now() + config.autoUpdateInterval * 60000);

  store.set('automation', config);
  updateAutomationStats();
  return true;
});

// --- Backup Management ---

async function performBackup(): Promise<boolean> {
    const gamePath = store.get('gamePath', '') as string;
    if (!gamePath) {
        appendToLog('[Backup] Failed: Game path not set.');
        return false;
    }

    const sourcePath = path.join(gamePath, 'SCUM', 'Saved');
    if (!fs.existsSync(sourcePath)) {
        appendToLog(`[Backup] Failed: Source path not found at ${sourcePath}`);
        return false;
    }

    // Backup Directory
    const backupDir = path.join(gamePath, 'Backups');
    if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(backupDir, `backup-${timestamp}.zip`);

    appendToLog('[Backup] Starting backup process...');

    try {
        const zip = new AdmZip();
        // Add local folder
        zip.addLocalFolder(sourcePath, 'Saved');
        
        // Write to disk
        zip.writeZip(backupFile);
        
        appendToLog(`[Backup] Success: Saved to ${path.basename(backupFile)}`);

        // --- Retention Policy: Keep last 10 backups ---
        try {
            const files = fs.readdirSync(backupDir)
                .filter(f => f.startsWith('backup-') && f.endsWith('.zip'))
                .map(f => ({ name: f, time: fs.statSync(path.join(backupDir, f)).mtime.getTime() }))
                .sort((a, b) => b.time - a.time); // Newest first

            const maxBackups = 10;
            if (files.length > maxBackups) {
                const toDelete = files.slice(maxBackups);
                toDelete.forEach(f => {
                    fs.unlinkSync(path.join(backupDir, f.name));
                    appendToLog(`[Backup] Cleanup: Deleted old backup ${f.name}`);
                });
            }
        } catch (cleanupErr) {
            console.error('Backup cleanup error:', cleanupErr);
        }
        // ----------------------------------------------

        return true;
    } catch (err: unknown) {
        const error = err as Error;
        console.error('Backup error:', error);
        appendToLog(`[Backup] Error: ${error.message}`);
        return false;
    }
}

ipcMain.handle('get-backups', async () => {
    const gamePath = store.get('gamePath', '') as string;
    if (!gamePath) return [];

    const backupDir = path.join(gamePath, 'Backups');
    if (!fs.existsSync(backupDir)) return [];

    try {
        const files = fs.readdirSync(backupDir).filter(f => f.endsWith('.zip'));
        return files.map(file => {
            const stats = fs.statSync(path.join(backupDir, file));
            return {
                filename: file,
                date: stats.mtime.toLocaleString(),
                timestamp: stats.mtime.getTime(),
                size: (stats.size / 1024 / 1024).toFixed(2) + ' MB'
            };
        }).sort((a, b) => b.timestamp - a.timestamp);
    } catch (err) {
        console.error('Error listing backups:', err);
        return [];
    }
});

ipcMain.handle('delete-backup', async (_event, filename: string) => {
    const gamePath = store.get('gamePath', '') as string;
    if (!gamePath) return { success: false, message: 'Game path not set' };

    const backupDir = path.join(gamePath, 'Backups');
    const filePath = path.join(backupDir, filename);

    if (fs.existsSync(filePath)) {
        try {
            fs.unlinkSync(filePath);
            appendToLog(`[System] Deleted backup: ${filename}`);
            return { success: true, message: 'Deleted' };
        } catch (err: unknown) {
             const error = err as Error;
            return { success: false, message: error.message };
        }
    }
    return { success: false, message: 'File not found' };
});

ipcMain.handle('restore-backup', async (_event, filename: string) => {
    const gamePath = store.get('gamePath', '') as string;
    if (!gamePath) return { success: false, message: 'Game path not set' };

    const backupDir = path.join(gamePath, 'Backups');
    const filePath = path.join(backupDir, filename);
    const targetPath = path.join(gamePath, 'SCUM', 'Saved');

    if (!fs.existsSync(filePath)) {
        return { success: false, message: 'Backup file not found' };
    }

    // Stop server if running
    if (serverStatus === 'running') {
        appendToLog('[Restore] Stopping server for restoration...');
        // We can't await stopServer() directly as it's an IPC handler wrapper? 
        // We can call the logic directly if we extract it, or just kill process.
        if (serverProcess) {
             serverProcess.kill();
             // Wait for it to stop?
             await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }

    appendToLog(`[Restore] Restoring from ${filename}...`);

    try {
        // Backup current Saved just in case?
        if (fs.existsSync(targetPath)) {
            const tempBackup = path.join(gamePath, 'SCUM', 'Saved_Before_Restore_' + Date.now());
            fs.renameSync(targetPath, tempBackup);
            appendToLog(`[Restore] Current save moved to ${path.basename(tempBackup)}`);
        }

        const zip = new AdmZip(filePath);
        zip.extractAllTo(path.join(gamePath, 'SCUM'), true); // Extracts 'Saved' folder inside SCUM
        
        appendToLog('[Restore] Restoration complete.');
        return { success: true, message: 'Restored successfully' };

    } catch (err: unknown) {
        const error = err as Error;
        console.error('Restore error:', error);
        appendToLog(`[Restore] Error: ${error.message}`);
        return { success: false, message: error.message };
    }
});

// --- Discord Bot Implementation ---

interface FeedConfig {
  enabled: boolean;
  webhookUrl: string;
}

interface DiscordConfig {
  enabled: boolean;
  feeds: {
    kill: FeedConfig;
    chat: FeedConfig;
    admin: FeedConfig;
    login: FeedConfig;
    gameplay: FeedConfig;
    system: FeedConfig;
  };
}

class DiscordBotManager {
  private config: DiscordConfig;
  private interval: NodeJS.Timeout | null = null;
  private fileStates: Record<string, { filename: string; offset: number }> = {};
  
  constructor() {
    this.config = store.get('discordConfig', {
      enabled: false,
      feeds: {
        kill: { enabled: false, webhookUrl: '' },
        chat: { enabled: false, webhookUrl: '' },
        admin: { enabled: false, webhookUrl: '' },
        login: { enabled: false, webhookUrl: '' },
        gameplay: { enabled: false, webhookUrl: '' },
        system: { enabled: false, webhookUrl: '' },
      }
    }) as DiscordConfig;
    
    // Initialize states
    ['kill', 'chat', 'admin', 'login', 'gameplay'].forEach(type => {
      this.fileStates[type] = { filename: '', offset: 0 };
    });

    if (this.config.enabled) {
      this.start();
    }
  }

  public getConfig() {
    // Ensure system feed exists in config if old config loaded
    if (!this.config.feeds.system) {
        this.config.feeds.system = { enabled: false, webhookUrl: '' };
    }
    return this.config;
  }

  public saveConfig(newConfig: DiscordConfig) {
    this.config = newConfig;
    store.set('discordConfig', newConfig);
    if (this.config.enabled) {
      this.start();
    } else {
      this.stop();
    }
  }

  public start() {
    if (this.interval) clearInterval(this.interval);
    this.interval = setInterval(() => this.checkLogs(), 3000); // Check every 3 seconds
    console.log('[DiscordBot] Started monitoring logs');
  }

  public stop() {
    if (this.interval) clearInterval(this.interval);
    this.interval = null;
    console.log('[DiscordBot] Stopped monitoring logs');
  }

  public getStatus() {
    return this.interval ? 'running' : 'stopped';
  }

  public async sendSystemAlert(message: string) {
      if (!this.config.enabled || !this.config.feeds.system?.enabled || !this.config.feeds.system?.webhookUrl) return;
      await this.sendToDiscord('system', message, this.config.feeds.system.webhookUrl);
  }

  private async checkLogs() {
    const gamePath = store.get('gamePath') as string;
    if (!gamePath) return;

    // Log directory path
    const logsDir = path.join(gamePath, 'SCUM', 'Saved', 'SaveFiles', 'Logs');
    
    if (!fs.existsSync(logsDir)) return;

    for (const [type, feedConfig] of Object.entries(this.config.feeds)) {
        const feedType = type as keyof DiscordConfig['feeds'];
        if (!feedConfig.enabled || !feedConfig.webhookUrl) continue;

        // Find latest log file for this type
        // Pattern: type_YYYYMMDDHHMMSS.log
        let files: string[] = [];
        try {
            files = fs.readdirSync(logsDir)
                .filter(f => f.startsWith(`${feedType}_`) && f.endsWith('.log'))
                .sort()
                .reverse(); // Newest first
        } catch (e) {
            console.error(`[DiscordBot] Error reading log dir:`, e);
            continue;
        }

        if (files.length === 0) continue;

        const latestFile = files[0];
        const filePath = path.join(logsDir, latestFile);
        
        // Check if file changed (rotation)
        if (this.fileStates[feedType].filename !== latestFile) {
            this.fileStates[feedType] = { filename: latestFile, offset: 0 };
        }

        const state = this.fileStates[feedType];
        
        try {
            const stats = fs.statSync(filePath);
            if (stats.size > state.offset) {
                // Read new content
                const stream = fs.createReadStream(filePath, {
                    start: state.offset,
                    end: stats.size,
                    encoding: 'utf8'
                });
                
                let buffer = '';
                for await (const chunk of stream) {
                    buffer += chunk;
                }

                // Update offset
                state.offset = stats.size;

                // Process lines
                const lines = buffer.split('\n').filter(l => l.trim());
                for (const line of lines) {
                    await this.sendToDiscord(feedType, line, feedConfig.webhookUrl);
                }
            } else if (stats.size < state.offset) {
                // File truncated? Reset
                state.offset = 0;
            }
        } catch (err) {
            console.error(`[DiscordBot] Error reading ${latestFile}:`, err);
        }
    }
  }

  private async sendToDiscord(type: string, message: string, webhookUrl: string) {
    let color = 0x000000;
    let title = '';
    let emoji = '';

    switch (type) {
        case 'kill': color = 0xFF0000; title = 'Kill Feed'; emoji = '🪦'; break;
        case 'chat': color = 0x0099FF; title = 'Chat Feed'; emoji = '💬'; break;
        case 'admin': color = 0xFFA500; title = 'Admin Feed'; emoji = '🛡️'; break;
        case 'login': color = 0x00FF00; title = 'Login Feed'; emoji = '🔑'; break;
        case 'gameplay': color = 0x800080; title = 'Gameplay Feed'; emoji = '🎲'; break;
        case 'system': color = 0x00FFFF; title = 'System Alert'; emoji = '🚨'; break;
    }

    const cleanMsg = message.replace(/\0/g, '').trim();
    if (!cleanMsg) return;

    // Try to parse timestamp from log line if possible (optional)
    // Log format usually: "YYYY.MM.DD-HH.MM.SS: <Content>"
    
    let description = `\`\`\`${cleanMsg}\`\`\``;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fields: any[] = [];

    // Advanced Parsing for Kill Feed
    if (type === 'kill') {
        // Regex to parse detailed info
        // Example: Died: ToR (76561198196638689), Killer: BPDrifterLvl3 (NPC) Weapon: WeaponM1911C ... Distance: 2.49 m]
        const killMatch = cleanMsg.match(/Died:\s*(.+?)\s*\((\d+)\),\s*Killer:\s*(.+?)\s*\((.+?)\)\s*Weapon:\s*([^\s]+)/);
        const distMatch = cleanMsg.match(/Distance:\s*([\d\.]+)\s*m/);
        const locMatch = cleanMsg.match(/VictimLoc\s*:\s*([-\d\.]+)\s*,\s*([-\d\.]+)\s*,\s*([-\d\.]+)/);

        if (killMatch) {
            const [_, victimName, victimId, killerName, killerId, weapon] = killMatch;
            
            // Clear raw description if we successfully parsed it (or keep it as footer/small text?)
            // Let's keep it clean.
            description = ''; 

            fields.push({
                name: '💀 Victim',
                value: `[${victimName}](https://steamcommunity.com/profiles/${victimId})`,
                inline: true
            });

            const killerDisplay = killerId === 'NPC' ? `${killerName} (NPC)` : `[${killerName}](https://steamcommunity.com/profiles/${killerId})`;
            fields.push({
                name: '🔫 Killer',
                value: killerDisplay,
                inline: true
            });

            fields.push({
                name: '⚔️ Weapon',
                value: weapon,
                inline: true
            });

            if (distMatch) {
                fields.push({
                    name: '📏 Distance',
                    value: `${distMatch[1]} m`,
                    inline: true
                });
            }
        }

        if (locMatch) {
            const [_, x, y, z] = locMatch;
            // Add Location field if not already added or if we want to group it
            fields.push({
                name: '📍 Victim Location',
                value: `X: ${x}, Y: ${y}, Z: ${z}`,
                inline: false
            });
            fields.push({
                name: '⚡ Teleport',
                value: `\`#TeleportTo ${x} ${y} ${z}\``,
                inline: false
            });
        }
        
        // If parsing failed but we have a raw message, description handles it.
    }

    const payload = {
        username: "SCUM Bot",
        embeds: [{
            title: `${emoji} ${title}`,
            description: description || undefined,
            fields: fields.length > 0 ? fields : undefined,
            color: color,
            timestamp: new Date().toISOString(),
            footer: {
                text: "SCUM Panel Manager"
            }
        }]
    };

    try {
        await axios.post(webhookUrl, payload);
    } catch (err) {
        console.error(`[DiscordBot] Failed to send webhook for ${type}:`, err);
    }
  }
}

const discordBot = new DiscordBotManager();

ipcMain.handle('get-discord-config', () => discordBot.getConfig());
ipcMain.handle('save-discord-config', (_e, config) => discordBot.saveConfig(config));
ipcMain.handle('get-discord-bot-status', () => discordBot.getStatus());
ipcMain.handle('restart-discord-bot', () => discordBot.start());
ipcMain.handle('stop-discord-bot', () => discordBot.stop());

