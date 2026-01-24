export interface ElectronAPI {
  minimize: () => void;
  maximize: () => void;
  close: () => void;
  
  startServer: () => Promise<{ success: boolean; message: string }>;
  stopServer: () => Promise<{ success: boolean; message: string }>;
  restartServer: () => Promise<{ success: boolean; message: string }>;
  sendCommand: (command: string) => Promise<{ success: boolean }>;
  
  getConfig: () => Promise<Record<string, Record<string, string | number>>>;
  saveConfig: (config: Record<string, Record<string, string | number>>) => Promise<{ success: boolean }>;
  getWhitelist: () => Promise<string[]>;
  saveWhitelist: (list: string[]) => Promise<boolean>;
  getBannedUsers: () => Promise<string[]>;
  saveBannedUsers: (list: string[]) => Promise<boolean>;
  getAdminUsers: () => Promise<string[]>;
  saveAdminUsers: (list: string[]) => Promise<boolean>;
  getServerSettingsAdminUsers: () => Promise<string[]>;
  saveServerSettingsAdminUsers: (list: string[]) => Promise<boolean>;
  getOnlinePlayers: () => Promise<OnlinePlayer[] | null>;
  banOnlinePlayer: (steamId: string) => Promise<{ success: boolean; message?: string }>;

  getDiscordConfig: () => Promise<DiscordConfig>;
  saveDiscordConfig: (config: DiscordConfig) => Promise<{ success: boolean }>;
  getDiscordBotStatus: () => Promise<'running' | 'stopped'>;
  restartDiscordBot: () => Promise<void>;
  stopDiscordBot: () => Promise<void>;

  getAppSettings: () => Promise<AppSettings>;
  saveAppSettings: (settings: Partial<AppSettings>) => Promise<{ success: boolean }>;
  detectServerPaths: () => Promise<{ success: boolean; paths?: Partial<AppSettings>; message?: string }>;
  selectDirectory: () => Promise<{ canceled: boolean; path: string | null }>;
  checkInstallationStatus: () => Promise<{ steamCmdInstalled: boolean; serverInstalled: boolean }>;
  installSteamCmd: () => Promise<{ success: boolean; message: string }>;
  installServer: () => Promise<{ success: boolean; message: string }>;
  updateServer: () => Promise<{ success: boolean; message: string }>;
  verifyServerFiles: () => Promise<{ success: boolean; message: string }>;

  onStatsUpdate: (callback: (stats: ServerStats) => void) => void;
  onStatusUpdate: (callback: (status: string) => void) => void;
  onAutomationUpdate: (callback: (automation: AutomationStats) => void) => void;
  onConsoleLog: (callback: (message: string) => void) => void;
  getConsoleLogs: () => Promise<string[]>;
  
  triggerBackup: () => Promise<{ success: boolean; message: string }>;
  checkForUpdates: () => Promise<{ success: boolean; message: string }>;

  removeAllListeners: (channel: string) => void;

  getAutomationConfig: () => Promise<AutomationConfig | null>;
  saveAutomationConfig: (config: AutomationConfig) => Promise<boolean>;

  getBackups: () => Promise<BackupItem[]>;
  restoreBackup: (filename: string) => Promise<{ success: boolean; message: string }>;
  deleteBackup: (filename: string) => Promise<{ success: boolean; message: string }>;
}

export interface BackupItem {
  filename: string;
  date: string;
  size: string;
  timestamp: number;
}

export interface AutomationConfig {
  autoBackupEnabled: boolean;
  autoBackupInterval: number;
  autoUpdateEnabled: boolean;
  autoUpdateInterval: number;
  autoRestartEnabled: boolean;
  autoRestartInterval: number;
  restartWarningMinutes: number;
}

export interface ServerStats {
  cpu: number;
  ram: number; // Keeping for backward compatibility (Server RAM)
  serverRam: number;
  systemRamUsed: number;
  systemRamTotal: number;
  players: number;
  maxPlayers: number;
}

export interface AutomationStats {
  lastBackup: string | null;
  nextBackup: string;
  updateStatus: 'up-to-date' | 'update-available' | 'checking' | 'updating';
  lastUpdateCheck: string;
}

export interface AppSettings {
  steamCmdPath: string;
  gamePath: string;
  serverFolder?: string;
  configFolder?: string;
  logFolder?: string;
  backupFolder?: string;
  launchParams?: {
    useLog: boolean;
    useBattlEye?: boolean;
    port: string;
    queryPort: string;
    maxPlayers: string;
  };
}

export interface OnlinePlayer {
  id: string;
  name: string;
  ip: string;
  ping: number;
  playtime: string;
  steamId: string;
}

export interface FeedConfig {
  enabled: boolean;
  webhookUrl: string;
}

export interface DiscordConfig {
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

declare global {
  interface Window {
    electron: ElectronAPI;
  }
}
