'use client';

import { useState, useRef, useEffect } from 'react';
import { useAod } from '@/lib/AodContext';
import { Activity, ShieldAlert, Cpu, Network } from 'lucide-react';
import { MmrEntry } from '@/lib/aod';

function MmrCanvas({ mmr }: { mmr: MmrEntry[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, cv.width, cv.height);
    if (mmr.length === 0) return;

    const maxNodes = 20;
    const displayMmr = mmr.slice(-maxNodes);
    
    const w = cv.width;
    const h = cv.height;
    const step = w / maxNodes;
    
    ctx.strokeStyle = '#333';
    ctx.beginPath();
    ctx.moveTo(0, h - 20);
    ctx.lineTo(w, h - 20);
    ctx.stroke();

    displayMmr.forEach((m, i) => {
      const x = i * step + step / 2;
      const y = h - 20;
      
      // Draw peak
      const peakHeight = 10 + (m.pos % 3) * 15; // Pseudo-height based on position
      
      ctx.strokeStyle = '#00FF00';
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x, y - peakHeight);
      ctx.stroke();
      
      ctx.fillStyle = '#00FF00';
      ctx.beginPath();
      ctx.arc(x, y - peakHeight, 2, 0, Math.PI * 2);
      ctx.fill();
      
      // Connect to previous
      if (i > 0) {
        const prevX = (i - 1) * step + step / 2;
        const prevPeakHeight = 10 + (displayMmr[i - 1].pos % 3) * 15;
        ctx.strokeStyle = '#333';
        ctx.beginPath();
        ctx.moveTo(prevX, y - prevPeakHeight);
        ctx.lineTo(x, y - peakHeight);
        ctx.stroke();
      }
    });
  }, [mmr]);

  return (
    <canvas ref={canvasRef} width="280" height="100" className="w-full bg-[#000] border border-[#222]"></canvas>
  );
}

export default function RightPanel() {
  const [activeTab, setActiveTab] = useState<'state' | 'topology' | 'governance'>('topology');
  const { machine, nodes, edges, eta, selectedNode, removeNode } = useAod();
  
  const topology = machine.computeTopology();
  const bottlenecks = machine.getBottlenecks().slice(0, 5);
  const selectedObj = selectedNode ? machine.objects.get(selectedNode) : null;

  return (
    <div className="w-80 flex flex-col bg-[#0a0a0a] border-l border-[#333] overflow-y-auto">
      <div className="flex border-b border-[#333]">
        <button 
          onClick={() => setActiveTab('state')}
          className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider ${activeTab === 'state' ? 'text-[#F27D26] border-b-2 border-[#F27D26]' : 'text-[#888] hover:text-white'}`}
        >
          State
        </button>
        <button 
          onClick={() => setActiveTab('topology')}
          className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider ${activeTab === 'topology' ? 'text-[#F27D26] border-b-2 border-[#F27D26]' : 'text-[#888] hover:text-white'}`}
        >
          Topology
        </button>
        <button 
          onClick={() => setActiveTab('governance')}
          className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider ${activeTab === 'governance' ? 'text-[#F27D26] border-b-2 border-[#F27D26]' : 'text-[#888] hover:text-white'}`}
        >
          Gov
        </button>
      </div>

      <div className="flex-1 p-4 overflow-y-auto">
        {selectedObj && (
          <div className="mb-6 border border-[#333] bg-[#111] p-3 rounded-sm">
            <h3 className="text-xs font-bold uppercase text-[#F27D26] mb-2 border-b border-[#333] pb-1">Node Inspector</h3>
            <div className="grid grid-cols-2 gap-2 text-xs mb-3">
              <span className="text-[#888]">ID</span>
              <span className="text-right text-[#00FF00] truncate" title={selectedObj.id}>{selectedObj.id}</span>
              <span className="text-[#888]">Layer</span>
              <span className="text-right">{selectedObj.layer}</span>
              <span className="text-[#888]">Reward</span>
              <span className="text-right">{selectedObj.reward.toFixed(2)}</span>
              <span className="text-[#888]">Safety</span>
              <span className="text-right">{selectedObj.safety.toFixed(2)}</span>
              <span className="text-[#888]">Curvature</span>
              <span className={`text-right ${selectedObj.curvature < 0 ? 'text-[#FF4444]' : 'text-[#00FF00]'}`}>
                {selectedObj.curvature.toFixed(4)}
              </span>
            </div>
            <button 
              onClick={() => removeNode(selectedObj.id)}
              className="w-full bg-[#333] hover:bg-[#FF4444] hover:text-black text-white text-xs py-1 uppercase font-bold transition-colors"
            >
              Remove Node
            </button>
          </div>
        )}

        {activeTab === 'topology' && (
          <div className="space-y-6">
            <div className="border border-[#333] bg-[#111] p-3 rounded-sm">
              <h3 className="text-xs font-bold uppercase text-[#888] mb-3 flex items-center gap-2">
                <Network size={14} /> Metrics
              </h3>
              <div className="grid grid-cols-2 gap-y-2 text-xs">
                <span className="text-[#888]">β₀ (Components)</span>
                <span className="text-right text-white">{topology.b0}</span>
                <span className="text-[#888]">β₁ (Cycles)</span>
                <span className="text-right text-white">{topology.b1}</span>
                <span className="text-[#888]">χ (Euler)</span>
                <span className="text-right text-white">{topology.chi}</span>
                <span className="text-[#888]">Risk Score</span>
                <span className="text-right text-[#FF4444]">{topology.riskScore.toFixed(2)}</span>
              </div>
            </div>

            <div className="border border-[#333] bg-[#111] p-3 rounded-sm">
              <h3 className="text-xs font-bold uppercase text-[#888] mb-3 flex items-center gap-2">
                <Activity size={14} /> Bottlenecks
              </h3>
              {bottlenecks.length === 0 ? (
                <div className="text-[#555] text-xs text-center italic">No bottlenecks</div>
              ) : (
                <div className="space-y-2">
                  {bottlenecks.map((b, i) => (
                    <div key={b.id} className="flex justify-between text-xs border-b border-[#222] pb-1">
                      <span className="text-white truncate w-24" title={b.id}>{i+1}. {b.id}</span>
                      <span className={b.curvature < 0 ? 'text-[#FF4444]' : 'text-[#00FF00]'}>
                        {b.curvature.toFixed(4)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'state' && (
          <div className="space-y-6">
            <div className="border border-[#333] bg-[#111] p-3 rounded-sm">
              <h3 className="text-xs font-bold uppercase text-[#888] mb-3 flex items-center gap-2">
                <Cpu size={14} /> System State
              </h3>
              <div className="grid grid-cols-2 gap-y-2 text-xs">
                <span className="text-[#888]">Nodes</span>
                <span className="text-right text-white">{nodes.length}</span>
                <span className="text-[#888]">Edges</span>
                <span className="text-right text-white">{edges.length}</span>
                <span className="text-[#888]">Epoch</span>
                <span className="text-right text-white">{machine.epoch}</span>
                <span className="text-[#888]">S_t</span>
                <span className="text-right text-white">{machine.sT.toFixed(2)}</span>
                <span className="text-[#888]">η (Efficiency)</span>
                <span className="text-right text-[#00FF00]">{eta.toFixed(4)}</span>
              </div>
            </div>

            <div className="border border-[#333] bg-[#111] p-3 rounded-sm">
              <h3 className="text-xs font-bold uppercase text-[#888] mb-3">
                Merkle Mountain Range (MMR)
              </h3>
              <MmrCanvas mmr={machine.mmr} />
            </div>
          </div>
        )}

        {activeTab === 'governance' && (
          <div className="space-y-6">
            <div className="border border-[#333] bg-[#111] p-3 rounded-sm">
              <h3 className="text-xs font-bold uppercase text-[#888] mb-3 flex items-center gap-2">
                <ShieldAlert size={14} /> Governance
              </h3>
              <div className="grid grid-cols-2 gap-y-2 text-xs">
                <span className="text-[#888]">Status</span>
                <span className="text-right text-[#00FF00]">Active</span>
                <span className="text-[#888]">Gated Packets</span>
                <span className="text-right text-white">{machine.governanceGated}</span>
                <span className="text-[#888]">Blocked Packets</span>
                <span className="text-right text-[#FF4444]">{machine.governanceBlocked}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
