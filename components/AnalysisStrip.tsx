'use client';

import { useAod } from '@/lib/AodContext';
import { ShieldCheck, Activity } from 'lucide-react';

export default function AnalysisStrip() {
  const { machine, eta } = useAod();
  const topology = machine.computeTopology();
  const bottlenecks = machine.getBottlenecks();
  const currentBottleneck = bottlenecks.length > 0 ? bottlenecks[0].id : 'None';

  return (
    <div className="h-8 border-t border-[#333] bg-[#0a0a0a] flex items-center px-4 text-[10px] uppercase font-bold tracking-wider text-[#888] justify-between">
      <div className="flex gap-6">
        <span className="flex items-center gap-1">
          <span className="text-[#555]">β₀</span> <span className="text-[#00FF00]">{topology.b0}</span>
        </span>
        <span className="flex items-center gap-1">
          <span className="text-[#555]">β₁</span> <span className="text-[#00FF00]">{topology.b1}</span>
        </span>
        <span className="flex items-center gap-1">
          <span className="text-[#555]">χ</span> <span className="text-[#00FF00]">{topology.chi}</span>
        </span>
        <span className="flex items-center gap-1">
          <span className="text-[#555]">Risk</span> <span className="text-[#FF4444]">{topology.riskScore.toFixed(2)}</span>
        </span>
        <span className="flex items-center gap-1">
          <span className="text-[#555]">Bottleneck</span> <span className="text-[#F27D26]">{currentBottleneck}</span>
        </span>
      </div>
      <div className="flex gap-6">
        <span className="flex items-center gap-1 text-[#00FF00]">
          <ShieldCheck size={12} /> Gov Active
        </span>
        <span className="flex items-center gap-1 text-[#00FF00]">
          <Activity size={12} /> DCC Verified
        </span>
      </div>
    </div>
  );
}
