import { useState, useEffect, useRef, useMemo } from 'react';
import ForceGraph2D from 'react-force-graph-2d';

interface Node {
  id: string;
  name: string;
  type: string;
  label: string;
  x?: number;
  y?: number;
}

interface Link {
  source: string | Node;
  target: string | Node;
  type: string;
}

interface NetworkGraphProps {
  nodes: Node[];
  links: Link[];
  selectedNodeId?: string;
  onNodeClick: (node: Node) => void;
}

const NODE_COLORS: Record<string, string> = {
  frontend: '#22d3ee',
  backend: '#818cf8',
  database: '#fbbf24',
  devops: '#f87171',
  language: '#facc15',
  role: '#a78bfa',
  company: '#34d399',
};

export default function NetworkGraph({ nodes, links, selectedNodeId, onNodeClick }: NetworkGraphProps) {
  const fgRef = useRef<any>(null);
  const [hoverNode, setHoverNode] = useState<Node | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // Track container size for responsive graph sizing
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const updateSize = () => {
      setDimensions({ width: el.clientWidth, height: el.clientHeight });
    };
    updateSize();

    const observer = new ResizeObserver(updateSize);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const isMobile = dimensions.width > 0 && dimensions.width <= 768;

  useEffect(() => {
    if (fgRef.current) {
      fgRef.current.d3Force('charge')?.strength(isMobile ? -150 : -300);
      fgRef.current.d3Force('link')?.distance(isMobile ? 70 : 120);
    }
  }, [nodes, links, isMobile]);

  const { highlightNodes, highlightLinks } = useMemo(() => {
    const activeId = hoverNode?.id || selectedNodeId;
    const hNodes = new Set<string>();
    const hLinks = new Set<Link>();

    if (activeId) {
      hNodes.add(activeId);
      links.forEach(link => {
        const sid = typeof link.source === 'object' ? link.source.id : link.source;
        const tid = typeof link.target === 'object' ? link.target.id : link.target;
        if (sid === activeId || tid === activeId) {
          hLinks.add(link);
          hNodes.add(sid);
          hNodes.add(tid);
        }
      });
    }
    return { highlightNodes: hNodes, highlightLinks: hLinks };
  }, [links, hoverNode, selectedNodeId]);

  const getColor = (node: Node) => NODE_COLORS[node.type] || '#6366f1';

  const graphData = useMemo(() => ({ nodes, links }), [nodes, links]);

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%' }}>
      <ForceGraph2D
        ref={fgRef}
        graphData={graphData}
        nodeLabel=""
        nodeRelSize={8}
        backgroundColor="#f0f4f8"
        linkColor={(link: any) =>
          highlightLinks.has(link)
            ? 'rgba(0, 0, 0, 0.25)'
            : highlightNodes.size > 0
              ? 'rgba(0, 0, 0, 0.04)'
              : 'rgba(0, 0, 0, 0.1)'
        }
        linkWidth={(link: any) => (highlightLinks.has(link) ? 2.5 : 0.5)}
        linkDirectionalArrowLength={(link: any) => (highlightLinks.has(link) ? 6 : 0)}
        linkDirectionalArrowRelPos={1}
        linkDirectionalArrowColor={() => 'rgba(0, 0, 0, 0.6)'}
        linkDirectionalParticles={(link: any) => (highlightLinks.has(link) ? 3 : 0)}
        linkDirectionalParticleWidth={2.5}
        linkDirectionalParticleColor={() => '#6366f1'}
        onNodeHover={(node: any) => {
          setHoverNode(node);
          document.body.style.cursor = node ? 'pointer' : 'default';
        }}
        onNodeClick={(node: any) => {
          if (fgRef.current) {
            // On mobile (bottom sheet), no X offset needed; on desktop shift for side panel
            const xOffset = isMobile ? 0 : 105;
            fgRef.current.centerAt(node.x + xOffset, node.y, 800);
            fgRef.current.zoom(isMobile ? 1.5 : 1.8, 800);
          }
          onNodeClick(node);
        }}
        onBackgroundClick={() => {
          if (fgRef.current) {
            fgRef.current.centerAt(0, 0, 800);
            fgRef.current.zoom(1.2, 800);
          }
          setHoverNode(null);
          onNodeClick(null as any);
        }}
        nodeCanvasObject={(node: any, ctx, globalScale) => {
          const active = highlightNodes.size === 0 || highlightNodes.has(node.id);
          const color = getColor(node);
          const label = node.name;
          const fontSize = Math.max(12 / globalScale, 3);
          const isRole = node.type === 'role';
          const isCompany = node.type === 'company';
          const radius = isCompany ? (isMobile ? 10 : 12) : isRole ? (isMobile ? 8 : 10) : (isMobile ? 6 : 8);

          if (active && (hoverNode?.id === node.id || selectedNodeId === node.id)) {
            ctx.beginPath();
            ctx.arc(node.x, node.y, radius + 6, 0, 2 * Math.PI, false);
            ctx.fillStyle = color + '22';
            ctx.fill();
          }

          ctx.beginPath();
          ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI, false);

          if (active) {
            ctx.fillStyle = color;
            ctx.shadowColor = color;
            ctx.shadowBlur = 8;
          } else {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
            ctx.shadowBlur = 0;
          }
          ctx.fill();
          ctx.shadowBlur = 0;

          if (active) {
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2 / globalScale;
            ctx.stroke();
          }

          if (active || globalScale > 1.8) {
            ctx.font = `500 ${fontSize}px Inter, sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            ctx.fillStyle = active ? '#1e293b' : 'rgba(0, 0, 0, 0.25)';
            ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
            ctx.shadowBlur = 3;
            ctx.fillText(label, node.x, node.y + radius + 3 / globalScale);
            ctx.shadowBlur = 0;
          }
        }}
      />
    </div>
  );
}
