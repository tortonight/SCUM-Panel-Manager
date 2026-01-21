import React, { useEffect, useState } from 'react';
import { Save, RefreshCw, Settings } from 'lucide-react';
import { clsx } from 'clsx';

export const ConfigManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState('server-config');
  const [config, setConfig] = useState<Record<string, Record<string, string | number>> | null>(null);
  const [loading, setLoading] = useState(false);

  // Mapping keys to Thai
  const THAI_LABELS: Record<string, string> = {
    'scum.ServerName': 'ชื่อเซิร์ฟเวอร์',
    'scum.ServerDescription': 'รายละเอียดเซิร์ฟเวอร์',
    'scum.ServerPassword': 'รหัสผ่านเข้าเซิร์ฟเวอร์',
    'scum.MaxPlayers': 'จำนวนผู้เล่นสูงสุด',
    'scum.ServerPlaystyle': 'รูปแบบการเล่น (PVP/PVE)',
    'scum.WelcomeMessage': 'ข้อความต้อนรับ',
    'scum.MessageOfTheDay': 'ข้อความประกาศประจำวัน'
  };

  useEffect(() => {
    if (activeTab === 'server-config') {
      loadConfig();
    }
  }, [activeTab]);

  const loadConfig = async () => {
    setLoading(true);
    const data = await window.electron.getConfig();
    setConfig(data);
    setLoading(false);
  };

  const handleSave = async () => {
    if (!config) return;
    setLoading(true);
    await window.electron.saveConfig(config);
    // Simulate delay
    setTimeout(() => setLoading(false), 500);
  };

  const handleChange = (section: string, key: string, value: string | number) => {
    setConfig((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        [section]: {
          ...prev[section],
          [key]: value
        }
      };
    });
  };

  return (
    <div className="p-6 h-full overflow-hidden flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-white mb-2">GAME CONFIG</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('server-config')}
              className={clsx(
                "px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2",
                activeTab === 'server-config' 
                  ? "bg-tactical-green text-white shadow-lg shadow-green-900/20" 
                  : "bg-military-700 text-gray-400 hover:text-white"
              )}
            >
              <Settings size={16} />
              Server Config
            </button>
            {/* Future tabs can be added here */}
          </div>
        </div>
        
        {activeTab === 'server-config' && (
          <div className="flex gap-2">
            <button 
              onClick={loadConfig}
              className="flex items-center gap-2 px-4 py-2 bg-military-700 text-white rounded hover:bg-military-600 transition-colors"
              title="Reload settings from server file"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              Load from Server
            </button>
            <button 
              onClick={handleSave}
              className="flex items-center gap-2 px-4 py-2 bg-tactical-green text-white rounded hover:bg-green-600 transition-colors shadow-lg shadow-green-900/20"
              title="Save settings to server file"
            >
              <Save size={16} />
              Save to Server
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto pr-2 space-y-6">
        {activeTab === 'server-config' && config ? (
          Object.keys(config).map((section) => (
            <div key={section} className="glass-panel p-6 rounded-xl border border-military-700">
              <h3 className="text-tactical-orange font-bold text-lg mb-4 border-b border-military-700 pb-2 uppercase">
                {section}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Object.keys(config[section]).map((key) => (
                  <div key={key} className="space-y-2">
                    <label className="text-xs text-gray-400 font-bold uppercase tracking-wider block">
                      {THAI_LABELS[key] || key.replace('scum.', '').replace(/([A-Z])/g, ' $1').trim()}
                    </label>
                    <input
                      type={typeof config[section][key] === 'number' ? 'number' : 'text'}
                      value={config[section][key]}
                      onChange={(e) => handleChange(section, key, e.target.type === 'number' ? parseFloat(e.target.value) : e.target.value)}
                      className="w-full bg-military-900/50 border border-military-600 rounded p-3 text-gray-200 focus:border-tactical-green focus:ring-1 focus:ring-tactical-green outline-none transition-all"
                    />
                  </div>
                ))}
              </div>
            </div>
          ))
        ) : activeTab === 'server-config' ? (
          <div className="text-center p-10 text-gray-400">Loading configuration...</div>
        ) : (
          <div className="text-center p-10 text-gray-400">Select a configuration tab</div>
        )}
      </div>
    </div>
  );
};
