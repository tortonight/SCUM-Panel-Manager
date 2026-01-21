import { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { TitleBar } from './components/TitleBar';
import { Dashboard } from './pages/Dashboard';
import { Console } from './pages/Console';
import { PlayerManager } from './pages/PlayerManager';
import { ConfigManager } from './pages/ConfigManager';
import { ScheduleManager } from './pages/ScheduleManager';
import { SettingsPage } from './pages/SettingsPage';
import { DiscordBot } from './pages/DiscordBot';
import { BackupManager } from './pages/BackupManager';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [serverStatus, setServerStatus] = useState('stopped');

  useEffect(() => {
    window.electron.onStatusUpdate((status) => {
      setServerStatus(status);
    });

    return () => {
      window.electron.removeAllListeners('server-status-update');
    };
  }, []);

  return (
    <div className="flex flex-col h-screen w-screen bg-military-900 text-white overflow-hidden">
      <TitleBar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} serverStatus={serverStatus} />
        <main className="flex-1 bg-[url('https://images.unsplash.com/photo-1542259681-d306616a6788?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center relative">
          <div className="absolute inset-0 bg-military-900/90 backdrop-blur-sm"></div>
          <div className="relative h-full z-10">
            {activeTab === 'dashboard' && <Dashboard serverStatus={serverStatus} />}
            {activeTab === 'console' && <Console />}
            {activeTab === 'players' && <PlayerManager />}
            {activeTab === 'config' && <ConfigManager />}
            {activeTab === 'schedule' && <ScheduleManager />}
            {activeTab === 'backup' && <BackupManager />}
            {activeTab === 'settings' && <SettingsPage />}
            {activeTab === 'discord' && <DiscordBot />}
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
