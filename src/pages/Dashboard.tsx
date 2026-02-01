import React, { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Power, RotateCcw, Square, Server, Users, Cpu, Activity, ShieldCheck, RefreshCw, HardDrive, Clock } from 'lucide-react';
import { clsx } from 'clsx';
import type { ServerStats, AutomationStats } from '../types/electron';

interface DashboardProps {
  serverStatus: string;
}

export const Dashboard: React.FC<DashboardProps> = ({ serverStatus: status }) => {
  const [stats, setStats] = useState<ServerStats>({ cpu: 0, ram: 0, serverRam: 0, systemRamUsed: 0, systemRamTotal: 0, players: 0, maxPlayers: 64 });
  const [automation, setAutomation] = useState<AutomationStats>({ 
    lastBackup: 'Never', 
    nextBackup: 'Unknown', 
    updateStatus: 'up-to-date', 
    lastUpdateCheck: 'Never' 
  });
  const [history, setHistory] = useState<Array<{ time: string; cpu: number; ram: number; players: number; serverRam?: number; systemRamUsed?: number }>>([]);

  useEffect(() => {
    window.electron.onStatsUpdate((newStats) => {
      setStats(newStats);
      setHistory(prev => {
        const newHistory = [...prev, { time: new Date().toLocaleTimeString(), ...newStats }];
        if (newHistory.length > 20) newHistory.shift();
        return newHistory;
      });
    });

    window.electron.onAutomationUpdate((newAutomation) => {
      setAutomation(newAutomation);
    });

    return () => {
      window.electron.removeAllListeners('server-stats-update');
      window.electron.removeAllListeners('automation-update');
    };
  }, []);

  const handleStart = async () => {
    await window.electron.startServer();
  };

  const handleStop = async () => {
    await window.electron.stopServer();
  };

  const handleRestart = async () => {
    await window.electron.restartServer();
  };

  const handleBackup = async () => {
    await window.electron.triggerBackup();
  };

  const handleUpdateCheck = async () => {
    await window.electron.checkForUpdates();
  };

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full pb-20">
      {/* Header Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="CPU USAGE" 
          value={`${stats.cpu.toFixed(1)}%`} 
          icon={Cpu} 
          color="text-tactical-orange"
        />
        <StatCard 
          title="SERVER RAM" 
          value={`${(stats.serverRam || 0).toFixed(1)} GB`} 
          icon={Activity} 
          color="text-blue-400"
        />
        <StatCard 
          title="SYSTEM RAM" 
          value={`${(stats.systemRamUsed || 0).toFixed(1)} / ${(stats.systemRamTotal || 0).toFixed(0)} GB`} 
          icon={HardDrive} 
          color="text-purple-400"
        />
        <StatCard 
          title="PLAYERS" 
          value={`${stats.players} / ${stats.maxPlayers}`} 
          icon={Users} 
          color="text-tactical-green"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Control Panel */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-xl border border-military-700">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Server className="text-tactical-orange" />
              SERVER CONTROL
            </h2>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">STATUS:</span>
              <span className={clsx(
                "px-3 py-1 rounded text-xs font-bold uppercase",
                status === 'running' ? "bg-tactical-green/20 text-tactical-green border border-tactical-green/50" :
                status === 'stopped' ? "bg-red-500/20 text-red-500 border border-red-500/50" :
                "bg-yellow-500/20 text-yellow-500 border border-yellow-500/50"
              )}>
                {status}
              </span>
            </div>
          </div>
          
          <div className="flex gap-4">
            <ControlButton 
              onClick={handleStart} 
              disabled={status === 'running' || status === 'starting'}
              icon={Power}
              label="START SERVER"
              color="bg-tactical-green"
            />
            <ControlButton 
              onClick={handleRestart} 
              disabled={status === 'stopped'}
              icon={RotateCcw}
              label="RESTART"
              color="bg-blue-600"
            />
            <ControlButton 
              onClick={handleStop} 
              disabled={status === 'stopped'}
              icon={Square}
              label="STOP SERVER"
              color="bg-red-600"
            />
          </div>
        </div>

        {/* Automation Panel */}
        <div className="glass-panel p-6 rounded-xl border border-military-700 flex flex-col justify-between">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-4">
              <ShieldCheck className="text-blue-400" />
              AUTOMATION
            </h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-military-800/50 rounded-lg border border-military-700">
                <div className="flex items-center gap-3">
                  <HardDrive size={18} className="text-gray-400" />
                  <div>
                    <div className="text-xs text-gray-400 font-bold uppercase">Last Backup</div>
                    <div className="text-sm text-white font-mono">{automation.lastBackup || 'Never'}</div>
                  </div>
                </div>
                <button onClick={handleBackup} className="p-2 hover:bg-military-700 rounded text-tactical-green transition-colors" title="Backup Now">
                  <RotateCcw size={16} />
                </button>
              </div>

              <div className="flex items-center justify-between p-3 bg-military-800/50 rounded-lg border border-military-700">
                <div className="flex items-center gap-3">
                  <RefreshCw size={18} className={clsx("text-gray-400", automation.updateStatus === 'checking' && "animate-spin")} />
                  <div>
                    <div className="text-xs text-gray-400 font-bold uppercase">Update Status</div>
                    <div className={clsx("text-sm font-mono", 
                      automation.updateStatus === 'up-to-date' ? "text-tactical-green" :
                      automation.updateStatus === 'update-available' ? "text-tactical-orange" : "text-white"
                    )}>
                      {automation.updateStatus === 'up-to-date' ? 'UP TO DATE' : 
                       automation.updateStatus === 'update-available' ? 'UPDATE AVAILABLE' : 
                       automation.updateStatus.toUpperCase()}
                    </div>
                  </div>
                </div>
                <button onClick={handleUpdateCheck} className="p-2 hover:bg-military-700 rounded text-blue-400 transition-colors" title="Check for Updates">
                  <RefreshCw size={16} />
                </button>
              </div>
              
               <div className="flex items-center gap-3 px-3">
                  <Clock size={14} className="text-gray-500" />
                  <span className="text-xs text-gray-500">Next Auto-Backup: <span className="text-gray-300">{automation.nextBackup}</span></span>
               </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="CPU History" data={history} dataKey="cpu" color="#ff9800" />
        <ChartCard title="Server RAM History" data={history} dataKey="serverRam" color="#60a5fa" />
        <ChartCard title="Player Count" data={history} dataKey="players" color="#4caf50" />
        <ChartCard title="System RAM Used" data={history} dataKey="systemRamUsed" color="#a855f7" />
      </div>
    </div>
  );
};

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
}

const StatCard = ({ title, value, icon: Icon, color }: StatCardProps) => (
  <div className="glass-panel p-5 rounded-xl border border-military-700 flex items-center justify-between">
    <div>
      <div className="text-xs text-gray-400 font-bold mb-1 tracking-wider">{title}</div>
      <div className={`text-2xl font-mono font-bold ${color}`}>{value}</div>
    </div>
    <div className={`p-3 rounded-lg bg-military-800 ${color} bg-opacity-10`}>
      <Icon size={24} />
    </div>
  </div>
);

interface ControlButtonProps {
  onClick: () => void;
  disabled: boolean;
  icon: React.ElementType;
  label: string;
  color: string;
}

const ControlButton = React.memo(({ onClick, disabled, icon: Icon, label, color }: ControlButtonProps) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={clsx(
      "flex-1 py-4 rounded-lg flex flex-col items-center justify-center gap-2 transition-all duration-200 font-bold tracking-wider",
      disabled ? "bg-military-800 text-gray-600 cursor-not-allowed border border-military-700" : `${color} hover:brightness-110 text-white shadow-lg`
    )}
  >
    <Icon size={20} />
    {label}
  </button>
));

interface ChartCardProps {
  title: string;
  data: Array<any>;
  dataKey: string;
  color: string;
}

const ChartCard = ({ title, data, dataKey, color }: ChartCardProps) => (
  <div className="glass-panel p-6 rounded-xl border border-military-700 h-80 flex flex-col">
    <h3 className="text-white font-bold mb-4">{title}</h3>
    <div className="flex-1 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id={`color${dataKey}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.3}/>
              <stop offset="95%" stopColor={color} stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#2f362f" />
          <XAxis dataKey="time" hide />
          <YAxis stroke="#4a574a" fontSize={12} domain={[0, 'auto']} />
          <Tooltip 
            contentStyle={{ backgroundColor: '#1a1d1a', borderColor: '#4caf50', color: '#fff' }}
            itemStyle={{ color: color }}
          />
          <Area type="monotone" dataKey={dataKey} stroke={color} fillOpacity={1} fill={`url(#color${dataKey})`} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  </div>
);
