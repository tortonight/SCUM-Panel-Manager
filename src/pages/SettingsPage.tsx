import React, { useState, useEffect } from 'react';
import { Save, Folder, CheckCircle, XCircle, Settings as SettingsIcon, RotateCcw, Sparkles } from 'lucide-react';
import type { AppSettings } from '../types/electron';

// Helper Component for Path Input
interface PathInputProps {
  label: string;
  description: string;
  value?: string;
  placeholder?: string;
  required?: boolean;
  onBrowse: () => void;
  status?: 'found' | 'not-found' | 'optional';
}

const PathInput: React.FC<PathInputProps> = ({ label, description, value, placeholder, required, onBrowse, status }) => {
  return (
    <div className="grid grid-cols-12 gap-4 items-center border-b border-military-700/50 pb-6 last:border-0 last:pb-0">
      <div className="col-span-12 md:col-span-3">
        <label className="text-white font-bold block">{label}</label>
        <span className="text-xs text-gray-400 block mt-1">{description}</span>
        <div className="mt-2">
            {status === 'found' && (
                <span className="text-xs text-tactical-green flex items-center gap-1 font-bold uppercase tracking-wider">
                   <CheckCircle size={12} /> Found
                </span>
            )}
            {status === 'not-found' && required && (
                <span className="text-xs text-red-500 flex items-center gap-1 font-bold uppercase tracking-wider">
                   <XCircle size={12} /> Required - Not found
                </span>
            )}
            {status === 'optional' && (
                <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">
                   Optional
                </span>
            )}
        </div>
      </div>
      
      <div className="col-span-12 md:col-span-7">
        <input
          type="text"
          value={value || ''}
          readOnly
          className="w-full bg-military-900/50 border border-military-600 rounded-lg p-3 text-gray-200 focus:border-tactical-green outline-none transition-all font-mono text-sm"
          placeholder={placeholder || "Select Folder"}
        />
      </div>
      
      <div className="col-span-12 md:col-span-2">
        <button
          onClick={onBrowse}
          className="w-full py-3 bg-transparent border border-military-600 text-gray-300 hover:border-tactical-green hover:text-tactical-green rounded-lg font-medium transition-all text-sm"
        >
          Select Folder
        </button>
      </div>
    </div>
  );
};

export const SettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<AppSettings>({
    steamCmdPath: '',
    gamePath: '',
    serverFolder: '',
    configFolder: '',
    logFolder: '',
    backupFolder: ''
  });
  
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [installStatus, setInstallStatus] = useState({
    steamCmdInstalled: false,
    serverInstalled: false
  });

  useEffect(() => {
    loadSettings();
  }, []);

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
    }
  };
  
  const handleAutoDetect = async () => {
      const result = await window.electron.detectServerPaths();
      if (result.success && result.paths) {
          setSettings(prev => ({ ...prev, ...result.paths }));
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
      setSaveStatus('idle');
    }
  };
  
  // Action handlers...
  const handleAction = async (action: 'installSteamCmd' | 'installServer' | 'updateServer' | 'verifyFiles') => {
    switch(action) {
        case 'installSteamCmd': await window.electron.installSteamCmd(); break;
        case 'installServer': await window.electron.installServer(); break;
        case 'updateServer': await window.electron.updateServer(); break;
        case 'verifyFiles': await window.electron.verifyServerFiles(); break;
    }
  };

  // Helper to determine status
  const getStatus = (val: string | undefined, required: boolean) => {
      if (val && val.length > 0) return 'found'; 
      if (required) return 'not-found';
      return 'optional';
  };
  
  const allRequiredFound = settings.gamePath && settings.serverFolder && settings.configFolder && settings.logFolder && settings.steamCmdPath;

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

      <div className="flex-1 overflow-y-auto space-y-8 pr-2">
        
        {/* Configure Folders Section */}
        <div className="glass-panel p-8 rounded-xl border border-military-700 shadow-2xl bg-black/40">
          <div className="flex flex-col md:flex-row justify-between items-start mb-8 gap-4">
              <div>
                  <h3 className="text-tactical-green font-bold text-lg flex items-center gap-2">
                      <Folder size={20} />
                      Configure Folders
                  </h3>
                  <p className="text-gray-400 text-sm mt-1 max-w-xl">
                      Configure the paths of the essential folders for the SCUM server to function.
                  </p>
              </div>
              
              {allRequiredFound ? (
                  <div className="px-4 py-3 bg-tactical-green/10 border border-tactical-green/30 rounded-lg flex items-center gap-3 text-tactical-green shadow-[0_0_15px_rgba(0,255,150,0.1)]">
                      <div className="bg-tactical-green text-black rounded-full p-1">
                        <CheckCircle size={16} strokeWidth={3} />
                      </div>
                      <span className="font-bold tracking-wide">Configuration Complete</span>
                  </div>
              ) : (
                  <div className="px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-3 text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.1)]">
                      <XCircle size={20} strokeWidth={2} />
                      <div className="flex flex-col">
                        <span className="font-bold">Missing Requirements</span>
                        <span className="text-xs opacity-80">Some required folders were not found.</span>
                      </div>
                  </div>
              )}
          </div>

          {/* Action Bar */}
          <div className="flex flex-wrap gap-4 mb-8 bg-military-900/30 p-4 rounded-lg border border-military-700/50">
              <button onClick={handleAutoDetect} className="flex items-center gap-2 px-4 py-2 bg-blue-600/20 text-blue-400 border border-blue-500/50 hover:bg-blue-600/40 rounded transition-all font-medium text-sm">
                  <Sparkles size={16} /> Automatic Detection
              </button>
              <button onClick={loadSettings} className="flex items-center gap-2 px-4 py-2 bg-gray-700/30 text-gray-300 border border-gray-600 hover:bg-gray-700/50 rounded transition-all font-medium text-sm">
                  <RotateCcw size={16} /> Reload
              </button>
              <div className="flex-1"></div>
              <button 
                onClick={handleSave} 
                disabled={saveStatus === 'saving'}
                className="flex items-center gap-2 px-6 py-2 bg-tactical-green text-black font-bold hover:bg-green-400 rounded transition-all text-sm disabled:opacity-50"
              >
                  {saveStatus === 'saving' ? <RotateCcw className="animate-spin" size={16} /> : <Save size={16} />} 
                  {saveStatus === 'saved' ? 'Saved!' : 'Save Configuration'}
              </button>
          </div>

          <div className="space-y-6">
              {/* Server Folder */}
              <PathInput 
                  label="Server Folder"
                  description="Folder where SCUMServer.exe is located"
                  required={true}
                  status={getStatus(settings.serverFolder, true)}
                  value={settings.serverFolder}
                  onBrowse={() => handleBrowse('serverFolder')}
              />
              
              {/* Installation Folder */}
              <PathInput 
                  label="Installation Folder"
                  description="SCUM installation root folder"
                  required={true}
                  status={getStatus(settings.gamePath, true)}
                  value={settings.gamePath}
                  onBrowse={() => handleBrowse('gamePath')}
              />
              
              {/* Configuration Folder */}
              <PathInput 
                  label="Configuration Folder (.ini)"
                  description="Folder with the ServerSettings.ini, GameUserSettings.ini, etc. files"
                  required={true}
                  status={getStatus(settings.configFolder, true)}
                  value={settings.configFolder}
                  onBrowse={() => handleBrowse('configFolder')}
              />
              
              {/* Log Folder */}
              <PathInput 
                  label="Log Folder"
                  description="Folder where server logs are stored"
                  required={true}
                  status={getStatus(settings.logFolder, true)}
                  value={settings.logFolder}
                  onBrowse={() => handleBrowse('logFolder')}
              />
              
              {/* SteamCMD Folder */}
              <PathInput 
                  label="SteamCMD Folder"
                  description="Folder where steamcmd.exe is located for updates"
                  required={true}
                  status={getStatus(settings.steamCmdPath, true)}
                  value={settings.steamCmdPath}
                  onBrowse={() => handleBrowse('steamCmdPath')}
              />
              
              {/* Backup Folder */}
              <PathInput 
                  label="Backup Folder"
                  description="Folder for storing automatic backups"
                  required={false}
                  status={getStatus(settings.backupFolder, false)} // Optional
                  value={settings.backupFolder}
                  onBrowse={() => handleBrowse('backupFolder')}
              />
          </div>

          {/* Info Section */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-military-900/40 p-4 rounded border border-military-700/50">
                  <h4 className="text-white font-bold mb-1 text-sm flex items-center gap-2"><CheckCircle size={14} className="text-tactical-green"/> Required Folders</h4>
                  <p className="text-gray-400 text-xs">Necessary for basic server operation</p>
              </div>
              <div className="bg-military-900/40 p-4 rounded border border-military-700/50">
                  <h4 className="text-white font-bold mb-1 text-sm flex items-center gap-2"><Folder size={14} className="text-gray-400"/> Optional Folders</h4>
                  <p className="text-gray-400 text-xs">Improve the experience but are not essential</p>
              </div>
               <div className="bg-military-900/40 p-4 rounded border border-military-700/50">
                  <h4 className="text-white font-bold mb-1 text-sm flex items-center gap-2"><Sparkles size={14} className="text-blue-400"/> Automatic Detection</h4>
                  <p className="text-gray-400 text-xs">Automatically attempts to find folders in common locations</p>
              </div>
          </div>
        </div>

        {/* Launch Parameters Section (Existing but styled to match) */}
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
    </div>
  );
};

// Helper Components
interface ActionButtonProps {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  variant: 'primary' | 'warning' | 'danger';
}

const ActionButton: React.FC<ActionButtonProps> = ({ label, onClick, disabled, variant }) => {
  const getStyles = () => {
    switch (variant) {
      case 'primary': return "border-tactical-green text-tactical-green hover:bg-tactical-green hover:text-black";
      case 'warning': return "border-yellow-500 text-yellow-500 hover:bg-yellow-500 hover:text-black";
      case 'danger': return "border-red-500 text-red-500 hover:bg-red-500 hover:text-white";
    }
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        w-full py-4 border-2 rounded-lg font-bold uppercase tracking-wide transition-all
        ${disabled ? 'opacity-30 cursor-not-allowed border-gray-600 text-gray-600' : getStyles()}
      `}
    >
      {label}
    </button>
  );
};
