'use client';

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { AodMachine, Node, Edge, MmrEntry, Packet, Layer } from './aod';

interface AodContextType {
  machine: AodMachine;
  nodes: Node[];
  edges: Edge[];
  mmr: MmrEntry[];
  packets: Packet[];
  eta: number;
  tau: number;
  stateRoot: string;
  addNode: (id: string, layer: Layer, reward: number, safety: number) => Promise<void>;
  addEdge: (src: string, tgt: string, weight: number, prob: number) => Promise<void>;
  removeNode: (id: string) => Promise<void>;
  tick: () => Promise<void>;
  reset: () => Promise<void>;
  exportLog: () => void;
  importLog: (packets: Packet[]) => Promise<void>;
  selectedNode: string | null;
  setSelectedNode: (id: string | null) => void;
  isAuto: boolean;
  setIsAuto: (val: boolean) => void;
  isEvolve: boolean;
  setIsEvolve: (val: boolean) => void;
  tickInterval: number;
  setTickInterval: (val: number) => void;
}

const AodContext = createContext<AodContextType | undefined>(undefined);

export function AodProvider({ children }: { children: React.ReactNode }) {
  const [machine, setMachine] = useState(() => {
    const m = new AodMachine();
    m.initGenesis();
    return m;
  });
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [mmr, setMmr] = useState<MmrEntry[]>([]);
  const [packets, setPackets] = useState<Packet[]>([]);
  const [eta, setEta] = useState(0);
  const [tau, setTau] = useState(0);
  const [stateRoot, setStateRoot] = useState('');
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  
  const [isAuto, setIsAuto] = useState(false);
  const [isEvolve, setIsEvolve] = useState(false);
  const [tickInterval, setTickInterval] = useState(1000);

  const updateState = async () => {
    setNodes(Array.from(machine.objects.values()));
    setEdges([...machine.morphisms]);
    setMmr([...machine.mmr]);
    setPackets([...machine.packets]);
    setTau(machine.lamportTau);
    setStateRoot(await machine.stateRoot());
    
    const a = machine.objects.size;
    if (a > 0) {
      const gT = a * Math.exp(-machine.k * machine.sT);
      setEta(gT / a);
    } else {
      setEta(0);
    }
  };

  useEffect(() => {
    updateState();
  }, [machine]);

  const addNode = async (id: string, layer: Layer, reward: number, safety: number) => {
    try {
      await machine.addNode(id, layer, reward, safety);
      await updateState();
    } catch (e) {
      await updateState();
      throw e;
    }
  };

  const addEdge = async (src: string, tgt: string, weight: number, prob: number) => {
    try {
      await machine.addEdge(src, tgt, weight, prob);
      await updateState();
    } catch (e) {
      await updateState();
      throw e;
    }
  };

  const removeNode = async (id: string) => {
    try {
      await machine.removeNode(id);
      if (selectedNode === id) setSelectedNode(null);
      await updateState();
    } catch (e) {
      await updateState();
      throw e;
    }
  };

  const tick = async () => {
    await machine.tick();
    await updateState();
  };

  const reset = async () => {
    const newMachine = new AodMachine();
    await newMachine.initGenesis();
    setMachine(newMachine);
    setSelectedNode(null);
  };

  const exportLog = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(machine.packets, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href",     dataStr);
    downloadAnchorNode.setAttribute("download", "aod_log.json");
    document.body.appendChild(downloadAnchorNode); // required for firefox
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const importLog = async (importedPackets: Packet[]) => {
    const newMachine = new AodMachine();
    await newMachine.initGenesis();
    
    for (const pkt of importedPackets) {
      try {
        if (pkt.opCode === 'ADD_NODE') {
          await newMachine.addNode(pkt.payload.id, pkt.payload.layer, pkt.payload.reward, pkt.payload.safety);
        } else if (pkt.opCode === 'ADD_EDGE') {
          await newMachine.addEdge(pkt.payload.src, pkt.payload.tgt, pkt.payload.weight, pkt.payload.prob);
        } else if (pkt.opCode === 'REMOVE_NODE') {
          await newMachine.removeNode(pkt.payload.id);
        } else if (pkt.opCode === 'AOD_TICK') {
          await newMachine.tick();
        }
      } catch (e) {
        console.error('Failed to replay packet', pkt, e);
      }
    }
    
    setMachine(newMachine);
  };

  // Auto Tick Logic
  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    if (isAuto || isEvolve) {
      intervalId = setInterval(async () => {
        await tick();
        if (isEvolve) {
          const bottlenecks = machine.getBottlenecks();
          if (bottlenecks.length > 0 && bottlenecks[0].curvature < 0) {
            const bottleneck = bottlenecks[0];
            try {
              const res = await fetch('/api/ai', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  query: `Relieve the bottleneck at node ${bottleneck.id} which has a negative curvature of ${bottleneck.curvature}. Propose minimal structural changes (nodes and edges) to improve its curvature.`,
                  state: {
                    nodes: Array.from(machine.objects.values()),
                    edges: machine.morphisms
                  }
                })
              });
              const data = await res.json();
              if (data && data.nodes && data.edges) {
                for (const n of data.nodes) {
                  try { await machine.addNode(n.id, n.layer, n.reward, n.safety); } catch (e) {}
                }
                for (const e of data.edges) {
                  try { await machine.addEdge(e.src, e.tgt, e.weight, e.prob); } catch (e) {}
                }
                await updateState();
              }
            } catch (err) {
              console.error('Evolution error:', err);
            }
          }
        }
      }, tickInterval);
    }
    return () => clearInterval(intervalId);
  }, [isAuto, isEvolve, tickInterval, machine]);

  return (
    <AodContext.Provider value={{
      machine, nodes, edges, mmr, packets, eta, tau, stateRoot,
      addNode, addEdge, removeNode, tick, reset, exportLog, importLog,
      selectedNode, setSelectedNode,
      isAuto, setIsAuto, isEvolve, setIsEvolve,
      tickInterval, setTickInterval
    }}>
      {children}
    </AodContext.Provider>
  );
}

export function useAod() {
  const context = useContext(AodContext);
  if (context === undefined) {
    throw new Error('useAod must be used within an AodProvider');
  }
  return context;
}
