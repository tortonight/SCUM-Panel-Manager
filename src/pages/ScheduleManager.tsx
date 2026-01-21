import React, { useState, useEffect } from 'react';
import { Clock, Save, Power, RefreshCw, HardDrive, AlertTriangle } from 'lucide-react';
import clsx from 'clsx';
import type { AutomationConfig } from '../types/electron';

export const ScheduleManager: React.FC = () => {
  const [config, setConfig] = useState<AutomationConfig>({
    autoBackupEnabled: false,
    autoBackupInterval: 60,
    autoUpdateEnabled: false,
    autoUpdateInterval: 1440,
    autoRestartEnabled: false,
    autoRestartInterval: 360,
    restartWarningMinutes: 5
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    setLoading(true);
    const data = await window.electron.getAutomationConfig();
    if (data) {
        // Merge with defaults to ensure all fields exist
        setConfig(prev => ({ ...prev, ...data }));
    }
    setLoading(false);
  };

  if (loading) return <div className="p-10 text-center text-tactical-green">Loading...</div>;

  const handleSave = async () => {
    setSaving(true);
    await window.electron.saveAutomationConfig(config);
    setTimeout(() => setSaving(false), 500);
  };

  const handleChange = (key: keyof AutomationConfig, value: boolean | number) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="p-6 h-full overflow-hidden flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Clock className="text-tactical-orange" />
          SCHEDULE & AUTOMATION
        </h2>
        <button 
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-tactical-green text-white rounded hover:bg-green-600 transition-colors shadow-lg shadow-green-900/20 disabled:opacity-50"
        >
          <Save size={16} className={saving ? 'animate-spin' : ''} />
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 space-y-6">
        
        {/* Auto Restart Section */}
        <div className="glass-panel p-6 rounded-xl border border-military-700">
          <div className="flex items-center justify-between mb-4 border-b border-military-700 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-500/10 rounded-lg border border-red-500/20">
                <Power className="text-red-400" size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Auto Restart</h3>
                <p className="text-xs text-gray-400">Automatically restart server periodically to clear memory and reduce lag.</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                checked={config.autoRestartEnabled}
                onChange={(e) => handleChange('autoRestartEnabled', e.target.checked)}
                className="sr-only peer" 
              />
              <div className="w-11 h-6 bg-military-900 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-tactical-green"></div>
            </label>
          </div>

          <div className={clsx("space-y-4 transition-all duration-300", !config.autoRestartEnabled && "opacity-50 pointer-events-none")}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs text-gray-400 font-bold uppercase tracking-wider block">Restart Interval (Minutes)</label>
                <div className="flex items-center gap-2">
                    <input
                        type="number"
                        min="60"
                        value={config.autoRestartInterval}
                        onChange={(e) => handleChange('autoRestartInterval', parseInt(e.target.value) || 60)}
                        className="flex-1 bg-military-900/50 border border-military-600 rounded p-3 text-gray-200 focus:border-tactical-green outline-none"
                    />
                    <span className="text-sm text-gray-500 font-mono">{(config.autoRestartInterval / 60).toFixed(1)} Hours</span>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs text-gray-400 font-bold uppercase tracking-wider block">Warning Notification (Minutes Before)</label>
                <input
                    type="number"
                    min="1"
                    max="60"
                    value={config.restartWarningMinutes || 5}
                    onChange={(e) => handleChange('restartWarningMinutes', parseInt(e.target.value) || 5)}
                    className="w-full bg-military-900/50 border border-military-600 rounded p-3 text-gray-200 focus:border-tactical-green outline-none"
                />
              </div>
            </div>
            {config.autoRestartEnabled && (
                <div className="flex items-center gap-2 text-xs text-yellow-500 bg-yellow-500/10 p-2 rounded border border-yellow-500/20">
                    <AlertTriangle size={14} />
                    <span>Server will restart every {config.autoRestartInterval} minutes. Players will be notified {config.restartWarningMinutes || 5} minutes before.</span>
                </div>
            )}
          </div>
        </div>

        {/* Auto Backup Section */}
        <div className="glass-panel p-6 rounded-xl border border-military-700">
          <div className="flex items-center justify-between mb-4 border-b border-military-700 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg border border-blue-500/20">
                <HardDrive className="text-blue-400" size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Auto Backup</h3>
                <p className="text-xs text-gray-400">Regularly backup save files to prevent data loss.</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                checked={config.autoBackupEnabled}
                onChange={(e) => handleChange('autoBackupEnabled', e.target.checked)}
                className="sr-only peer" 
              />
              <div className="w-11 h-6 bg-military-900 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-tactical-green"></div>
            </label>
          </div>

          <div className={clsx("space-y-4 transition-all duration-300", !config.autoBackupEnabled && "opacity-50 pointer-events-none")}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs text-gray-400 font-bold uppercase tracking-wider block">Backup Interval (Minutes)</label>
                 <div className="flex items-center gap-2">
                    <input
                        type="number"
                        min="30"
                        value={config.autoBackupInterval}
                        onChange={(e) => handleChange('autoBackupInterval', parseInt(e.target.value) || 60)}
                        className="flex-1 bg-military-900/50 border border-military-600 rounded p-3 text-gray-200 focus:border-tactical-green outline-none"
                    />
                    <span className="text-sm text-gray-500 font-mono">{(config.autoBackupInterval / 60).toFixed(1)} Hours</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Auto Update Section */}
        <div className="glass-panel p-6 rounded-xl border border-military-700">
          <div className="flex items-center justify-between mb-4 border-b border-military-700 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/10 rounded-lg border border-purple-500/20">
                <RefreshCw className="text-purple-400" size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Auto Update</h3>
                <p className="text-xs text-gray-400">Check and apply server updates automatically (Restart required).</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                checked={config.autoUpdateEnabled}
                onChange={(e) => handleChange('autoUpdateEnabled', e.target.checked)}
                className="sr-only peer" 
              />
              <div className="w-11 h-6 bg-military-900 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-tactical-green"></div>
            </label>
          </div>

          <div className={clsx("space-y-4 transition-all duration-300", !config.autoUpdateEnabled && "opacity-50 pointer-events-none")}>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs text-gray-400 font-bold uppercase tracking-wider block">Check Interval (Minutes)</label>
                 <div className="flex items-center gap-2">
                    <input
                        type="number"
                        min="60"
                        value={config.autoUpdateInterval}
                        onChange={(e) => handleChange('autoUpdateInterval', parseInt(e.target.value) || 1440)}
                        className="flex-1 bg-military-900/50 border border-military-600 rounded p-3 text-gray-200 focus:border-tactical-green outline-none"
                    />
                    <span className="text-sm text-gray-500 font-mono">{(config.autoUpdateInterval / 60).toFixed(1)} Hours</span>
                </div>
              </div>
            </div>
             <div className="flex items-center gap-2 text-xs text-gray-400 bg-military-900/50 p-2 rounded border border-military-600">
                <AlertTriangle size={14} className="text-yellow-500"/>
                <span>Note: Server will stop if an update is found and applied. Ensure Auto Restart is also enabled to bring it back online.</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
