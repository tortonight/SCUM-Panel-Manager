import React, { useState, useEffect } from 'react';
import { Bot, Save, Power, MessageSquare, Skull, Shield, LogIn, Gamepad2, Activity } from 'lucide-react';
import { clsx } from 'clsx';
import type { DiscordConfig, FeedConfig } from '../types/electron';

const defaultFeedConfig: FeedConfig = { enabled: false, webhookUrl: '' };

const defaultConfig: DiscordConfig = {
  enabled: false,
  feeds: {
    kill: { ...defaultFeedConfig },
    chat: { ...defaultFeedConfig },
    admin: { ...defaultFeedConfig },
    login: { ...defaultFeedConfig },
    gameplay: { ...defaultFeedConfig },
    system: { ...defaultFeedConfig },
  },
};

export const DiscordBot = () => {
  const [config, setConfig] = useState<DiscordConfig>(defaultConfig);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [botStatus, setBotStatus] = useState<'running' | 'stopped'>('stopped');

  useEffect(() => {
    loadConfig();
    const interval = setInterval(checkStatus, 5000);
    checkStatus();
    return () => clearInterval(interval);
  }, []);

  const loadConfig = async () => {
    try {
      const data = await window.electron.getDiscordConfig();
      if (data) setConfig(data);
    } catch (error) {
      console.error('Failed to load discord config', error);
    } finally {
      setLoading(false);
    }
  };

  const checkStatus = async () => {
    try {
      const status = await window.electron.getDiscordBotStatus();
      setBotStatus(status);
    } catch (error) {
      console.error('Failed to get bot status', error);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await window.electron.saveDiscordConfig(config);
      // If enabled, restart the bot service
      if (config.enabled) {
        await window.electron.restartDiscordBot();
      } else {
        await window.electron.stopDiscordBot();
      }
      checkStatus();
    } catch (error) {
      console.error('Failed to save discord config', error);
    } finally {
      setSaving(false);
    }
  };

  const updateFeed = <K extends keyof FeedConfig>(type: keyof DiscordConfig['feeds'], field: K, value: FeedConfig[K]) => {
    setConfig(prev => ({
      ...prev,
      feeds: {
        ...prev.feeds,
        [type]: {
          ...prev.feeds[type],
          [field]: value
        }
      }
    }));
  };

  const FeedCard = ({ 
    type, 
    label, 
    icon: Icon, 
    description,
    color 
  }: { 
    type: keyof DiscordConfig['feeds']; 
    label: string; 
    icon: React.ElementType; 
    description: string;
    color: string;
  }) => (
    <div className="glass-panel p-6 rounded-xl border border-military-700 relative overflow-hidden group">
      <div className={`absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity ${color}`}>
        <Icon size={100} />
      </div>
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg bg-military-800 ${color} text-black`}>
              <Icon size={24} />
            </div>
            <div>
              <h3 className="font-bold text-lg text-white">{label}</h3>
              <p className="text-xs text-gray-400">{description}</p>
            </div>
          </div>
          
          <button
            onClick={() => updateFeed(type, 'enabled', !config.feeds[type].enabled)}
            className={clsx(
              "w-12 h-6 rounded-full transition-colors relative",
              config.feeds[type].enabled ? "bg-tactical-green" : "bg-military-700"
            )}
          >
            <div className={clsx(
              "absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-200 shadow-md",
              config.feeds[type].enabled ? "left-7" : "left-1"
            )} />
          </button>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Webhook URL</label>
          <input
            type="text"
            value={config.feeds[type].webhookUrl}
            onChange={(e) => updateFeed(type, 'webhookUrl', e.target.value)}
            placeholder={`https://discord.com/api/webhooks/...`}
            className="w-full bg-military-900/50 border border-military-600 rounded-lg p-3 text-sm text-gray-200 focus:border-tactical-green outline-none transition-all placeholder:text-gray-600"
          />
        </div>
      </div>
    </div>
  );

  if (loading) return <div className="p-10 text-center text-tactical-green">Loading configuration...</div>;

  return (
    <div className="p-6 h-full overflow-hidden flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
          <Bot className="text-tactical-green" size={32} />
          <span className="bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
            Discord Bot Integration
          </span>
        </h2>

        <div className="flex items-center gap-4">
          <div className="glass-panel px-4 py-2 rounded-lg flex items-center gap-3 border border-military-700">
            <span className="text-xs text-gray-400 uppercase font-bold tracking-wider">Service Status:</span>
            <div className="flex items-center gap-2">
              <div className={clsx(
                "w-2 h-2 rounded-full animate-pulse",
                botStatus === 'running' ? "bg-tactical-green" : "bg-red-500"
              )} />
              <span className={clsx(
                "text-sm font-bold",
                botStatus === 'running' ? "text-tactical-green" : "text-red-500"
              )}>
                {botStatus.toUpperCase()}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-military-800 p-1 rounded-lg border border-military-700">
            <button
              onClick={() => setConfig(prev => ({ ...prev, enabled: true }))}
              className={clsx(
                "px-4 py-2 rounded-md text-sm font-bold transition-all flex items-center gap-2",
                config.enabled ? "bg-tactical-green text-black shadow-lg" : "text-gray-400 hover:text-white"
              )}
            >
              <Power size={16} />
              ON
            </button>
            <button
              onClick={() => setConfig(prev => ({ ...prev, enabled: false }))}
              className={clsx(
                "px-4 py-2 rounded-md text-sm font-bold transition-all flex items-center gap-2",
                !config.enabled ? "bg-red-500 text-white shadow-lg" : "text-gray-400 hover:text-white"
              )}
            >
              <Power size={16} />
              OFF
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-6 pb-20">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <FeedCard 
            type="kill" 
            label="Kill Feed" 
            description="Tracks player kills and deaths"
            icon={Skull} 
            color="bg-red-500"
          />
          <FeedCard 
            type="chat" 
            label="Chat Feed" 
            description="Global and local chat messages"
            icon={MessageSquare} 
            color="bg-blue-400"
          />
          <FeedCard 
            type="admin" 
            label="Admin Feed" 
            description="Admin command usage logs"
            icon={Shield} 
            color="bg-yellow-500"
          />
          <FeedCard 
            type="login" 
            label="Login Feed" 
            description="Player connections and disconnections"
            icon={LogIn} 
            color="bg-green-500"
          />
          <FeedCard 
            type="gameplay" 
            label="Gameplay Feed" 
            icon={Gamepad2} 
            color="text-purple-400"
            description="Events related to gameplay mechanics"
          />

          <FeedCard 
            type="system" 
            label="System & Restart Alerts" 
            icon={Activity} 
            color="text-cyan-400"
            description="Server restart warnings and system notifications"
          />
        </div>
      </div>

      <div className="absolute bottom-6 right-6">
        <button 
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-8 py-4 bg-tactical-green text-black font-bold rounded-xl hover:bg-green-400 transition-all shadow-[0_0_20px_rgba(0,255,65,0.3)] disabled:opacity-50 uppercase tracking-wider transform hover:scale-105 active:scale-95"
        >
          <Save size={20} />
          {saving ? 'Saving Changes...' : 'Save Configuration'}
        </button>
      </div>
    </div>
  );
};
