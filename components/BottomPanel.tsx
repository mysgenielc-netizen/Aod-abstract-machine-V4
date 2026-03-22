'use client';

import { useAod } from '@/lib/AodContext';
import { Terminal } from 'lucide-react';

export default function BottomPanel() {
  const { packets } = useAod();
  const streamRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (streamRef.current) {
      streamRef.current.scrollTop = streamRef.current.scrollHeight;
    }
  }, [packets]);

  return (
    <div className="h-48 border-t border-[#333] bg-[#050505] flex flex-col">
      <div className="h-6 border-b border-[#333] flex items-center px-4 bg-[#111]">
        <Terminal size={12} className="text-[#888] mr-2" />
        <span className="text-[10px] font-bold uppercase tracking-widest text-[#888]">Packet Execution Stream</span>
      </div>
      <div ref={streamRef} className="flex-1 overflow-y-auto p-2 font-mono text-[10px] space-y-1">
        {packets.map((p, i) => {
          let color = 'text-[#888]';
          if (p.result === 'ok') color = 'text-[#00FF00]';
          if (p.result === 'error') color = 'text-[#FF4444]';
          if (p.result === 'system') color = 'text-[#F27D26]';
          if (p.result === 'ai') color = 'text-[#00FFFF]';
          if (p.result === 'evolve') color = 'text-[#FF00FF]';
          if (p.result === 'governance') color = 'text-[#FFFF00]';

          return (
            <div key={i} className="flex gap-4 hover:bg-[#111] px-2 py-0.5">
              <span className="text-[#555] w-12 text-right">[{p.tau.toString().padStart(4, '0')}]</span>
              <span className={`w-24 font-bold ${color}`}>{p.opCode}</span>
              <span className="text-[#444] w-16 truncate" title={p.hash}>{p.hash ? p.hash.substring(0, 8) : '—'}</span>
              <span className="text-[#ccc] flex-1">{p.message}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
