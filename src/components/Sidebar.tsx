import React from 'react';
import { LayoutDashboard, Terminal, Settings, Wrench, Users, Bot, Clock, Archive } from 'lucide-react';
import { clsx } from 'clsx';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  serverStatus: string;
}

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'console', label: 'Live Console', icon: Terminal },
  { id: 'players', label: 'Player Manager', icon: Users },
  { id: 'config', label: 'Game Config', icon: Settings },
  { id: 'schedule', label: 'Automation', icon: Clock },
  { id: 'backup', label: 'Backups', icon: Archive },
  { id: 'settings', label: 'App Settings', icon: Wrench },
  { id: 'discord', label: 'Discord Bot', icon: Bot },
];

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, serverStatus }) => {

  return (
    <div className="w-64 bg-military-800 border-r border-military-700 flex flex-col h-full">
      <div className="p-6">
        <div className="text-tactical-orange text-xs font-bold mb-2 uppercase tracking-wider opacity-70">
          Main Menu
        </div>
        <div className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={clsx(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200",
                  isActive 
                    ? "bg-military-700 text-tactical-green shadow-lg shadow-black/20 border-l-2 border-tactical-green" 
                    : "text-gray-400 hover:bg-military-700/50 hover:text-gray-200"
                )}
              >
                <Icon size={18} />
                {item.label}
              </button>
            );
          })}
        </div>
      </div>
      
      <div className="mt-auto p-6 border-t border-military-700">
        <div className="glass-panel p-4 rounded-lg">
          <div className="flex items-center gap-3 mb-2">
            <div className={clsx(
              "w-2 h-2 rounded-full",
              serverStatus === 'running' ? "bg-tactical-green animate-pulse" :
              serverStatus === 'starting' ? "bg-yellow-500 animate-pulse" :
              "bg-red-500"
            )}></div>
            <span className="text-xs text-gray-400">System Status</span>
          </div>
          <div className={clsx(
            "text-xs font-mono font-bold",
            serverStatus === 'running' ? "text-tactical-green" :
            serverStatus === 'starting' ? "text-yellow-500" :
            "text-red-500"
          )}>
            {serverStatus.toUpperCase()}
          </div>
        </div>
      </div>
    </div>
  );
};
