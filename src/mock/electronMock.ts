import type { ElectronAPI } from '../types/electron';

export const setupMockElectron = () => {
  if (window.electron) return;

  console.warn('Electron API not found. Using Mock API for browser development.');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mockStorage: any = {
    config: {
      General: {
        'scum.ServerName': 'Mock Server',
        'scum.MaxPlayers': 64,
      }
    },
    whitelist: ['76561198000000001', '76561198000000002'],
    banned: [],
    admin: [],
    serverSettingsAdmin: [],
    automation: {
      autoRestartEnabled: false,
      autoRestartInterval: 240,
      restartWarningMinutes: 10,
      autoBackupEnabled: true,
      autoBackupInterval: 60,
      autoUpdateEnabled: false,
      autoUpdateInterval: 360
    },
    discord: {
      enabled: false,
      feeds: {
        kill: { enabled: false, webhookUrl: '' },
        chat: { enabled: false, webhookUrl: '' },
        admin: { enabled: false, webhookUrl: '' },
        login: { enabled: false, webhookUrl: '' },
        gameplay: { enabled: false, webhookUrl: '' },
        system: { enabled: false, webhookUrl: '' }
      }
    }
  };

  const mockAPI: ElectronAPI = {
    minimize: () => console.log('minimize'),
    maximize: () => console.log('maximize'),
    close: () => console.log('close'),

    startServer: async () => { console.log('startServer'); return { success: true, message: 'Started' }; },
    stopServer: async () => { console.log('stopServer'); return { success: true, message: 'Stopped' }; },
    restartServer: async () => { console.log('restartServer'); return { success: true, message: 'Restarted' }; },
    sendCommand: async (cmd) => { console.log('sendCommand', cmd); return { success: true }; },

    getConfig: async () => mockStorage.config,
    saveConfig: async (cfg) => { mockStorage.config = cfg; return { success: true }; },

    getWhitelist: async () => mockStorage.whitelist,
    saveWhitelist: async (list) => { mockStorage.whitelist = list; return true; },

    getBannedUsers: async () => mockStorage.banned,
    saveBannedUsers: async (list) => { mockStorage.banned = list; return true; },

    getAdminUsers: async () => mockStorage.admin,
    saveAdminUsers: async (list) => { mockStorage.admin = list; return true; },

    getServerSettingsAdminUsers: async () => mockStorage.serverSettingsAdmin,
    saveServerSettingsAdminUsers: async (list) => { mockStorage.serverSettingsAdmin = list; return true; },

    getOnlinePlayers: async () => [
      { id: '1', name: 'PlayerOne', ip: '127.0.0.1', ping: 50, playtime: '01:30:00', steamId: '76561198000000001' },
      { id: '2', name: 'PlayerTwo', ip: '127.0.0.2', ping: 120, playtime: '00:45:00', steamId: '76561198000000002' }
    ],
    banOnlinePlayer: async (steamId) => { console.log('banOnlinePlayer', steamId); return { success: true }; },

    getDiscordConfig: async () => mockStorage.discord,
    saveDiscordConfig: async (cfg) => { mockStorage.discord = cfg; return { success: true }; },
    getDiscordBotStatus: async () => 'stopped',
    restartDiscordBot: async () => {},
    stopDiscordBot: async () => {},

    getAppSettings: async () => ({ steamCmdPath: 'C:\\SteamCMD', gamePath: 'C:\\SCUM' }),
    saveAppSettings: async () => ({ success: true }),
    selectDirectory: async () => ({ canceled: false, path: 'C:\\Mock\\Path' }),
    checkInstallationStatus: async () => ({ steamCmdInstalled: true, serverInstalled: true }),
    installSteamCmd: async () => ({ success: true, message: 'Installed' }),
    installServer: async () => ({ success: true, message: 'Installed' }),
    updateServer: async () => ({ success: true, message: 'Updated' }),
    verifyServerFiles: async () => ({ success: true, message: 'Verified' }),

    onStatsUpdate: (cb) => {
      // Simulate stats update
      setInterval(() => {
        cb({ 
            cpu: Math.random() * 10, 
            ram: Math.random() * 4, 
            serverRam: Math.random() * 4,
            systemRamUsed: 8 + Math.random() * 4,
            systemRamTotal: 32,
            players: 2, 
            maxPlayers: 64 
        });
      }, 2000);
    },
    onStatusUpdate: (cb) => { setTimeout(() => cb('running'), 1000); },
    onAutomationUpdate: (cb) => { 
        cb({ lastBackup: 'Never', nextBackup: 'Tomorrow', updateStatus: 'up-to-date', lastUpdateCheck: 'Now' });
    },
    onConsoleLog: (cb) => {
        setTimeout(() => cb('[Mock] Server started...'), 1000);
        setTimeout(() => cb('[Mock] Player joined...'), 3000);
    },
    getConsoleLogs: async () => ['[Mock] Log 1', '[Mock] Log 2'],
    triggerBackup: async () => ({ success: true, message: 'Backup started' }),
    checkForUpdates: async () => ({ success: true, message: 'Checked' }),

    removeAllListeners: () => {},

    getAutomationConfig: async () => mockStorage.automation,
    saveAutomationConfig: async (cfg) => { mockStorage.automation = cfg; return true; },

    getBackups: async () => [
      { filename: 'backup-2023-01-01.zip', date: '1/1/2023, 12:00:00 PM', size: '150.00 MB', timestamp: 1672574400000 },
      { filename: 'backup-2023-01-02.zip', date: '1/2/2023, 12:00:00 PM', size: '152.50 MB', timestamp: 1672660800000 }
    ],
    restoreBackup: async (filename) => { console.log('restoreBackup', filename); return { success: true, message: 'Restored' }; },
    deleteBackup: async (filename) => { console.log('deleteBackup', filename); return { success: true, message: 'Deleted' }; }
  };

  // Assigning to readonly property for mock
  window.electron = mockAPI;
};
