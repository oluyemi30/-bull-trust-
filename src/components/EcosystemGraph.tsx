import React, { useState, useEffect, useRef } from "react";
import { Network, Search, Zap, HelpCircle, ShieldAlert, Layers, Compass, User, Tag } from "lucide-react";
import { BuilderPassportDetails } from "../types";

interface EcosystemGraphProps {
  builders: BuilderPassportDetails[];
  onSelectBuilder: (id: string) => void;
  setCurrentTab: (tab: string) => void;
}

interface Node {
  id: string;
  label: string;
  type: "builder" | "project" | "wallet" | "badge";
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  icon: string;
  originalId: string; // The backend entity ID (e.g., builder id or project id)
}

interface Link {
  source: string;
  target: string;
  sourceNode?: Node;
  targetNode?: Node;
}

export default function EcosystemGraph({ builders, onSelectBuilder, setCurrentTab }: EcosystemGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [links, setLinks] = useState<Link[]>([]);
  const [hoveredNode, setHoveredNode] = useState<Node | null>(null);
  const [selectedNodeInfo, setSelectedNodeInfo] = useState<Node | null>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 500 });
  const [draggedNode, setDraggedNode] = useState<Node | null>(null);
  const requestRef = useRef<number | null>(null);

  // Initialize the ecosystem network nodes & links based on DB state
  useEffect(() => {
    const width = containerRef.current?.clientWidth || 800;
    const height = 500;
    setDimensions({ width, height });

    const tempNodes: Node[] = [];
    const tempLinks: Link[] = [];

    // 1. Create nodes for all builders
    builders.forEach((b, i) => {
      // Position them in a nice circle to start
      const angle = (i / builders.length) * Math.PI * 2;
      const radiusOffset = 150;
      const builderNodeId = `node-builder-${b.id}`;
      
      let nodeColor = "#a855f7"; // Default Purple (influencer/KOL)
      let nodeIcon = "👤";
      const role = b.entity_type || "builder";
      if (role === "builder") {
        nodeColor = "#10b981"; // Emerald
        nodeIcon = "💻";
      } else if (role === "influencer") {
        nodeColor = "#a855f7"; // Purple
        nodeIcon = "📣";
      } else if (role === "memecoin") {
        nodeColor = "#ec4899"; // Pink
        nodeIcon = "🐕";
      } else if (role === "trader") {
        nodeColor = "#06b6d4"; // Cyan
        nodeIcon = "📈";
      } else if (role === "validator") {
        nodeColor = "#eab308"; // Gold/Yellow
        nodeIcon = "🛡️";
      }

      const builderNode: Node = {
        id: builderNodeId,
        label: b.username,
        type: "builder",
        x: width / 2 + Math.cos(angle) * radiusOffset,
        y: height / 2 + Math.sin(angle) * radiusOffset,
        vx: 0,
        vy: 0,
        radius: 20,
        color: nodeColor,
        icon: nodeIcon,
        originalId: b.id,
      };
      tempNodes.push(builderNode);

      // 2. Create nodes for wallets and link to builders
      b.wallets.forEach((w, wIdx) => {
        const walletNodeId = `node-wallet-${w.id}`;
        const walletAngle = angle + (wIdx + 1) * 0.4;
        
        const walletNode: Node = {
          id: walletNodeId,
          label: `${w.address.substring(0, 6)}...${w.address.substring(w.address.length - 4)}`,
          type: "wallet",
          x: builderNode.x + Math.cos(walletAngle) * 60,
          y: builderNode.y + Math.sin(walletAngle) * 60,
          vx: 0,
          vy: 0,
          radius: 12,
          color: "#10b981", // Bento Emerald
          icon: "💳",
          originalId: b.id,
        };
        tempNodes.push(walletNode);
        tempLinks.push({ source: builderNodeId, target: walletNodeId });
      });

      // 3. Create nodes for projects and link to creator builder
      b.projects.forEach((p, pIdx) => {
        const projectNodeId = `node-project-${p.id}`;
        const projectAngle = angle - (pIdx + 1) * 0.5;

        // Check if project node already exists (avoid duplicates if multple owners exist)
        if (!tempNodes.some(n => n.id === projectNodeId)) {
          const projectNode: Node = {
            id: projectNodeId,
            label: p.name,
            type: "project",
            x: builderNode.x + Math.cos(projectAngle) * 90,
            y: builderNode.y + Math.sin(projectAngle) * 90,
            vx: 0,
            vy: 0,
            radius: 16,
            color: "#f59e0b", // Amber
            icon: p.logo || "📦",
            originalId: b.id,
          };
          tempNodes.push(projectNode);
          tempLinks.push({ source: builderNodeId, target: projectNodeId });
        }
      });

      // 4. Create nodes for badges and link to builders
      b.badges.forEach((bg, bgIdx) => {
        const badgeNodeId = `node-badge-${bg.id}`;
        // Since badges are shared, we only create one badge node and link multiple builders to it
        let badgeNode = tempNodes.find(n => n.id === badgeNodeId);
        if (!badgeNode) {
          const badgeAngle = (bgIdx / 5) * Math.PI * 2;
          badgeNode = {
            id: badgeNodeId,
            label: bg.name,
            type: "badge",
            x: width / 2 + Math.cos(badgeAngle) * 260,
            y: height / 2 + Math.sin(badgeAngle) * 260,
            vx: 0,
            vy: 0,
            radius: 14,
            color: "#ec4899", // Pink/Rose
            icon: bg.icon || "🏆",
            originalId: bg.id,
          };
          tempNodes.push(badgeNode);
        }
        tempLinks.push({ source: builderNodeId, target: badgeNodeId });
      });

    });

    setNodes(tempNodes);
    setLinks(tempLinks);
  }, [builders]);

  // Force-directed simulation physics loop (At 60 FPS)
  useEffect(() => {
    const updatePhysics = () => {
      setNodes((prevNodes) => {
        if (prevNodes.length === 0) return prevNodes;

        // Clone nodes to update physics
        const updated = prevNodes.map((n) => ({ ...n }));

        // 1. Repulsion between all nodes (Electrostatic force)
        for (let i = 0; i < updated.length; i++) {
          const n1 = updated[i];
          for (let j = i + 1; j < updated.length; j++) {
            const n2 = updated[j];
            const dx = n2.x - n1.x;
            const dy = n2.y - n1.y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;

            if (dist < 150) {
              const force = (150 - dist) * 0.04;
              const fx = (dx / dist) * force;
              const fy = (dy / dist) * force;

              // Don't apply force to dragged node
              if (draggedNode?.id !== n1.id) {
                n1.vx -= fx;
                n1.vy -= fy;
              }
              if (draggedNode?.id !== n2.id) {
                n2.vx += fx;
                n2.vy += fy;
              }
            }
          }
        }

        // 2. Attraction along links (Spring force)
        links.forEach((link) => {
          const sourceNode = updated.find((n) => n.id === link.source);
          const targetNode = updated.find((n) => n.id === link.target);

          if (sourceNode && targetNode) {
            const dx = targetNode.x - sourceNode.x;
            const dy = targetNode.y - sourceNode.y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            const desiredDist = sourceNode.type === "builder" && targetNode.type === "wallet" ? 50 : 100;
            
            const force = (dist - desiredDist) * 0.03;
            const fx = (dx / dist) * force;
            const fy = (dy / dist) * force;

            if (draggedNode?.id !== sourceNode.id) {
              sourceNode.vx += fx;
              sourceNode.vy += fy;
            }
            if (draggedNode?.id !== targetNode.id) {
              targetNode.vx -= fx;
              targetNode.vy -= fy;
            }
          }
        });

        // 3. Gravity center attraction
        const centerX = dimensions.width / 2;
        const centerY = dimensions.height / 2;
        updated.forEach((n) => {
          if (draggedNode?.id === n.id) return;

          const dx = centerX - n.x;
          const dy = centerY - n.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;

          // Pull slightly to center
          n.vx += dx * 0.003;
          n.vy += dy * 0.003;

          // Apply velocity and friction/damping
          n.x += n.vx;
          n.y += n.vy;
          n.vx *= 0.82;
          n.vy *= 0.82;

          // Boundaries constraints
          const padding = 25;
          if (n.x < padding) { n.x = padding; n.vx = 0; }
          if (n.x > dimensions.width - padding) { n.x = dimensions.width - padding; n.vx = 0; }
          if (n.y < padding) { n.y = padding; n.vy = 0; }
          if (n.y > dimensions.height - padding) { n.y = dimensions.height - padding; n.vy = 0; }
        });

        return updated;
      });

      requestRef.current = requestAnimationFrame(updatePhysics);
    };

    requestRef.current = requestAnimationFrame(updatePhysics);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [links, dimensions, draggedNode]);

  // Handle Drag & Drop on SVG canvas
  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const mX = e.clientX - rect.left;
    const mY = e.clientY - rect.top;

    // Find clicked node
    const clickedNode = nodes.find((n) => {
      const dist = Math.sqrt((n.x - mX) ** 2 + (n.y - mY) ** 2);
      return dist <= n.radius + 5;
    });

    if (clickedNode) {
      setDraggedNode(clickedNode);
      setSelectedNodeInfo(clickedNode);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!draggedNode) {
      // Find node under hover
      const rect = e.currentTarget.getBoundingClientRect();
      const mX = e.clientX - rect.left;
      const mY = e.clientY - rect.top;

      const hovered = nodes.find((n) => {
        const dist = Math.sqrt((n.x - mX) ** 2 + (n.y - mY) ** 2);
        return dist <= n.radius + 5;
      });

      setHoveredNode(hovered || null);
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const mX = e.clientX - rect.left;
    const mY = e.clientY - rect.top;

    // Update position of dragged node
    setNodes((prevNodes) =>
      prevNodes.map((n) => (n.id === draggedNode.id ? { ...n, x: mX, y: mY, vx: 0, vy: 0 } : n))
    );
  };

  const handleMouseUp = () => {
    setDraggedNode(null);
  };

  const handleInspectProfile = () => {
    if (selectedNodeInfo) {
      onSelectBuilder(selectedNodeInfo.originalId);
      setCurrentTab("passports");
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 text-zinc-100">
      
      {/* GRAPH PANEL TITLE */}
      <div className="border-b border-zinc-800 pb-5 mb-6">
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2 font-display">
          <Network className="h-6 w-6 text-emerald-400 animate-pulse" />
          Interactive Ecosystem Graph
        </h1>
        <p className="text-xs text-zinc-500 mt-1">
          Explore the live topological structure of the ANSEM Network. Drag nodes to reshape, hover for details, or click a builder to jump straight to their passport.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* NETWORK CANVAS CONTAINER */}
        <div className="lg:col-span-3 flex flex-col rounded-3xl border border-zinc-800 bg-[#0c0c0e] overflow-hidden shadow-xl relative min-h-[500px]">
          
          {/* LEGEND ROW */}
          <div className="absolute top-4 left-4 z-10 flex flex-wrap gap-x-3 gap-y-1 bg-zinc-950/95 backdrop-blur-md border border-zinc-800 px-3.5 py-2.5 rounded-xl text-[8px] font-bold tracking-wider uppercase text-zinc-400 font-mono max-w-[90%]">
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[#10b981]" /> 💻 Builder</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[#a855f7]" /> 📣 KOL/Influencer</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[#ec4899]" /> 🐕 Memecoin</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[#06b6d4]" /> 📈 Trader</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[#eab308]" /> 🛡️ Validator</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[#f59e0b]" /> 📦 Project</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[#ec4899]" /> 🏆 Badge</span>
          </div>

          <div className="flex-1 w-full h-full" ref={containerRef}>
            <svg
              className="w-full h-[500px] cursor-grab active:cursor-grabbing select-none"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              {/* GLOW FILTER */}
              <defs>
                <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* DRAW CONNECTIONS (LINKS) */}
              {links.map((link, idx) => {
                const sourceNode = nodes.find((n) => n.id === link.source);
                const targetNode = nodes.find((n) => n.id === link.target);

                if (!sourceNode || !targetNode) return null;

                const isHovered = hoveredNode && (hoveredNode.id === sourceNode.id || hoveredNode.id === targetNode.id);

                return (
                  <line
                    key={idx}
                    x1={sourceNode.x}
                    y1={sourceNode.y}
                    x2={targetNode.x}
                    y2={targetNode.y}
                    stroke={isHovered ? "#10b981" : "#27272a"}
                    strokeOpacity={isHovered ? 0.9 : 0.4}
                    strokeWidth={isHovered ? 2.0 : 1.0}
                    className="transition-all"
                  />
                );
              })}

              {/* DRAW NODES */}
              {nodes.map((n) => {
                const isHovered = hoveredNode && hoveredNode.id === n.id;
                const isSelected = selectedNodeInfo && selectedNodeInfo.id === n.id;

                return (
                  <g
                    key={n.id}
                    transform={`translate(${n.x}, ${n.y})`}
                    className="transition-transform duration-75"
                  >
                    {/* Glowing outer aura for hovered / selected nodes */}
                    {(isHovered || isSelected) && (
                      <circle
                        r={n.radius + 6}
                        fill="none"
                        stroke={n.color}
                        strokeWidth="3"
                        strokeOpacity="0.4"
                        filter="url(#glow)"
                      />
                    )}

                    {/* Primary Node body */}
                    <circle
                      r={n.radius}
                      fill={n.color}
                      className="cursor-pointer"
                    />

                    {/* Emoji/Icon in center of node */}
                    <text
                      textAnchor="middle"
                      dy="0.32em"
                      fontSize={n.radius * 0.9}
                      className="pointer-events-none select-none"
                    >
                      {n.icon}
                    </text>

                    {/* Node label text below the bubble */}
                    <text
                      textAnchor="middle"
                      y={n.radius + 15}
                      fontSize="10"
                      fontWeight="bold"
                      fill="currentColor"
                      className="pointer-events-none select-none bg-background/90 px-1 rounded-sm py-0.5"
                    >
                      {n.label}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* SIDEBAR DETAILED INSPECTION PANEL */}
        <div className="lg:col-span-1 rounded-3xl border border-zinc-800 bg-[#0c0c0e] p-6 flex flex-col justify-between shadow-xl bento-glow">
          <div>
            <div className="flex items-center gap-2 pb-4 mb-4 border-b border-zinc-800">
              <Zap className="h-4 w-4 text-emerald-400 animate-pulse" />
              <h3 className="text-[10px] font-bold tracking-wider uppercase text-zinc-500 font-mono">Ecosystem Inspector</h3>
            </div>

            {selectedNodeInfo ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{selectedNodeInfo.icon}</span>
                  <div>
                    <h4 className="text-sm font-bold text-zinc-100">{selectedNodeInfo.label}</h4>
                    <span className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider text-emerald-400 font-mono">
                      {selectedNodeInfo.type}
                    </span>
                  </div>
                </div>

                <div className="space-y-2.5 pt-2 text-xs text-zinc-400 leading-relaxed font-sans">
                  <p>
                    {selectedNodeInfo.type === "builder" && (
                      `This node represents an active Web3 core builder passport. They are endorsed in multiple advanced blockchain technologies and have created verified decentralised products.`
                    )}
                    {selectedNodeInfo.type === "project" && (
                      `This represents a modular dApp, AI agent, or DeFi protocol. It has been reviewed by the ANSEM Core Guild and anchors custom on-chain smart contracts.`
                    )}
                    {selectedNodeInfo.type === "wallet" && (
                      `This represents a verified public address cryptographically signed and registered to their primary developer passport.`
                    )}
                    {selectedNodeInfo.type === "badge" && (
                      `This represents a prestigious certificate of contribution, issued by ANSEM core committees to recognize exceptional delivery or TVL milestones.`
                    )}
                  </p>

                  <div className="rounded-xl bg-zinc-950 p-3 border border-zinc-900 font-mono text-[9px] space-y-1 text-zinc-500">
                    <div>ID: {selectedNodeInfo.id}</div>
                    <div>X: {Math.floor(selectedNodeInfo.x)} | Y: {Math.floor(selectedNodeInfo.y)}</div>
                  </div>
                </div>

                {/* Inspect Button for builders/projects */}
                {(selectedNodeInfo.type === "builder" || selectedNodeInfo.type === "project" || selectedNodeInfo.type === "wallet") && (
                  <button
                    onClick={handleInspectProfile}
                    className="w-full rounded-xl bg-emerald-500 hover:bg-emerald-400 py-2 text-xs font-bold text-zinc-950 transition-colors mt-4 cursor-pointer"
                  >
                    View Builder Passport
                  </button>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center py-12 text-zinc-500">
                <Network className="h-8 w-8 stroke-1 text-zinc-700 mb-3" />
                <p className="text-xs font-semibold">No Node Selected</p>
                <p className="text-[10px] text-zinc-600 max-w-[160px] mt-1 leading-relaxed">
                  Click on any connection bubble to inspect its details and navigate the network topological passport.
                </p>
              </div>
            )}
          </div>

          <div className="rounded-2xl bg-emerald-500/5 p-3.5 border border-emerald-500/10 text-[10px] text-zinc-400 leading-relaxed mt-6">
            <h4 className="font-semibold text-zinc-200 flex items-center gap-1 mb-1 font-mono uppercase tracking-wider text-[9px]">💡 Pro-Tip</h4>
            Drag bubbles close together to trigger strong structural repulsion, or click away to reset force-alignment vectors dynamically.
          </div>
        </div>

      </div>

    </div>
  );
}
