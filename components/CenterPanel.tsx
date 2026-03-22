'use client';

import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { useAod } from '@/lib/AodContext';
import { Node, Edge } from '@/lib/aod';

const LAYER_COLORS = {
  graph: '#888888',
  process: '#00FFFF',
  file: '#FF00FF',
  ip: '#00FF00',
  user: '#FFFF00',
  governance: '#F27D26',
  scripts: '#4444FF'
};

export default function CenterPanel() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { nodes, edges, setSelectedNode, selectedNode } = useAod();
  const simulationRef = useRef<d3.Simulation<Node, Edge> | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    const svg = d3.select(containerRef.current)
      .selectAll<SVGSVGElement, null>('svg')
      .data([null])
      .join('svg')
      .attr('width', width)
      .attr('height', height);

    // Define arrow markers
    svg.append('defs').selectAll('marker')
      .data(['end', 'end-risk'])
      .join('marker')
      .attr('id', String)
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 20)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', d => d === 'end-risk' ? '#FF4444' : '#555');

    const g = svg.selectAll('g.main').data([null]).join('g').attr('className', 'main');

    const zoom = d3.zoom<SVGSVGElement, null>()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom);

    // Simulation
    if (!simulationRef.current) {
      simulationRef.current = d3.forceSimulation<Node, Edge>()
        .force('link', d3.forceLink<Node, Edge>().id(d => d.id).distance(100))
        .force('charge', d3.forceManyBody().strength(-300))
        .force('center', d3.forceCenter(width / 2, height / 2))
        .force('collide', d3.forceCollide().radius(d => (d as Node).reward * 10 + 10));
    }

    const simulation = simulationRef.current;

    // Links
    const link = g.selectAll('.link')
      .data(edges, (d: any) => d.id)
      .join('line')
      .attr('className', 'link')
      .attr('stroke', d => {
        const tgt = nodes.find(n => n.id === d.tgt);
        return tgt && tgt.safety < 0.45 ? '#FF4444' : '#555';
      })
      .attr('stroke-width', d => d.weight * 2)
      .attr('stroke-dasharray', d => {
        const tgt = nodes.find(n => n.id === d.tgt);
        return tgt && tgt.safety < 0.45 ? '5,5' : 'none';
      })
      .attr('marker-end', d => {
        const tgt = nodes.find(n => n.id === d.tgt);
        return tgt && tgt.safety < 0.45 ? 'url(#end-risk)' : 'url(#end)';
      });

    // Nodes
    const node = g.selectAll('.node')
      .data(nodes, (d: any) => d.id)
      .join('g')
      .attr('className', 'node')
      .call(d3.drag<any, Node>()
        .on('start', (event, d) => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on('drag', (event, d) => {
          d.fx = event.x;
          d.fy = event.y;
        })
        .on('end', (event, d) => {
          if (!event.active) simulation.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        })
      )
      .on('click', (event, d) => {
        setSelectedNode(d.id);
      });

    // Node circles
    node.selectAll('circle.base')
      .data(d => [d])
      .join('circle')
      .attr('className', 'base')
      .attr('r', d => d.reward * 10 + 5)
      .attr('fill', d => LAYER_COLORS[d.layer] || '#888')
      .attr('stroke', d => d.id === selectedNode ? '#FFF' : '#000')
      .attr('stroke-width', d => d.id === selectedNode ? 3 : 1);

    // Curvature rings
    node.selectAll('circle.curvature')
      .data(d => [d])
      .join('circle')
      .attr('className', 'curvature')
      .attr('r', d => d.reward * 10 + 10)
      .attr('fill', 'none')
      .attr('stroke', d => d.curvature < 0 ? '#FF4444' : '#00FF00')
      .attr('stroke-width', d => Math.abs(d.curvature) * 2)
      .attr('opacity', 0.7);

    // Node labels
    node.selectAll('text')
      .data(d => [d])
      .join('text')
      .text(d => d.id)
      .attr('x', 15)
      .attr('y', 4)
      .attr('font-size', '10px')
      .attr('fill', '#E4E3E0')
      .attr('pointer-events', 'none');

    simulation.nodes(nodes);
    (simulation.force('link') as d3.ForceLink<Node, Edge>).links(edges);
    simulation.alpha(0.3).restart();

    simulation.on('tick', () => {
      link
        .attr('x1', d => (d.source as any).x)
        .attr('y1', d => (d.source as any).y)
        .attr('x2', d => (d.target as any).x)
        .attr('y2', d => (d.target as any).y);

      node
        .attr('transform', d => `translate(${d.x},${d.y})`);
    });

    return () => {
      simulation.stop();
    };
  }, [nodes, edges, selectedNode, setSelectedNode]);

  return (
    <div className="flex-1 relative bg-[#050505] overflow-hidden" ref={containerRef}>
      <div className="absolute top-4 left-4 text-[#333] font-mono text-4xl font-bold opacity-20 pointer-events-none select-none">
        AOD v3 .42
      </div>
    </div>
  );
}
