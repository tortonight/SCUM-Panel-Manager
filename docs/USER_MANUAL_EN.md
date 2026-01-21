# SCUM Panel Manager - User Manual

Welcome to **SCUM Panel Manager**, a comprehensive server management tool designed to help SCUM server owners manage their servers easily and efficiently.

## Table of Contents
1. [Installation & Setup](#1-installation--setup)
2. [Dashboard](#2-dashboard)
3. [Player Manager](#3-player-manager)
4. [Game Config](#4-game-config)
5. [Automation](#5-automation)
6. [Discord Bot](#6-discord-bot)
7. [Live Console](#7-live-console)
8. [App Settings](#8-app-settings)

---

## 1. Installation & Setup

Upon first launch, you must configure the critical file paths for the application to function correctly:

1. Navigate to the **App Settings** menu (Wrench icon).
2. **SteamCMD Path**: Specify the installation folder for SteamCMD (click 'Install' to download if missing).
3. **SCUM Server Path**: Specify the installation folder of your SCUM Server (e.g., `C:\SCUMServer`).
4. Click **Save Settings** to apply.

---

## 2. Dashboard

The main hub for server overview and control status.

*   **Server Status**: Displays current state (Running, Stopped, Starting).
*   **Control Buttons**:
    *   **Start**: Launch the server.
    *   **Stop**: Shut down the server.
    *   **Restart**: Reboot the server.
    *   **Update Server**: Patch the game via SteamCMD.
*   **Server Stats**: Real-time monitoring of CPU, RAM usage, and Player count.

---

## 3. Player Manager

A comprehensive player management system divided into 5 tabs:

### 3.1 Online Players
*   View list of currently connected players.
*   Displays: Name, Steam ID, IP, Ping.
*   **Action**: Use the **Ban** button to instantly kick and ban a player.

### 3.2 Whitelist
*   Manage players allowed to join the server (if whitelist is enabled).
*   Add new Steam IDs or remove existing ones.
*   File: `WhitelistedUsers.ini`

### 3.3 Banned Users
*   List of players prohibited from joining.
*   Unban players by removing their Steam ID from the list.
*   File: `BannedUsers.ini`

### 3.4 Admin Users
*   Manage server administrators.
*   File: `AdminUsers.ini`

### 3.5 Server Settings Admin
*   Manage admins with access to server settings.
*   File: `ServerSettingsAdminUsers.ini`

> **Usage**: Enter a Steam ID in the input field and click the **+** button to add, or click the trash icon to remove.

---

## 4. Game Config

Menu for customizing server settings (modifies `ServerSettings.ini`). The main section is **Server Config**:

*   **Server Name**: Your server's display name.
*   **Server Password**: Password required to join.
*   **Max Players**: Maximum player capacity.
*   **Welcome Message**: Message shown upon joining.
*   **Message of the Day**: Daily announcement text.
*   And more general settings.

**Usage**:
*   Edit values in the fields.
*   Click **Save to Server** to write changes to the file.
*   Click **Load from Server** to refresh values from the file.

---

## 5. Automation

Schedule automated tasks to reduce administrative burden:

*   **Auto Restart**: Schedule automatic server restarts at defined intervals (in minutes).
    *   *Alert System*: Automatically broadcasts countdowns via RCON and Discord (60, 30, 15, 10, 5, 3, 2, 1 minutes).
*   **Auto Backup**: Automatically backup server data.
*   **Auto Update**: Automatically check and apply server updates.

---

## 6. Discord Bot

Real-time notification system sending server events to your Discord via Webhooks:

*   **Kill Feed**: PvP/PvE kill notifications.
*   **Chat Feed**: In-game global chat logs.
*   **Admin Feed**: Admin command usage logs.
*   **Login Feed**: Player connection/disconnection logs.
*   **Gameplay Feed**: General gameplay events.
*   **System & Restart Alerts**: System notifications and restart countdowns.

**Setup**:
1. Create a Webhook in your desired Discord Channel.
2. Paste the URL into the corresponding Feed's Webhook URL field.
3. Toggle the switch to **Enable**.
4. Click **Save Configuration**.

---

## 7. Live Console

*   Displays real-time server logs.
*   Allows sending RCON commands directly to the server.

---

## 8. Troubleshooting

*   **Server won't start**: Verify `SCUM Server Path` is correct and ports are not blocked.
*   **RCON Connection Failed**: Ensure RCON IP and Port in `ServerSettings.ini` match the application defaults (127.0.0.1:28102) or are correctly configured.
*   **No Discord Alerts**: Check if Webhook URLs are correct and the bot has permission to post in those channels.
