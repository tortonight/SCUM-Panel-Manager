import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electron', {
  minimize: () => ipcRenderer.send('minimize-window'),
  maximize: () => ipcRenderer.send('maximize-window'),
  close: () => ipcRenderer.send('close-window'),
  
  startServer: () => ipcRenderer.invoke('start-server'),
  stopServer: () => ipcRenderer.invoke('stop-server'),
  restartServer: () => ipcRenderer.invoke('restart-server'),
  sendCommand: (command: string) => ipcRenderer.invoke('send-command', command),
  
  getConfig: () => ipcRenderer.invoke('get-config'),
  saveConfig: (config: Record<string, unknown>) => ipcRenderer.invoke('save-config', config),
  getWhitelist: () => ipcRenderer.invoke('get-whitelist'),
  saveWhitelist: (list: string[]) => ipcRenderer.invoke('save-whitelist', list),
  getBannedUsers: () => ipcRenderer.invoke('get-banned-users'),
  saveBannedUsers: (list: string[]) => ipcRenderer.invoke('save-banned-users', list),
  getAdminUsers: () => ipcRenderer.invoke('get-admin-users'),
  saveAdminUsers: (list: string[]) => ipcRenderer.invoke('save-admin-users', list),
  getServerSettingsAdminUsers: () => ipcRenderer.invoke('get-server-settings-admin-users'),
  saveServerSettingsAdminUsers: (list: string[]) => ipcRenderer.invoke('save-server-settings-admin-users', list),
  getOnlinePlayers: () => ipcRenderer.invoke('get-online-players'),
  banOnlinePlayer: (steamId: string) => ipcRenderer.invoke('ban-online-player', steamId),

  getDiscordConfig: () => ipcRenderer.invoke('get-discord-config'),
  saveDiscordConfig: (config: Record<string, unknown>) => ipcRenderer.invoke('save-discord-config', config),
  getAutomationConfig: () => ipcRenderer.invoke('get-automation-config'),
  saveAutomationConfig: (config: Record<string, unknown>) => ipcRenderer.invoke('save-automation-config', config),
  
  getDiscordBotStatus: () => ipcRenderer.invoke('get-discord-bot-status'),
  restartDiscordBot: () => ipcRenderer.invoke('restart-discord-bot'),
  stopDiscordBot: () => ipcRenderer.invoke('stop-discord-bot'),

  getAppSettings: () => ipcRenderer.invoke('get-app-settings'),
  saveAppSettings: (settings: Record<string, unknown>) => ipcRenderer.invoke('save-app-settings', settings),
  detectServerPaths: () => ipcRenderer.invoke('detect-server-paths'),
  checkInstallationStatus: () => ipcRenderer.invoke('check-installation-status'),
  installSteamCmd: () => ipcRenderer.invoke('install-steamcmd'),
  installServer: () => ipcRenderer.invoke('install-server'),
  updateServer: () => ipcRenderer.invoke('update-server'),
  verifyServerFiles: () => ipcRenderer.invoke('verify-server-files'),
  selectDirectory: () => ipcRenderer.invoke('select-directory'),

  triggerBackup: () => ipcRenderer.invoke('trigger-backup'),
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),

  onStatsUpdate: (callback: (stats: Record<string, unknown>) => void) => {
    ipcRenderer.on('server-stats-update', (_event, stats) => callback(stats));
  },
  onStatusUpdate: (callback: (status: string) => void) => {
    ipcRenderer.on('server-status-update', (_event, status) => callback(status));
  },
  onAutomationUpdate: (callback: (automation: Record<string, unknown>) => void) => {
    ipcRenderer.on('automation-update', (_event, automation) => callback(automation));
  },
  onConsoleLog: (callback: (message: string) => void) => {
    ipcRenderer.on('console-log', (_event, message) => callback(message));
  },
  getConsoleLogs: () => ipcRenderer.invoke('get-console-logs'),
  
  removeAllListeners: (channel: string) => {
    ipcRenderer.removeAllListeners(channel);
  }
});
