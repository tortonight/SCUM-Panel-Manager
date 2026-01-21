import React, { useEffect, useState } from 'react';
import { Archive, RotateCcw, Trash2, Save } from 'lucide-react';
import type { BackupItem } from '../types/electron';

export const BackupManager: React.FC = () => {
  const [backups, setBackups] = useState<BackupItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [restoring, setRestoring] = useState<string | null>(null);

  useEffect(() => {
    loadBackups();
  }, []);

  const loadBackups = async () => {
    setLoading(true);
    const list = await window.electron.getBackups();
    setBackups(list);
    setLoading(false);
  };

  const handleCreateBackup = async () => {
    setCreating(true);
    await window.electron.triggerBackup();
    await loadBackups();
    setCreating(false);
  };

  const handleRestore = async (filename: string) => {
    if (!confirm(`Are you sure you want to restore "${filename}"?\nCurrent progress will be moved to a backup folder. Server will restart.`)) {
        return;
    }

    setRestoring(filename);
    const result = await window.electron.restoreBackup(filename);
    if (result.success) {
        alert('Restore successful!');
    } else {
        alert('Restore failed: ' + result.message);
    }
    setRestoring(null);
  };

  const handleDelete = async (filename: string) => {
    if (!confirm(`Delete backup "${filename}"?`)) return;

    await window.electron.deleteBackup(filename);
    loadBackups();
  };

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Archive className="text-tactical-green" />
            BACKUP MANAGER
            </h2>
            <p className="text-sm text-gray-400 mt-1">Create and restore server backups.</p>
        </div>
        
        <button 
          onClick={handleCreateBackup}
          disabled={creating}
          className="flex items-center gap-2 px-4 py-2 bg-tactical-green text-white rounded hover:bg-green-600 transition-colors shadow-lg shadow-green-900/20 disabled:opacity-50"
        >
          <Save size={16} className={creating ? 'animate-spin' : ''} />
          {creating ? 'Creating Backup...' : 'Create New Backup'}
        </button>
      </div>

      <div className="flex-1 glass-panel rounded-xl border border-military-700 overflow-hidden flex flex-col">
        <div className="p-4 bg-military-800 border-b border-military-700 grid grid-cols-12 text-xs font-bold text-gray-400 uppercase tracking-wider">
            <div className="col-span-6">Filename</div>
            <div className="col-span-2">Date</div>
            <div className="col-span-2">Size</div>
            <div className="col-span-2 text-right">Actions</div>
        </div>

        <div className="flex-1 overflow-y-auto">
            {loading ? (
                <div className="p-8 text-center text-gray-500">Loading backups...</div>
            ) : backups.length === 0 ? (
                <div className="p-8 text-center text-gray-500 italic">No backups found.</div>
            ) : (
                backups.map((backup) => (
                    <div key={backup.filename} className="p-4 border-b border-military-700/50 hover:bg-white/5 grid grid-cols-12 items-center text-sm text-gray-300">
                        <div className="col-span-6 flex items-center gap-3">
                            <Archive size={16} className="text-military-500" />
                            <span className="font-mono">{backup.filename}</span>
                        </div>
                        <div className="col-span-2">{backup.date}</div>
                        <div className="col-span-2">{backup.size}</div>
                        <div className="col-span-2 flex justify-end gap-2">
                            <button
                                onClick={() => handleRestore(backup.filename)}
                                disabled={restoring !== null}
                                className="p-2 hover:bg-blue-500/20 text-blue-400 rounded transition-colors"
                                title="Restore this backup"
                            >
                                <RotateCcw size={16} className={restoring === backup.filename ? 'animate-spin' : ''} />
                            </button>
                            <button
                                onClick={() => handleDelete(backup.filename)}
                                disabled={restoring !== null}
                                className="p-2 hover:bg-red-500/20 text-red-400 rounded transition-colors"
                                title="Delete backup"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </div>
                ))
            )}
        </div>
      </div>
    </div>
  );
};
