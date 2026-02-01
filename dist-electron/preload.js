"use strict";
const electron = require("electron");
electron.contextBridge.exposeInMainWorld("electron", {
  minimize: () => electron.ipcRenderer.send("minimize-window"),
  maximize: () => electron.ipcRenderer.send("maximize-window"),
  close: () => electron.ipcRenderer.send("close-window"),
  startServer: () => electron.ipcRenderer.invoke("start-server"),
  stopServer: () => electron.ipcRenderer.invoke("stop-server"),
  restartServer: () => electron.ipcRenderer.invoke("restart-server"),
  sendCommand: (command) => electron.ipcRenderer.invoke("send-command", command),
  getConfig: () => electron.ipcRenderer.invoke("get-config"),
  saveConfig: (config) => electron.ipcRenderer.invoke("save-config", config),
  getWhitelist: () => electron.ipcRenderer.invoke("get-whitelist"),
  saveWhitelist: (list) => electron.ipcRenderer.invoke("save-whitelist", list),
  getBannedUsers: () => electron.ipcRenderer.invoke("get-banned-users"),
  saveBannedUsers: (list) => electron.ipcRenderer.invoke("save-banned-users", list),
  getAdminUsers: () => electron.ipcRenderer.invoke("get-admin-users"),
  saveAdminUsers: (list) => electron.ipcRenderer.invoke("save-admin-users", list),
  getServerSettingsAdminUsers: () => electron.ipcRenderer.invoke("get-server-settings-admin-users"),
  saveServerSettingsAdminUsers: (list) => electron.ipcRenderer.invoke("save-server-settings-admin-users", list),
  getOnlinePlayers: () => electron.ipcRenderer.invoke("get-online-players"),
  banOnlinePlayer: (steamId) => electron.ipcRenderer.invoke("ban-online-player", steamId),
  getDiscordConfig: () => electron.ipcRenderer.invoke("get-discord-config"),
  saveDiscordConfig: (config) => electron.ipcRenderer.invoke("save-discord-config", config),
  getAutomationConfig: () => electron.ipcRenderer.invoke("get-automation-config"),
  saveAutomationConfig: (config) => electron.ipcRenderer.invoke("save-automation-config", config),
  getDiscordBotStatus: () => electron.ipcRenderer.invoke("get-discord-bot-status"),
  restartDiscordBot: () => electron.ipcRenderer.invoke("restart-discord-bot"),
  stopDiscordBot: () => electron.ipcRenderer.invoke("stop-discord-bot"),
  getAppSettings: () => electron.ipcRenderer.invoke("get-app-settings"),
  saveAppSettings: (settings) => electron.ipcRenderer.invoke("save-app-settings", settings),
  detectServerPaths: () => electron.ipcRenderer.invoke("detect-server-paths"),
  checkInstallationStatus: () => electron.ipcRenderer.invoke("check-installation-status"),
  installSteamCmd: () => electron.ipcRenderer.invoke("install-steamcmd"),
  installServer: () => electron.ipcRenderer.invoke("install-server"),
  updateServer: () => electron.ipcRenderer.invoke("update-server"),
  verifyServerFiles: () => electron.ipcRenderer.invoke("verify-server-files"),
  selectDirectory: () => electron.ipcRenderer.invoke("select-directory"),
  triggerBackup: () => electron.ipcRenderer.invoke("trigger-backup"),
  checkForUpdates: () => electron.ipcRenderer.invoke("check-for-updates"),
  onStatsUpdate: (callback) => {
    electron.ipcRenderer.on("server-stats-update", (_event, stats) => callback(stats));
  },
  onStatusUpdate: (callback) => {
    electron.ipcRenderer.on("server-status-update", (_event, status) => callback(status));
  },
  onAutomationUpdate: (callback) => {
    electron.ipcRenderer.on("automation-update", (_event, automation) => callback(automation));
  },
  onConsoleLog: (callback) => {
    electron.ipcRenderer.on("console-log", (_event, message) => callback(message));
  },
  getConsoleLogs: () => electron.ipcRenderer.invoke("get-console-logs"),
  removeAllListeners: (channel) => {
    electron.ipcRenderer.removeAllListeners(channel);
  }
});
