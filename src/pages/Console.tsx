import React, { useEffect, useState, useRef } from 'react';
import { Send } from 'lucide-react';

export const Console: React.FC = () => {
  const [logs, setLogs] = useState<string[]>([]);
  const [input, setInput] = useState('');
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let isMounted = true;
    // Load history
    window.electron.getConsoleLogs().then((history) => {
      if (isMounted) setLogs(history);
    });

    window.electron.onConsoleLog((message) => {
      if (isMounted) setLogs(prev => [...prev, message]);
    });

    return () => {
      isMounted = false;
      window.electron.removeAllListeners('console-log');
    };
  }, []);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    await window.electron.sendCommand(input);
    setInput('');
  };

  return (
    <div className="flex flex-col h-full p-6">
      <div className="flex-1 glass-panel rounded-xl border border-military-700 overflow-hidden flex flex-col">
        <div className="bg-military-800 p-3 border-b border-military-700 flex justify-between items-center">
          <span className="text-xs text-gray-500">Live Console</span>
        </div>
        
        <div className="flex-1 p-4 overflow-y-auto font-mono text-sm space-y-1 bg-black/40">
          {logs.length === 0 && <div className="text-gray-600 italic">Waiting for logs...</div>}
          {logs.map((log, i) => {
             // Parse timestamp from backend message "[Time] Message"
             const match = log.match(/^\[(.*?)\] (.*)/);
             const time = match ? match[1] : '';
             const message = match ? match[2] : log;

             return (
              <div key={i} className="break-all text-gray-300 border-l-2 border-transparent hover:border-tactical-green pl-2 hover:bg-white/5">
                {time && <span className="text-military-500 text-xs mr-2">[{time}]</span>}
                {message}
              </div>
            );
          })}
          <div ref={logsEndRef} />
        </div>

        <form onSubmit={handleSubmit} className="p-4 bg-military-800 border-t border-military-700 flex gap-2">
          <span className="text-tactical-green font-bold pt-2">{'>'}</span>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 bg-transparent border-none text-white focus:ring-0 font-mono placeholder-gray-600"
            placeholder="Type command here (e.g., #ListPlayers, #GodMode true)..."
            autoFocus
          />
          <button 
            type="submit"
            className="p-2 bg-tactical-green text-white rounded hover:bg-green-600 transition-colors"
          >
            <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  );
};
