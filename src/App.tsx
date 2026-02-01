import { useState, useEffect, Suspense, lazy } from 'react';
import { Sidebar } from './components/Sidebar';
import { TitleBar } from './components/TitleBar';

// Lazy load pages
const Dashboard = lazy(() => import('./pages/Dashboard').then(module => ({ default: module.Dashboard })));
const Console = lazy(() => import('./pages/Console').then(module => ({ default: module.Console })));
const PlayerManager = lazy(() => import('./pages/PlayerManager').then(module => ({ default: module.PlayerManager })));
const ConfigManager = lazy(() => import('./pages/ConfigManager').then(module => ({ default: module.ConfigManager })));
const ScheduleManager = lazy(() => import('./pages/ScheduleManager').then(module => ({ default: module.ScheduleManager })));
const SettingsPage = lazy(() => import('./pages/SettingsPage').then(module => ({ default: module.SettingsPage })));
const DiscordBot = lazy(() => import('./pages/DiscordBot').then(module => ({ default: module.DiscordBot })));
const BackupManager = lazy(() => import('./pages/BackupManager').then(module => ({ default: module.BackupManager })));

const Loading = () => (
  <div className="flex items-center justify-center h-full">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-tactical-green"></div>
  </div>
);

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
            <Suspense fallback={<Loading />}>
              {activeTab === 'dashboard' && <Dashboard serverStatus={serverStatus} />}
              {activeTab === 'console' && <Console />}
              {activeTab === 'players' && <PlayerManager />}
              {activeTab === 'config' && <ConfigManager />}
              {activeTab === 'schedule' && <ScheduleManager />}
              {activeTab === 'backup' && <BackupManager />}
              {activeTab === 'settings' && <SettingsPage />}
              {activeTab === 'discord' && <DiscordBot />}
            </Suspense>
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
