# SCUM Panel Manager

ระบบจัดการเซิร์ฟเวอร์ SCUM Game ที่พัฒนาด้วย Electron, React, และ TypeScript

## ความต้องการของระบบ (Prerequisites)

- Node.js (แนะนำเวอร์ชัน 18 หรือสูงกว่า)
- npm (มาพร้อมกับ Node.js)

## การติดตั้ง (Installation)

1. เปิด Terminal หรือ Command Prompt
2. ไปที่โฟลเดอร์ของโปรเจกต์
3. รันคำสั่งเพื่อติดตั้ง Dependencies:

```bash
npm install
```

## การรันโปรแกรมในโหมดนักพัฒนา (Development)

คำสั่งนี้จะเปิดทั้งหน้าต่าง Electron และ Vite Dev Server สำหรับ React:

```bash
npm run dev
```

หมายเหตุ: หากคุณเปิด http://localhost:5173 ในเบราว์เซอร์ คุณจะเห็นหน้าเว็บ React แต่ฟังก์ชันที่ต้องใช้ Electron API (เช่น การจัดการไฟล์, การรันเซิร์ฟเวอร์) จะทำงานผ่าน Mock Data แทน

## การ Build สำหรับใช้งานจริง (Production Build)

คำสั่งนี้จะทำการ Compile TypeScript และ Build ไฟล์สำหรับ Production:

```bash
npm run build
```

ไฟล์ที่ได้จะอยู่ในโฟลเดอร์ `dist` และ `dist-electron`

## โครงสร้างโปรเจกต์ (Project Structure)

- `src/`: Source code ของ React Frontend
  - `pages/`: หน้าต่างๆ ของแอปพลิเคชัน (Dashboard, PlayerManager, etc.)
  - `components/`: Component ย่อยๆ
  - `types/`: Type definitions
  - `mock/`: Mock data สำหรับการรันบน Browser
- `electron/`: Source code ของ Electron Main Process
  - `main.ts`: Entry point หลักของ Electron
  - `preload.ts`: Bridge ระหว่าง Main Process และ Renderer Process
