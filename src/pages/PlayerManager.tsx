import React, { useState, useEffect } from 'react';
import { Search, ShieldBan, UserX, MessageSquare, RefreshCw, Users, List, Plus, Trash2, ShieldCheck, FileCog } from 'lucide-react';
import { clsx } from 'clsx';
import type { OnlinePlayer as Player } from '../types/electron';

type TabType = 'online' | 'whitelist' | 'banned' | 'admin' | 'server-settings-admin';

export const PlayerManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('online');
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Lists Data
  const [whitelist, setWhitelist] = useState<string[]>([]);
  const [bannedUsers, setBannedUsers] = useState<string[]>([]);
  const [adminUsers, setAdminUsers] = useState<string[]>([]);
  const [serverSettingsAdminUsers, setServerSettingsAdminUsers] = useState<string[]>([]);
  const [newId, setNewId] = useState('');

  // Real Data
  const [players, setPlayers] = useState<Player[]>([]);
  const [rconStatus, setRconStatus] = useState<'connected' | 'disconnected' | 'connecting' | 'idle'>('idle');

  useEffect(() => {
    if (activeTab === 'online') loadOnlinePlayers();
    if (activeTab === 'whitelist') loadWhitelist();
    if (activeTab === 'banned') loadBannedUsers();
    if (activeTab === 'admin') loadAdminUsers();
    if (activeTab === 'server-settings-admin') loadServerSettingsAdminUsers();
  }, [activeTab]);

  const loadOnlinePlayers = async () => {
    setLoading(true);
    setRconStatus('connecting');
    try {
      const list = await window.electron.getOnlinePlayers();
      if (list === null) {
          setRconStatus('disconnected');
          setPlayers([]);
      } else {
          setPlayers(list as Player[]);
          setRconStatus('connected');
      }
    } catch (error) {
      console.error('Failed to load players', error);
      setRconStatus('disconnected');
    }
    setLoading(false);
  };

  const loadWhitelist = async () => {
      setLoading(true);
      const list = await window.electron.getWhitelist();
      setWhitelist(list);
      setLoading(false);
  };

  const loadBannedUsers = async () => {
      setLoading(true);
      const list = await window.electron.getBannedUsers();
      setBannedUsers(list);
      setLoading(false);
  };

  const loadAdminUsers = async () => {
      setLoading(true);
      const list = await window.electron.getAdminUsers();
      setAdminUsers(list);
      setLoading(false);
  };

  const loadServerSettingsAdminUsers = async () => {
      setLoading(true);
      const list = await window.electron.getServerSettingsAdminUsers();
      setServerSettingsAdminUsers(list);
      setLoading(false);
  };

  const handleAddToList = async () => {
      if (!newId.trim()) return;
      
      setLoading(true);
      let updatedList: string[] = [];
      if (activeTab === 'whitelist') {
          updatedList = [...whitelist, newId.trim()];
          await window.electron.saveWhitelist(updatedList);
          setWhitelist(updatedList);
      } else if (activeTab === 'banned') {
          updatedList = [...bannedUsers, newId.trim()];
          await window.electron.saveBannedUsers(updatedList);
          setBannedUsers(updatedList);
      } else if (activeTab === 'admin') {
          updatedList = [...adminUsers, newId.trim()];
          await window.electron.saveAdminUsers(updatedList);
          setAdminUsers(updatedList);
      } else if (activeTab === 'server-settings-admin') {
          updatedList = [...serverSettingsAdminUsers, newId.trim()];
          await window.electron.saveServerSettingsAdminUsers(updatedList);
          setServerSettingsAdminUsers(updatedList);
      }
      setNewId('');
      setLoading(false);
  };

  const handleRemoveFromList = async (id: string) => {
      if (!confirm(`Remove ${id} from list?`)) return;

      setLoading(true);
      let updatedList: string[] = [];
      if (activeTab === 'whitelist') {
          updatedList = whitelist.filter(item => item !== id);
          await window.electron.saveWhitelist(updatedList);
          setWhitelist(updatedList);
      } else if (activeTab === 'banned') {
          updatedList = bannedUsers.filter(item => item !== id);
          await window.electron.saveBannedUsers(updatedList);
          setBannedUsers(updatedList);
      } else if (activeTab === 'admin') {
          updatedList = adminUsers.filter(item => item !== id);
          await window.electron.saveAdminUsers(updatedList);
          setAdminUsers(updatedList);
      } else if (activeTab === 'server-settings-admin') {
          updatedList = serverSettingsAdminUsers.filter(item => item !== id);
          await window.electron.saveServerSettingsAdminUsers(updatedList);
          setServerSettingsAdminUsers(updatedList);
      }
      setLoading(false);
  };

  const handleRefresh = () => {
    if (activeTab === 'online') {
        loadOnlinePlayers();
    } else if (activeTab === 'whitelist') {
        loadWhitelist();
    } else if (activeTab === 'banned') {
        loadBannedUsers();
    } else if (activeTab === 'admin') {
        loadAdminUsers();
    } else if (activeTab === 'server-settings-admin') {
        loadServerSettingsAdminUsers();
    }
  };

  const handleKick = (player: Player) => {
    if (confirm(`Are you sure you want to KICK ${player.name}?`)) {
      // Implement Kick IPC if needed, for now Ban covers removal
      console.log('Kick feature pending', player.name);
    }
  };

  const handleBan = async (player: Player) => {
    if (confirm(`Are you sure you want to BAN ${player.name}? This will kick them and add them to BannedUsers.ini.`)) {
      setLoading(true);
      const result = await window.electron.banOnlinePlayer(player.steamId);
      if (result.success) {
          // Remove from local list immediately
          setPlayers(prev => prev.filter(p => p.steamId !== player.steamId));
          alert(`Banned ${player.name} successfully.`);
      } else {
          alert(`Failed to ban: ${result.message}`);
      }
      setLoading(false);
    }
  };

  const filteredPlayers = players.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.steamId.includes(searchTerm)
  );
  
  const filteredList = (() => {
      let list: string[] = [];
      if (activeTab === 'whitelist') list = whitelist;
      else if (activeTab === 'banned') list = bannedUsers;
      else if (activeTab === 'admin') list = adminUsers;
      else if (activeTab === 'server-settings-admin') list = serverSettingsAdminUsers;
      
      return list.filter(id => id.includes(searchTerm));
  })();

  return (
    <div className="p-6 h-full overflow-hidden flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Users className="text-tactical-orange" />
                PLAYER MANAGER
            </h2>
            <p className="text-xs text-gray-400 mt-1">Manage online players, whitelist, banned users, and admins.</p>
        </div>
        <div className="flex gap-2">
          {activeTab === 'online' && (
            <div className="relative">
                <input 
                    type="text" 
                    placeholder="Search Player / SteamID..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-military-800 border border-military-700 text-white pl-10 pr-4 py-2 rounded focus:outline-none focus:border-tactical-orange w-64"
                />
                <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
            </div>
          )}
          <button 
            onClick={handleRefresh}
            className="flex items-center gap-2 px-4 py-2 bg-military-700 text-white rounded hover:bg-military-600 transition-colors"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4 border-b border-military-700 pb-1 overflow-x-auto">
          <button 
            onClick={() => setActiveTab('online')}
            className={clsx(
                "px-4 py-2 rounded-t-lg text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap",
                activeTab === 'online' ? "bg-military-700 text-white border-b-2 border-tactical-green" : "text-gray-400 hover:text-gray-200"
            )}
          >
              <Users size={16} /> Online Players
          </button>
          <button 
            onClick={() => setActiveTab('whitelist')}
            className={clsx(
                "px-4 py-2 rounded-t-lg text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap",
                activeTab === 'whitelist' ? "bg-military-700 text-white border-b-2 border-blue-500" : "text-gray-400 hover:text-gray-200"
            )}
          >
              <List size={16} /> Whitelist
          </button>
          <button 
            onClick={() => setActiveTab('banned')}
            className={clsx(
                "px-4 py-2 rounded-t-lg text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap",
                activeTab === 'banned' ? "bg-military-700 text-white border-b-2 border-red-500" : "text-gray-400 hover:text-gray-200"
            )}
          >
              <ShieldBan size={16} /> Banned Users
          </button>
          <button 
            onClick={() => setActiveTab('admin')}
            className={clsx(
                "px-4 py-2 rounded-t-lg text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap",
                activeTab === 'admin' ? "bg-military-700 text-white border-b-2 border-purple-500" : "text-gray-400 hover:text-gray-200"
            )}
          >
              <ShieldCheck size={16} /> Admins
          </button>
          <button 
            onClick={() => setActiveTab('server-settings-admin')}
            className={clsx(
                "px-4 py-2 rounded-t-lg text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap",
                activeTab === 'server-settings-admin' ? "bg-military-700 text-white border-b-2 border-orange-500" : "text-gray-400 hover:text-gray-200"
            )}
          >
              <FileCog size={16} /> Settings Admins
          </button>
      </div>

      <div className="glass-panel rounded-xl border border-military-700 overflow-hidden flex-1 flex flex-col">
        {activeTab === 'online' ? (
            // Online Players Table
            <>
                <div className="overflow-auto flex-1">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-military-800 text-gray-400 text-xs uppercase sticky top-0">
                            <tr>
                                <th className="p-4 font-bold tracking-wider">Player Name</th>
                                <th className="p-4 font-bold tracking-wider">Steam ID</th>
                                <th className="p-4 font-bold tracking-wider">IP Address</th>
                                <th className="p-4 font-bold tracking-wider">Ping</th>
                                <th className="p-4 font-bold tracking-wider">Playtime</th>
                                <th className="p-4 font-bold tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-military-700 text-sm text-gray-300">
                            {filteredPlayers.length > 0 ? (
                                filteredPlayers.map((player) => (
                                    <tr key={player.id} className="hover:bg-military-800/50 transition-colors">
                                        <td className="p-4 font-medium text-white">{player.name}</td>
                                        <td className="p-4 font-mono text-xs text-gray-400">{player.steamId}</td>
                                        <td className="p-4 font-mono text-xs text-gray-400">{player.ip}</td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded text-xs font-bold ${
                                                player.ping < 50 ? 'bg-green-900/30 text-green-400' :
                                                player.ping < 100 ? 'bg-yellow-900/30 text-yellow-400' :
                                                'bg-red-900/30 text-red-400'
                                            }`}>
                                                {player.ping} ms
                                            </span>
                                        </td>
                                        <td className="p-4 text-gray-400">{player.playtime}</td>
                                        <td className="p-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button 
                                                    className="p-2 hover:bg-blue-900/30 text-blue-400 rounded transition-colors"
                                                    title="Message Player"
                                                >
                                                    <MessageSquare size={16} />
                                                </button>
                                                <button 
                                                    onClick={() => handleKick(player)}
                                                    className="p-2 hover:bg-yellow-900/30 text-yellow-400 rounded transition-colors"
                                                    title="Kick Player"
                                                >
                                                    <UserX size={16} />
                                                </button>
                                                <button 
                                                    onClick={() => handleBan(player)}
                                                    className="p-2 hover:bg-red-900/30 text-red-400 rounded transition-colors"
                                                    title="Ban Player"
                                                >
                                                    <ShieldBan size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-gray-500">
                                        No players found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                <div className="bg-military-800 p-3 text-xs text-gray-500 border-t border-military-700 flex justify-between">
                    <span>Total Players: {filteredPlayers.length}</span>
                    <span>
                        RCON Status: {' '}
                        {rconStatus === 'connected' ? (
                            <span className="text-green-500">Connected</span>
                        ) : rconStatus === 'disconnected' ? (
                            <span className="text-red-500">Disconnected</span>
                        ) : rconStatus === 'connecting' ? (
                            <span className="text-yellow-500">Connecting...</span>
                        ) : (
                            <span className="text-gray-500">Unknown</span>
                        )}
                    </span>
                </div>
            </>
        ) : (
            // Whitelist / Banned List View
            <div className="flex flex-col h-full">
                <div className="p-4 bg-military-800/50 border-b border-military-700 flex gap-2">
                    <input 
                        type="text" 
                        placeholder="Enter SteamID to add..." 
                        value={newId}
                        onChange={(e) => setNewId(e.target.value)}
                        className="flex-1 bg-military-900 border border-military-600 text-white px-4 py-2 rounded focus:outline-none focus:border-tactical-green"
                    />
                    <button 
                        onClick={handleAddToList}
                        disabled={!newId.trim()}
                        className="flex items-center gap-2 px-6 py-2 bg-tactical-green text-white rounded hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Plus size={16} />
                        Add ID
                    </button>
                </div>
                
                <div className="overflow-auto flex-1 p-4">
                    <div className="space-y-2">
                        {filteredList.length > 0 ? (
                            filteredList.map((id, index) => (
                                <div key={index} className="flex justify-between items-center p-3 bg-military-800 border border-military-700 rounded hover:border-gray-500 transition-colors">
                                    <span className="font-mono text-gray-300">{id}</span>
                                    <button 
                                        onClick={() => handleRemoveFromList(id)}
                                        className="text-red-400 hover:text-red-300 p-2 hover:bg-red-900/20 rounded"
                                        title="Remove ID"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))
                        ) : (
                            <div className="text-center text-gray-500 py-8">
                                List is empty.
                            </div>
                        )}
                    </div>
                </div>
                
                <div className="bg-military-800 p-3 text-xs text-gray-500 border-t border-military-700">
                    Total Entries: {filteredList.length}
                </div>
            </div>
        )}
      </div>
    </div>
  );
};
