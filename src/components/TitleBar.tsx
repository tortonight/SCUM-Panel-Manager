import React from 'react';
import { Minus, Square, X } from 'lucide-react';

export const TitleBar: React.FC = () => {
  return (
    <div className="h-8 bg-military-900 flex items-center justify-between select-none draggable border-b border-military-700">
      <div className="px-4 text-xs font-bold text-tactical-green tracking-widest">
        SCUM MANAGER <span className="text-military-500">v1.0</span>
      </div>
      <div className="flex h-full no-drag">
        <button 
          onClick={() => window.electron.minimize()}
          className="w-10 h-full flex items-center justify-center hover:bg-military-700 text-gray-400 hover:text-white transition-colors"
        >
          <Minus size={14} />
        </button>
        <button 
          onClick={() => window.electron.maximize()}
          className="w-10 h-full flex items-center justify-center hover:bg-military-700 text-gray-400 hover:text-white transition-colors"
        >
          <Square size={12} />
        </button>
        <button 
          onClick={() => window.electron.close()}
          className="w-10 h-full flex items-center justify-center hover:bg-red-600 text-gray-400 hover:text-white transition-colors"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
};
