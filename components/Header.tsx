'use client';

import { useAod } from '@/lib/AodContext';
import { Play, Pause, RefreshCw, Download, Upload, Trash2 } from 'lucide-react';

export default function Header() {
  const { 
    tau, stateRoot, packets, mmr, eta, 
    isAuto, setIsAuto, isEvolve, setIsEvolve,
    tickInterval, setTickInterval, reset, exportLog, importLog
  } = useAod();

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (Array.isArray(json)) {
          await importLog(json);
        }
      } catch (err) {
        console.error("Failed to parse log file", err);
      }
    };
    reader.readAsText(file);
  };

  return (
    <header className="h-12 border-b border-[#333] flex items-center justify-between px-4 bg-[#0a0a0a]">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <span className="text-[#888] text-xs uppercase tracking-wider">Lamport τ</span>
          <span className="font-bold text-[#F27D26]">{tau}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[#888] text-xs uppercase tracking-wider">State Root</span>
          <span className="text-[#00FF00] font-mono text-xs truncate w-32" title={stateRoot}>
            {stateRoot ? stateRoot.substring(0, 16) + '...' : '—'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[#888] text-xs uppercase tracking-wider">Packets</span>
          <span>{packets.length}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[#888] text-xs uppercase tracking-wider">MMR</span>
          <span>{mmr.length}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[#888] text-xs uppercase tracking-wider">η</span>
          <span className={eta >= 0.40 && eta <= 0.44 ? "text-[#00FF00]" : "text-[#F27D26]"}>
            {eta.toFixed(4)}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button 
          onClick={() => setIsEvolve(!isEvolve)}
          className={`px-3 py-1 text-xs font-bold uppercase tracking-wider border flex items-center gap-1 transition-colors ${
            isEvolve 
              ? 'bg-[#F27D26] text-black border-[#F27D26]' 
              : 'border-[#333] text-[#888] hover:border-[#F27D26] hover:text-[#F27D26]'
          }`}
        >
          <RefreshCw size={14} className={isEvolve ? "animate-spin" : ""} />
          AI Evolve
        </button>

        <button 
          onClick={() => setIsAuto(!isAuto)}
          className={`px-3 py-1 text-xs font-bold uppercase tracking-wider border flex items-center gap-1 transition-colors ${
            isAuto 
              ? 'bg-[#00FF00] text-black border-[#00FF00]' 
              : 'border-[#333] text-[#888] hover:border-[#00FF00] hover:text-[#00FF00]'
          }`}
        >
          {isAuto ? <Pause size={14} /> : <Play size={14} />}
          Auto
        </button>

        <div className="flex items-center gap-2">
          <span className="text-[#888] text-xs">Tick (ms)</span>
          <input 
            type="number" 
            value={tickInterval}
            onChange={(e) => setTickInterval(Number(e.target.value))}
            className="w-16 bg-[#111] border border-[#333] text-center text-xs py-1 outline-none focus:border-[#F27D26]"
          />
        </div>

        <div className="h-6 w-px bg-[#333] mx-2"></div>

        <button onClick={exportLog} className="text-[#888] hover:text-white transition-colors" title="Export Log">
          <Download size={16} />
        </button>
        <label className="text-[#888] hover:text-white transition-colors cursor-pointer" title="Import Log">
          <Upload size={16} />
          <input type="file" accept=".json" className="hidden" onChange={handleImport} />
        </label>
        <button onClick={reset} className="text-[#888] hover:text-red-500 transition-colors" title="Reset State">
          <Trash2 size={16} />
        </button>
      </div>
    </header>
  );
}
