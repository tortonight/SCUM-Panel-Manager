# SCUM Panel Manager

![SCUM Panel Manager](https://img.shields.io/badge/Status-Development-green) ![Electron](https://img.shields.io/badge/Electron-31.0-blue) ![React](https://img.shields.io/badge/React-19.0-cyan)

**SCUM Panel Manager** is a powerful, modern desktop application designed to simplify the management of SCUM Dedicated Servers. Built with **Electron**, **React**, and **TypeScript**, it provides a user-friendly interface for server administration, automation, and monitoring.

---

## 🚀 Key Features

### 🖥️ Server Management
- **One-Click Control:** Start, Stop, and Restart your server easily.
- **Auto-Update:** Checks and installs server updates via SteamCMD.
- **Performance Monitoring:** Real-time display of CPU, RAM usage, and active players.
- **Launch Parameters:** Customizable startup arguments (e.g., Use BattlEye, Port settings).

### 🤖 Automation
- **Scheduled Restarts:** Set automatic restart intervals to keep the server fresh.
- **Auto Backups:** Automatically backup your `Saved` folder.
- **Retention Policy:** Smart backup management that keeps the latest 10 backups and deletes older ones to save space.

### 💬 Advanced Discord Integration
A built-in Discord Bot that bridges your server with your community:
- **Rich Kill Feed:** 
  - Beautiful Embeds with Victim/Killer links to Steam Profiles.
  - **Location Tracking:** Shows X, Y, Z coordinates of the kill.
  - **Admin Helper:** Generates copy-paste `#TeleportTo` commands for admins to investigate.
- **Chat Relay:** Stream in-game chat to Discord and vice-versa.
- **Admin Logs:** Track admin commands and login activities.

### 👥 Player & Config Management
- **Player List:** View online players with Ping, IP, and SteamID.
- **Ban/Kick System:** Manage banned users directly from the UI.
- **Whitelist & Admin Manager:** Easy editor for `Whitelist.ini` and `AdminUsers.ini`.
- **Config Editor:** GUI-based editor for `ServerSettings.ini` (no more manual file editing!).

---

## 🛠️ Tech Stack

- **Core:** [Electron](https://www.electronjs.org/)
- **Frontend:** [React](https://react.dev/) + [Vite](https://vitejs.dev/)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/) + [Shadcn UI](https://ui.shadcn.com/)
- **Data Store:** [electron-store](https://github.com/sindresorhus/electron-store)

---

## 📦 Installation & Setup

### Prerequisites
- Node.js (v18 or higher)
- npm (comes with Node.js)
- A Windows machine (SCUM Server is Windows-only)

### Getting Started

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/SCUM-Panel-Manager.git
   cd SCUM-Panel-Manager
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Run in Development Mode**
   ```bash
   npm run dev
   ```
   *This will launch the Electron app and the React dev server.*

4. **Build for Production**
   ```bash
   npm run build
   ```
   *The output installer/executable will be in the `release` folder.*

---

## 📖 How to Use

1. **First Launch:** Go to the **Settings** page.
2. **Paths:** Set the `Game Path` (where SCUM Server is installed) and `SteamCMD Path`.
3. **Discord Bot (Optional):**
   - Create a Bot Application on [Discord Developer Portal](https://discord.com/developers/applications).
   - Copy the Bot Token and Webhook URLs.
   - Configure them in the **Discord Bot** tab.
4. **Start Server:** Go to the **Dashboard** and click **Start Server**.

---

## 📜 License

This project is open-source. Feel free to modify and distribute.

---

# (ภาษาไทย)

**SCUM Panel Manager** คือโปรแกรมจัดการเซิร์ฟเวอร์เกม SCUM แบบครบวงจร พัฒนาขึ้นเพื่อช่วยให้แอดมินดูแลเซิร์ฟเวอร์ได้ง่ายขึ้น โดยไม่ต้องยุ่งยากกับการพิมพ์คำสั่ง หรือแก้ไฟล์ Config ด้วยตัวเอง

## ✨ ฟีเจอร์เด่น

- **ระบบจัดการเซิร์ฟเวอร์:** เปิด/ปิด/รีสตาร์ท เซิร์ฟเวอร์ได้ในคลิกเดียว พร้อมระบบอัปเดตตัวเกมอัตโนมัติ
- **ระบบ Discord Bot สุดล้ำ:**
  - **Kill Feed แบบ Embed:** แสดงผลสวยงาม แยกชื่อคนฆ่า/คนตาย พร้อมลิงก์ Steam Profile
  - **ระบุพิกัด:** บอกจุดเกิดเหตุ (X, Y, Z) และสร้างคำสั่ง `#TeleportTo` ให้แอดมินก๊อปไปใช้วาร์ปได้ทันที
  - **Chat & Logs:** เชื่อมต่อแชทในเกมกับ Discord
- **ระบบสำรองข้อมูล (Backup):** ตั้งเวลา Backup อัตโนมัติ พร้อมระบบลบไฟล์เก่าทิ้งเองเมื่อเกิน 10 ไฟล์ (ประหยัดพื้นที่)
- **จัดการผู้เล่น:** ดูคนออนไลน์, แบน, เตะ, หรือเพิ่ม Admin/Whitelist ได้ง่ายๆ ผ่านหน้าจอ UI

## 💻 การติดตั้ง

1. ติดตั้ง Node.js
2. รันคำสั่ง `npm install` เพื่อลงโปรแกรม
3. รัน `npm run dev` เพื่อเปิดโปรแกรมทดสอบ
4. รัน `npm run build` เพื่อสร้างไฟล์ .exe สำหรับใช้งานจริง
