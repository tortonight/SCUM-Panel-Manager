import React, { useState, useEffect } from 'react';
import { Save, Folder, CheckCircle, XCircle, Settings as SettingsIcon } from 'lucide-react';
import type { AppSettings } from '../types/electron';

export const SettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<AppSettings>({
    steamCmdPath: '',
    gamePath: ''
  });
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [installStatus, setInstallStatus] = useState({
    steamCmdInstalled: false,
    serverInstalled: false
  });

  useEffect(() => {
    const init = async () => {
        await loadSettings();
    };
    init();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const loadSettings = async () => {
    const data = await window.electron.getAppSettings();
    setSettings(data);
    await checkStatus();
  };

  const checkStatus = async () => {
    const status = await window.electron.checkInstallationStatus();
    setInstallStatus(status);
  };

  const handleBrowse = async (key: keyof AppSettings) => {
    const result = await window.electron.selectDirectory();
    if (!result.canceled && result.path) {
      setSettings(prev => ({ ...prev, [key]: result.path! }));
      // We should probably save immediately or just re-check status after save
    }
  };

  const handleSave = async () => {
    try {
      setSaveStatus('saving');
      await window.electron.saveAppSettings(settings);
      await checkStatus();
      setTimeout(() => setSaveStatus('saved'), 500);
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      console.error("Failed to save settings:", error);
      setSaveStatus('idle'); // Reset on error
      // Optionally show an error notification here
    }
  };

  const handleAction = async (action: 'installSteamCmd' | 'installServer' | 'updateServer' | 'verifyFiles') => {
    switch(action) {
        case 'installSteamCmd': await window.electron.installSteamCmd(); break;
        case 'installServer': await window.electron.installServer(); break;
        case 'updateServer': await window.electron.updateServer(); break;
        case 'verifyFiles': await window.electron.verifyServerFiles(); break;
    }
  };

  return (
    <div className="p-6 h-full overflow-hidden flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
          <SettingsIcon className="text-white" size={32} />
          <span className="bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
            Installation & Updates
          </span>
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto space-y-8">
        
        {/* Paths Section */}
        <div className="glass-panel p-8 rounded-xl border border-military-700 shadow-2xl bg-black/40">
          <h3 className="text-tactical-green font-bold text-lg mb-6 flex items-center gap-2">
            <Folder size={20} />
            Paths
          </h3>
          
          <div className="space-y-6">
            {/* SteamCMD Path */}
            <div className="grid grid-cols-12 gap-4 items-center">
              <label className="col-span-12 md:col-span-2 text-sm text-gray-400 font-medium">
                SteamCMD Path:
              </label>
              <div className="col-span-12 md:col-span-8">
                <input
                  type="text"
                  value={settings.steamCmdPath}
                  readOnly
                  className="w-full bg-military-900/50 border border-military-600 rounded-lg p-3 text-gray-200 focus:border-tactical-green outline-none transition-all"
                  placeholder="Select SteamCMD folder..."
                />
              </div>
              <div className="col-span-12 md:col-span-2">
                <button
                  onClick={() => handleBrowse('steamCmdPath')}
                  className="w-full py-3 bg-transparent border-2 border-tactical-green text-tactical-green hover:bg-tactical-green hover:text-black rounded-lg font-bold transition-all uppercase tracking-wide text-sm"
                >
                  Browse
                </button>
              </div>
            </div>

            {/* Server Path */}
            <div className="grid grid-cols-12 gap-4 items-center">
              <label className="col-span-12 md:col-span-2 text-sm text-gray-400 font-medium">
                Server Path:
              </label>
              <div className="col-span-12 md:col-span-8">
                <input
                  type="text"
                  value={settings.gamePath}
                  readOnly
                  className="w-full bg-military-900/50 border border-military-600 rounded-lg p-3 text-gray-200 focus:border-tactical-green outline-none transition-all"
                  placeholder="Select SCUM Server folder..."
                />
              </div>
              <div className="col-span-12 md:col-span-2">
                <button
                  onClick={() => handleBrowse('gamePath')}
                  className="w-full py-3 bg-transparent border-2 border-tactical-green text-tactical-green hover:bg-tactical-green hover:text-black rounded-lg font-bold transition-all uppercase tracking-wide text-sm"
                >
                  Browse
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Launch Parameters Section */}
        <div className="glass-panel p-8 rounded-xl border border-military-700 shadow-2xl bg-black/40">
          <h3 className="text-tactical-green font-bold text-lg mb-6 flex items-center gap-2">
            <SettingsIcon size={20} />
            Launch Parameters
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Port */}
            <div className="space-y-2">
              <label className="text-sm text-gray-400 font-medium">Game Port</label>
              <input
                type="text"
                value={settings.launchParams?.port ?? '7573'}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  launchParams: {
                    ...(prev.launchParams || { useLog: true, port: '7573', queryPort: '7779', maxPlayers: '100' }),
                    port: e.target.value
                  }
                }))}
                className="w-full bg-military-900/50 border border-military-600 rounded-lg p-3 text-gray-200 focus:border-tactical-green outline-none transition-all"
                placeholder="7573"
              />
            </div>

            {/* Query Port */}
            <div className="space-y-2">
              <label className="text-sm text-gray-400 font-medium">Query Port</label>
              <input
                type="text"
                value={settings.launchParams?.queryPort ?? '7779'}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  launchParams: {
                    ...(prev.launchParams || { useLog: true, port: '7573', queryPort: '7779', maxPlayers: '100' }),
                    queryPort: e.target.value
                  }
                }))}
                className="w-full bg-military-900/50 border border-military-600 rounded-lg p-3 text-gray-200 focus:border-tactical-green outline-none transition-all"
                placeholder="7779"
              />
            </div>

            {/* Max Players */}
            <div className="space-y-2">
              <label className="text-sm text-gray-400 font-medium">Max Players</label>
              <input
                type="text"
                value={settings.launchParams?.maxPlayers ?? '100'}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  launchParams: {
                    ...(prev.launchParams || { useLog: true, port: '7573', queryPort: '7779', maxPlayers: '100' }),
                    maxPlayers: e.target.value
                  }
                }))}
                className="w-full bg-military-900/50 border border-military-600 rounded-lg p-3 text-gray-200 focus:border-tactical-green outline-none transition-all"
                placeholder="100"
              />
            </div>
          </div>
          
          <div className="mt-6 flex flex-wrap gap-6">
             <div className="flex items-center gap-3">
                <input 
                  type="checkbox"
                  id="useLog"
                  checked={settings.launchParams?.useLog ?? true}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    launchParams: {
                      ...(prev.launchParams || { useLog: true, useBattlEye: true, port: '7573', queryPort: '7779', maxPlayers: '100' }),
                      useLog: e.target.checked
                    }
                  }))}
                  className="w-5 h-5 rounded border-military-600 bg-military-900/50 text-tactical-green focus:ring-tactical-green cursor-pointer accent-tactical-green"
                />
                <label htmlFor="useLog" className="text-gray-300 font-medium cursor-pointer select-none">Enable Server Logging (-log)</label>
             </div>

             <div className="flex items-center gap-3">
                <input 
                  type="checkbox"
                  id="useBattlEye"
                  checked={settings.launchParams?.useBattlEye ?? true}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    launchParams: {
                      ...(prev.launchParams || { useLog: true, useBattlEye: true, port: '7573', queryPort: '7779', maxPlayers: '100' }),
                      useBattlEye: e.target.checked
                    }
                  }))}
                  className="w-5 h-5 rounded border-military-600 bg-military-900/50 text-tactical-green focus:ring-tactical-green cursor-pointer accent-tactical-green"
                />
                <label htmlFor="useBattlEye" className="text-gray-300 font-medium cursor-pointer select-none">Enable BattlEye Anti-Cheat</label>
             </div>
          </div>
        </div>

        {/* Actions Section */}
        <div className="glass-panel p-8 rounded-xl border border-military-700 shadow-2xl bg-black/40">
          <h3 className="text-tactical-green font-bold text-lg mb-6 flex items-center gap-2">
            <SettingsIcon size={20} />
            Actions
          </h3>

          <div className="space-y-6">
            {/* Status Indicators */}
            <div className="flex flex-col md:flex-row gap-8 mb-8">
              <div className="flex items-center gap-3">
                <span className="text-tactical-green font-medium">SteamCMD:</span>
                <div className="flex items-center gap-2">
                  <div className={`w-5 h-5 rounded flex items-center justify-center border ${installStatus.steamCmdInstalled ? 'bg-tactical-green border-tactical-green' : 'border-red-500 bg-red-500/10'}`}>
                    {installStatus.steamCmdInstalled ? <CheckCircle size={14} className="text-black" /> : <XCircle size={14} className="text-red-500" />}
                  </div>
                  <span className={installStatus.steamCmdInstalled ? "text-white" : "text-gray-500"}>{installStatus.steamCmdInstalled ? "Installed" : "Missing"}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-tactical-green font-medium">Server:</span>
                <div className="flex items-center gap-2">
                  <div className={`w-5 h-5 rounded flex items-center justify-center border ${installStatus.serverInstalled ? 'bg-tactical-green border-tactical-green' : 'border-red-500 bg-red-500/10'}`}>
                    {installStatus.serverInstalled ? <CheckCircle size={14} className="text-black" /> : <XCircle size={14} className="text-red-500" />}
                  </div>
                  <span className={installStatus.serverInstalled ? "text-white" : "text-gray-500"}>{installStatus.serverInstalled ? "Installed" : "Missing"}</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <ActionButton 
                label="Install SteamCMD" 
                onClick={() => handleAction('installSteamCmd')}
                disabled={installStatus.steamCmdInstalled}
                variant="primary"
              />
              <ActionButton 
                label="Install Server" 
                onClick={() => handleAction('installServer')}
                disabled={!installStatus.steamCmdInstalled || installStatus.serverInstalled}
                variant="primary"
              />
              <ActionButton 
                label="Update Server" 
                onClick={() => handleAction('updateServer')}
                disabled={!installStatus.serverInstalled}
                variant="warning"
              />
              <ActionButton 
                label="Verify Files" 
                onClick={() => handleAction('verifyFiles')}
                disabled={!installStatus.serverInstalled}
                variant="danger"
              />
            </div>
          </div>
        </div>
        
        {/* Save Button (Bottom Right) */}
        <div className="flex justify-end pt-4">
           <button 
            onClick={handleSave}
            disabled={saveStatus === 'saving'}
            className="flex items-center gap-2 px-8 py-3 bg-tactical-green text-black font-bold rounded hover:bg-green-400 transition-all shadow-[0_0_15px_rgba(0,255,65,0.3)] disabled:opacity-50 uppercase tracking-wider"
          >
            <Save size={18} />
            {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Saved Successfully' : 'Save Configuration'}
          </button>
        </div>

      </div>
    </div>
  );
};

interface ActionButtonProps {
  label: string;
  onClick: () => void;
  disabled: boolean;
  variant: 'primary' | 'warning' | 'danger' | 'default';
}

const ActionButton = ({ label, onClick, disabled, variant }: ActionButtonProps) => {
  const getColors = () => {
    switch(variant) {
      case 'primary': return 'bg-tactical-green text-black hover:bg-green-400';
      case 'warning': return 'bg-transparent border-2 border-yellow-500 text-yellow-500 hover:bg-yellow-500 hover:text-black';
      case 'danger': return 'bg-transparent border-2 border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-black';
      default: return 'bg-gray-700 text-white';
    }
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        h-12 rounded-lg font-bold text-sm transition-all uppercase tracking-wide
        ${disabled 
          ? 'bg-military-800 text-gray-600 cursor-not-allowed border border-military-700' 
          : `${getColors()} shadow-lg`
        }
      `}
    >
      {label}
    </button>
  );
};
