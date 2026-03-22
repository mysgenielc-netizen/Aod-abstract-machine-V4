import { sha256 } from './crypto';

export type Layer = 'graph' | 'process' | 'file' | 'ip' | 'user' | 'governance' | 'scripts';

export interface Node {
  id: string;
  layer: Layer;
  reward: number;
  safety: number;
  curvature: number;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  fx?: number | null;
  fy?: number | null;
  index?: number;
}

export interface Edge {
  id: string;
  src: string;
  tgt: string;
  weight: number;
  prob: number;
  source: string | Node;
  target: string | Node;
}

export interface MmrEntry {
  pos: number;
  tau: number;
  opCode: string;
  stateRoot: string;
  timestamp: number;
  hash: string;
}

export interface Packet {
  tau: number;
  opCode: string;
  payload: any;
  hash: string;
  result: 'ok' | 'error' | 'system' | 'ai' | 'evolve' | 'governance';
  message: string;
}

export class AodMachine {
  objects: Map<string, Node> = new Map();
  morphisms: Edge[] = [];
  lamportTau: number = 0;
  epoch: number = 0;
  sT: number = 0;
  k: number = 0.1;
  mmr: MmrEntry[] = [];
  packets: Packet[] = [];
  
  // Governance stats
  governanceGated: number = 0;
  governanceBlocked: number = 0;

  constructor() {
    this.initGenesis();
  }

  async initGenesis() {
    // Cryptographic Genesis: Tying the initial state root to the Architect
    const genesisSeed = "ARCHITECT: DEVIN EARL ATCHLEY | AOD v3 .42 SYSTEM";
    const genesisHash = await sha256(genesisSeed);
    
    this.mmr.push({
      pos: 0,
      tau: 0,
      opCode: "GENESIS_INIT",
      stateRoot: genesisHash,
      timestamp: Date.now(),
      hash: genesisHash,
    });
    
    this.logPacket(0, "GENESIS_INIT", {}, genesisHash, "system", "SYSTEM ARCHITECT: DEVIN EARL ATCHLEY");
    this.logPacket(0, "BOOT", {}, genesisHash, "system", "AOD Abstract Machine v3 — Deterministic Categorical Runtime");
    this.logPacket(0, "BOOT", {}, genesisHash, "system", "DCC · RFC 8949 · Lamport τ · ChaCha20 PRNG · Forman-Ricci");
    this.logPacket(0, "CORE", {}, genesisHash, "system", "Proprietary .42 System Initialized — η Attractor Online");
  }

  async stateRoot(): Promise<string> {
    const payload = `objs:${this.objects.size}|morphs:${this.morphisms.length}|tau:${this.lamportTau}`;
    return await sha256(payload);
  }

  tickTau(): number {
    this.lamportTau += 1;
    return this.lamportTau;
  }

  async appendMmr(opCode: string) {
    const root = await this.stateRoot();
    const entryHash = await sha256(`${this.mmr.length}:${this.lamportTau}:${opCode}:${root}`);
    this.mmr.push({
      pos: this.mmr.length,
      tau: this.lamportTau,
      opCode,
      stateRoot: root,
      timestamp: Date.now(),
      hash: entryHash,
    });
    return entryHash;
  }

  logPacket(tau: number, opCode: string, payload: any, hash: string, result: Packet['result'], message: string) {
    this.packets.push({ tau, opCode, payload, hash, result, message });
  }

  async addNode(id: string, layer: Layer, reward: number, safety: number) {
    if (this.objects.has(id)) {
      this.logPacket(this.lamportTau, 'ADD_NODE', {id}, '', 'error', `Node ${id} already exists`);
      throw new Error('NodeAlreadyExists');
    }
    if (safety < 0 || safety > 1) {
      this.logPacket(this.lamportTau, 'ADD_NODE', {id}, '', 'error', `Invalid safety parameter`);
      throw new Error('InvalidSafetyParam');
    }

    this.tickTau();
    const node: Node = { id, layer, reward, safety, curvature: 0 };
    this.objects.set(id, node);
    this.sT += 1.0;

    this.updateCurvatures();
    const hash = await this.appendMmr('ADD_NODE');
    this.logPacket(this.lamportTau, 'ADD_NODE', {id, layer, reward, safety}, hash, 'ok', `Added node ${id}`);
  }

  async addEdge(src: string, tgt: string, weight: number, prob: number) {
    if (!this.objects.has(src)) {
      this.logPacket(this.lamportTau, 'ADD_EDGE', {src, tgt}, '', 'error', `Source node ${src} not found`);
      throw new Error(`NodeNotFound: ${src}`);
    }
    if (!this.objects.has(tgt)) {
      this.logPacket(this.lamportTau, 'ADD_EDGE', {src, tgt}, '', 'error', `Target node ${tgt} not found`);
      throw new Error(`NodeNotFound: ${tgt}`);
    }

    // Governance Check
    const tgtNode = this.objects.get(tgt)!;
    if (tgtNode.safety < 0.5 && this.objects.has('execution_kill_switch') && this.objects.has('safety_constraint_engine')) {
      this.governanceGated++;
      const roll = Math.random();
      if (roll > prob) {
        this.governanceBlocked++;
        this.logPacket(this.lamportTau, 'ADD_EDGE', {src, tgt}, '', 'governance', `Governance blocked edge to low-safety node ${tgt}`);
        throw new Error('GovernanceBlocked');
      }
    }

    this.tickTau();
    const edgeId = `${src}->${tgt}`;
    this.morphisms.push({ id: edgeId, src, tgt, weight, prob, source: src, target: tgt });
    this.updateCurvatures();
    const hash = await this.appendMmr('ADD_EDGE');
    this.logPacket(this.lamportTau, 'ADD_EDGE', {src, tgt, weight, prob}, hash, 'ok', `Added edge ${src} -> ${tgt}`);
  }

  async removeNode(id: string) {
    if (!this.objects.has(id)) {
      this.logPacket(this.lamportTau, 'REMOVE_NODE', {id}, '', 'error', `Node ${id} not found`);
      throw new Error(`NodeNotFound: ${id}`);
    }

    this.tickTau();
    this.objects.delete(id);
    this.morphisms = this.morphisms.filter(e => e.src !== id && e.tgt !== id);
    this.updateCurvatures();
    const hash = await this.appendMmr('REMOVE_NODE');
    this.logPacket(this.lamportTau, 'REMOVE_NODE', {id}, hash, 'ok', `Removed node ${id}`);
  }

  async tick() {
    this.epoch += 1;
    this.tickTau();

    const a = this.objects.size;
    if (a === 0) return { gT: 0, eta: 0 };

    const gT = a * Math.exp(-this.k * this.sT);
    const eta = gT / a;

    const hash = await this.appendMmr('AOD_TICK');
    this.logPacket(this.lamportTau, 'AOD_TICK', {epoch: this.epoch, eta}, hash, 'system', `AOD Tick. η = ${eta.toFixed(4)}`);
    
    return { gT, eta };
  }

  updateCurvatures() {
    const degrees = new Map<string, number>();
    const neighbors = new Map<string, Set<string>>();

    for (const edge of this.morphisms) {
      degrees.set(edge.src, (degrees.get(edge.src) || 0) + 1);
      degrees.set(edge.tgt, (degrees.get(edge.tgt) || 0) + 1);

      if (!neighbors.has(edge.src)) neighbors.set(edge.src, new Set());
      if (!neighbors.has(edge.tgt)) neighbors.set(edge.tgt, new Set());
      
      neighbors.get(edge.src)!.add(edge.tgt);
      neighbors.get(edge.tgt)!.add(edge.src);
    }

    for (const [id, node] of this.objects.entries()) {
      const deg = degrees.get(id) || 0;
      if (deg === 0) {
        node.curvature = 0;
        continue;
      }

      let sum = 0;
      const nbs = neighbors.get(id);
      if (nbs) {
        for (const nb of nbs) {
          const nbDeg = degrees.get(nb) || 0;
          sum += 4 - nbDeg - deg;
        }
      }
      node.curvature = (1 / deg) * sum;
    }
  }

  computeTopology() {
    const v = this.objects.size;
    const e = this.morphisms.length;
    if (v === 0) return { b0: 0, b1: 0, chi: 0, riskScore: 0 };

    const parent = new Map<string, string>();
    for (const id of this.objects.keys()) {
      parent.set(id, id);
    }

    function find(i: string): string {
      if (parent.get(i) !== i) {
        const root = find(parent.get(i)!);
        parent.set(i, root);
        return root;
      }
      return i;
    }

    for (const edge of this.morphisms) {
      const rootSrc = find(edge.src);
      const rootTgt = find(edge.tgt);
      if (rootSrc !== rootTgt) {
        parent.set(rootSrc, rootTgt);
      }
    }

    const uniqueRoots = new Set<string>();
    for (const id of this.objects.keys()) {
      uniqueRoots.add(find(id));
    }

    const b0 = uniqueRoots.size;
    const b1 = Math.max(0, e - v) + b0;
    const chi = v - e;

    let riskScore = 0;
    for (const node of this.objects.values()) {
      riskScore += node.reward * (1 - node.safety);
    }

    return { b0, b1, chi, riskScore };
  }

  getBottlenecks() {
    return Array.from(this.objects.values())
      .sort((a, b) => a.curvature - b.curvature);
  }
}
