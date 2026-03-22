'use client';

import { useState } from 'react';
import { useAod } from '@/lib/AodContext';
import { Layer } from '@/lib/aod';
import { Terminal, Cpu, Clock, Hash, Plus, Minus, Send } from 'lucide-react';

export default function LeftPanel() {
  const [activeTab, setActiveTab] = useState<'opcodes' | 'ai' | 'history'>('opcodes');
  const { machine, addNode, addEdge, removeNode, tick, stateRoot } = useAod();

  // Form states
  const [nodeId, setNodeId] = useState('');
  const [nodeLayer, setNodeLayer] = useState<Layer>('graph');
  const [nodeReward, setNodeReward] = useState(1.0);
  const [nodeSafety, setNodeSafety] = useState(0.5);

  const [edgeSrc, setEdgeSrc] = useState('');
  const [edgeTgt, setEdgeTgt] = useState('');
  const [edgeWeight, setEdgeWeight] = useState(1.0);
  const [edgeProb, setEdgeProb] = useState(1.0);

  const [removeId, setRemoveId] = useState('');

  const [aiQuery, setAiQuery] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<any>(null);

  const handleAiQuery = async () => {
    if (!aiQuery) return;
    setIsAiLoading(true);
    setAiResult(null);
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: aiQuery,
          state: {
            nodes: Array.from(machine.objects.values()),
            edges: machine.morphisms
          }
        })
      });
      const data = await res.json();
      setAiResult(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsAiLoading(false);
    }
  };

  const executeAiProposal = async () => {
    if (!aiResult) return;
    try {
      for (const n of aiResult.nodes) {
        await addNode(n.id, n.layer as Layer, n.reward, n.safety);
      }
      for (const e of aiResult.edges) {
        await addEdge(e.src, e.tgt, e.weight, e.prob);
      }
      setAiResult(null);
      setAiQuery('');
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddNode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nodeId) return;
    try {
      await addNode(nodeId, nodeLayer, nodeReward, nodeSafety);
      setNodeId('');
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddEdge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!edgeSrc || !edgeTgt) return;
    try {
      await addEdge(edgeSrc, edgeTgt, edgeWeight, edgeProb);
      setEdgeSrc('');
      setEdgeTgt('');
    } catch (err) {
      console.error(err);
    }
  };

  const handleRemoveNode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!removeId) return;
    try {
      await removeNode(removeId);
      setRemoveId('');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="w-80 flex flex-col bg-[#0a0a0a] border-r border-[#333] overflow-y-auto">
      <div className="flex border-b border-[#333]">
        <button 
          onClick={() => setActiveTab('opcodes')}
          className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider ${activeTab === 'opcodes' ? 'text-[#F27D26] border-b-2 border-[#F27D26]' : 'text-[#888] hover:text-white'}`}
        >
          Opcodes
        </button>
        <button 
          onClick={() => setActiveTab('ai')}
          className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider ${activeTab === 'ai' ? 'text-[#F27D26] border-b-2 border-[#F27D26]' : 'text-[#888] hover:text-white'}`}
        >
          AI Query
        </button>
      </div>

      <div className="flex-1 p-4 overflow-y-auto">
        {activeTab === 'opcodes' && (
          <div className="space-y-6">
            {/* ADD_NODE */}
            <div className="border border-[#333] bg-[#111] p-3 rounded-sm">
              <div className="flex items-center gap-2 mb-3 text-[#00FF00]">
                <Plus size={16} />
                <h3 className="text-xs font-bold uppercase">0x01 ADD_NODE</h3>
              </div>
              <form onSubmit={handleAddNode} className="space-y-2">
                <input 
                  type="text" placeholder="Node ID" value={nodeId} onChange={e => setNodeId(e.target.value)}
                  className="w-full bg-[#050505] border border-[#333] px-2 py-1 text-xs outline-none focus:border-[#F27D26]"
                />
                <select 
                  value={nodeLayer} onChange={e => setNodeLayer(e.target.value as Layer)}
                  className="w-full bg-[#050505] border border-[#333] px-2 py-1 text-xs outline-none focus:border-[#F27D26]"
                >
                  <option value="graph">graph</option>
                  <option value="process">process</option>
                  <option value="file">file</option>
                  <option value="ip">ip</option>
                  <option value="user">user</option>
                  <option value="governance">governance</option>
                  <option value="scripts">scripts</option>
                </select>
                <div className="flex gap-2">
                  <input 
                    type="number" step="0.1" placeholder="Reward" value={nodeReward} onChange={e => setNodeReward(Number(e.target.value))}
                    className="w-1/2 bg-[#050505] border border-[#333] px-2 py-1 text-xs outline-none focus:border-[#F27D26]"
                  />
                  <input 
                    type="number" step="0.1" min="0" max="1" placeholder="Safety" value={nodeSafety} onChange={e => setNodeSafety(Number(e.target.value))}
                    className="w-1/2 bg-[#050505] border border-[#333] px-2 py-1 text-xs outline-none focus:border-[#F27D26]"
                  />
                </div>
                <button type="submit" className="w-full bg-[#333] hover:bg-[#F27D26] hover:text-black text-white text-xs py-1.5 uppercase font-bold transition-colors">
                  Execute
                </button>
              </form>
            </div>

            {/* ADD_EDGE */}
            <div className="border border-[#333] bg-[#111] p-3 rounded-sm">
              <div className="flex items-center gap-2 mb-3 text-[#00FF00]">
                <Send size={16} />
                <h3 className="text-xs font-bold uppercase">0x02 ADD_EDGE</h3>
              </div>
              <form onSubmit={handleAddEdge} className="space-y-2">
                <div className="flex gap-2">
                  <input 
                    type="text" placeholder="Source ID" value={edgeSrc} onChange={e => setEdgeSrc(e.target.value)}
                    className="w-1/2 bg-[#050505] border border-[#333] px-2 py-1 text-xs outline-none focus:border-[#F27D26]"
                  />
                  <input 
                    type="text" placeholder="Target ID" value={edgeTgt} onChange={e => setEdgeTgt(e.target.value)}
                    className="w-1/2 bg-[#050505] border border-[#333] px-2 py-1 text-xs outline-none focus:border-[#F27D26]"
                  />
                </div>
                <div className="flex gap-2">
                  <input 
                    type="number" step="0.1" placeholder="Weight" value={edgeWeight} onChange={e => setEdgeWeight(Number(e.target.value))}
                    className="w-1/2 bg-[#050505] border border-[#333] px-2 py-1 text-xs outline-none focus:border-[#F27D26]"
                  />
                  <input 
                    type="number" step="0.1" min="0" max="1" placeholder="Prob" value={edgeProb} onChange={e => setEdgeProb(Number(e.target.value))}
                    className="w-1/2 bg-[#050505] border border-[#333] px-2 py-1 text-xs outline-none focus:border-[#F27D26]"
                  />
                </div>
                <button type="submit" className="w-full bg-[#333] hover:bg-[#F27D26] hover:text-black text-white text-xs py-1.5 uppercase font-bold transition-colors">
                  Execute
                </button>
              </form>
            </div>

            {/* REMOVE_NODE */}
            <div className="border border-[#333] bg-[#111] p-3 rounded-sm">
              <div className="flex items-center gap-2 mb-3 text-[#FF4444]">
                <Minus size={16} />
                <h3 className="text-xs font-bold uppercase">0x03 REMOVE_NODE</h3>
              </div>
              <form onSubmit={handleRemoveNode} className="space-y-2">
                <input 
                  type="text" placeholder="Node ID" value={removeId} onChange={e => setRemoveId(e.target.value)}
                  className="w-full bg-[#050505] border border-[#333] px-2 py-1 text-xs outline-none focus:border-[#F27D26]"
                />
                <button type="submit" className="w-full bg-[#333] hover:bg-[#FF4444] hover:text-black text-white text-xs py-1.5 uppercase font-bold transition-colors">
                  Execute
                </button>
              </form>
            </div>

            {/* GET_STATE_ROOT */}
            <div className="border border-[#333] bg-[#111] p-3 rounded-sm">
              <div className="flex items-center gap-2 mb-3 text-[#888]">
                <Hash size={16} />
                <h3 className="text-xs font-bold uppercase">0x10 GET_STATE_ROOT</h3>
              </div>
              <div className="bg-[#050505] border border-[#333] px-2 py-2 text-[10px] break-all text-[#00FF00]">
                {stateRoot || '—'}
              </div>
            </div>

            {/* AOD_TICK */}
            <div className="border border-[#333] bg-[#111] p-3 rounded-sm">
              <div className="flex items-center gap-2 mb-3 text-[#00FF00]">
                <Clock size={16} />
                <h3 className="text-xs font-bold uppercase">0x11 AOD_TICK</h3>
              </div>
              <button onClick={tick} className="w-full bg-[#333] hover:bg-[#00FF00] hover:text-black text-white text-xs py-1.5 uppercase font-bold transition-colors">
                Execute Tick
              </button>
            </div>
          </div>
        )}

        {activeTab === 'ai' && (
          <div className="space-y-4">
            <div className="text-[#888] text-xs mb-2">
              Query Claude to propose structural changes based on the current categorical state.
            </div>
            <textarea 
              value={aiQuery}
              onChange={e => setAiQuery(e.target.value)}
              placeholder="e.g. A microservices architecture with auth, cache, and database..."
              className="w-full h-32 bg-[#111] border border-[#333] p-2 text-xs outline-none focus:border-[#F27D26] resize-none"
            ></textarea>
            <button 
              onClick={handleAiQuery}
              disabled={isAiLoading}
              className="w-full bg-[#F27D26] text-black text-xs py-2 uppercase font-bold hover:bg-white transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Cpu size={16} />
              {isAiLoading ? 'Querying...' : 'Query Claude'}
            </button>

            {aiResult && (
              <div className="mt-4 border border-[#333] bg-[#111] p-3 rounded-sm">
                <h3 className="text-xs font-bold uppercase text-[#00FFFF] mb-2">AI Proposal</h3>
                <p className="text-xs text-[#ccc] mb-4">{aiResult.reasoning}</p>
                
                <div className="space-y-2 mb-4">
                  <h4 className="text-[10px] uppercase text-[#888] font-bold">Nodes to Add ({aiResult.nodes.length})</h4>
                  {aiResult.nodes.map((n: any, i: number) => (
                    <div key={i} className="text-xs flex justify-between bg-[#050505] p-1 border border-[#222]">
                      <span className="text-white">{n.id}</span>
                      <span className="text-[#888]">{n.layer}</span>
                    </div>
                  ))}
                </div>

                <div className="space-y-2 mb-4">
                  <h4 className="text-[10px] uppercase text-[#888] font-bold">Edges to Add ({aiResult.edges.length})</h4>
                  {aiResult.edges.map((e: any, i: number) => (
                    <div key={i} className="text-xs flex justify-between bg-[#050505] p-1 border border-[#222]">
                      <span className="text-white">{e.src} → {e.tgt}</span>
                    </div>
                  ))}
                </div>

                <button 
                  onClick={executeAiProposal}
                  className="w-full bg-[#00FFFF] text-black text-xs py-1.5 uppercase font-bold hover:bg-white transition-colors"
                >
                  Execute Proposal
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
