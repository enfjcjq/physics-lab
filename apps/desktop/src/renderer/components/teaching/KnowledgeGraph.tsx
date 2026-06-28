import { useMemo, useState } from "react";
import { pluginRegistry } from "../../core/plugin-registry";
import { useI18n } from "../../core/i18n";
import { useMastery, type MasteryEntry } from "../../core/mastery.store";

interface GraphNode {
  id: string;
  scopedId: string;
  name: string;
  category: string;
  pluginId: string;
  x: number;
  y: number;
  mastery: MasteryEntry | undefined;
}

interface GraphEdge {
  source: string;
  target: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  Kinematics: "#3b82f6", Dynamics: "#8b5cf6", Forces: "#ef4444", Energy: "#f59e0b",
  Momentum: "#22c55e", Vectors: "#06b6d4", Concepts: "#ec4899",
  mechanics: "#6366f1", electromagnetism: "#f59e0b", optics: "#06b6d4",
  thermodynamics: "#ef4444", waves: "#8b5cf6", modern: "#ec4899",
};

function masteryColor(entry: MasteryEntry | undefined): string {
  if (!entry || entry.attempts === 0) return "#475569";
  if (entry.mastered) return "#22c55e";
  if (entry.score >= 50) return "#f59e0b";
  return "#ef4444";
}

function masteryGlow(entry: MasteryEntry | undefined): number {
  if (!entry || !entry.mastered) return 0;
  return Math.min(entry.score / 100, 1) * 0.3;
}

function collectGraph(): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  const seen = new Set<string>();
  const allEntries = useMastery.getState().getAll();

  for (const plugin of pluginRegistry.list()) {
    const points = plugin.getKnowledgePoints();
    for (const kp of points) {
      const scopedId = plugin.id + ":" + kp.id;
      if (seen.has(scopedId)) continue;
      seen.add(scopedId);
      nodes.push({
        id: kp.id,
        scopedId,
        name: kp.name,
        category: kp.category || "mechanics",
        pluginId: plugin.id,
        x: 0, y: 0,
        mastery: allEntries[scopedId] ?? allEntries[kp.id],
      });
    }
  }

  // Edges from knowledge_tags prerequisites
  for (const plugin of pluginRegistry.list()) {
    const scene = plugin.getDefaultScene();
    for (const kt of scene.knowledge_tags) {
      if (kt.prerequisites) {
        for (const pre of kt.prerequisites) {
          edges.push({ source: pre, target: kt.id });
        }
      }
    }
  }

  return { nodes, edges };
}

function layoutNodes(nodes: GraphNode[]): GraphNode[] {
  const cats = [...new Set(nodes.map((n) => n.category))];
  const colW = 150; const rowH = 46; const startX = 60; const startY = 50;
  return nodes.map((n) => {
    const catIdx = cats.indexOf(n.category);
    const catNodes = nodes.filter((nn) => nn.category === n.category);
    const nodeIdx = catNodes.indexOf(n);
    return { ...n, x: startX + catIdx * colW, y: startY + nodeIdx * rowH };
  });
}

export function KnowledgeGraph() {
  const { t } = useI18n();
  const entries = useMastery((s) => s.entries);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  const { nodes, edges } = useMemo(() => {
    const raw = collectGraph();
    const positioned = layoutNodes(raw.nodes);
    return { nodes: positioned, edges: raw.edges };
  }, [entries]);

  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  const w = 700;
  const h = Math.max(300, Math.max(...nodes.map((n) => n.y), 0) + 80);

  const selectedEdges = selectedNode
    ? edges.filter((e) => e.source === selectedNode.id || e.target === selectedNode.id)
    : [];

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-3 pb-2 flex-shrink-0 flex items-center justify-between">
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          {t("knowledge.title")}
        </h2>
        <span className="text-[10px] text-slate-600">
          {nodes.filter((n) => n.mastery?.mastered).length}/{nodes.length}
        </span>
      </div>

      <div className="flex-1 overflow-auto px-2">
        {nodes.length === 0 ? (
          <div className="flex items-center justify-center h-40 text-slate-600 text-xs">
            {t("knowledge.empty", "No knowledge points yet")}
          </div>
        ) : (
          <svg viewBox={"0 0 " + w + " " + h} className="w-full" style={{ minHeight: h }}>
            {/* Edges */}
            {edges.map((e, i) => {
              const s = nodeMap.get(e.source);
              const tgt = nodeMap.get(e.target);
              if (!s || !tgt) return null;
              const hl = hoveredNode === e.source || hoveredNode === e.target ||
                selectedEdges.some((se) => se.source === e.source && se.target === e.target);
              return (
                <g key={i}>
                  <line x1={s.x} y1={s.y} x2={tgt.x} y2={tgt.y}
                    stroke={hl ? "#94a3b8" : "#334155"}
                    strokeWidth={hl ? 2 : 1} strokeDasharray={hl ? "none" : "4 2"}
                    opacity={hl ? 0.8 : 0.4} />
                  <polygon
                    points={[tgt.x - 5, tgt.y - 3, tgt.x, tgt.y, tgt.x - 5, tgt.y + 3].join(",")}
                    fill={hl ? "#94a3b8" : "#475569"} opacity={hl ? 0.8 : 0.4} />
                </g>
              );
            })}

            {/* Nodes */}
            {nodes.map((n) => {
              const isSelected = selectedNode?.scopedId === n.scopedId;
              const isHovered = hoveredNode === n.id;
              const m = n.mastery;
              const color = CATEGORY_COLORS[n.category] || "#6366f1";
              const r = m?.mastered ? 11 : 8;
              const glow = masteryGlow(m);

              return (
                <g key={n.scopedId}
                  onMouseEnter={() => setHoveredNode(n.id)}
                  onMouseLeave={() => setHoveredNode(null)}
                  onClick={() => setSelectedNode(isSelected ? null : n)}
                  className="cursor-pointer">
                  {/* Glow */}
                  {glow > 0 && <circle cx={n.x} cy={n.y} r={r + 6} fill={color} opacity={glow} />}
                  {/* Score ring */}
                  {m && m.attempts > 0 && (
                    <circle cx={n.x} cy={n.y} r={r + 3} fill="none"
                      stroke={masteryColor(m)} strokeWidth={2} strokeDasharray={2 * Math.PI * (r + 3)}
                      strokeDashoffset={2 * Math.PI * (r + 3) * (1 - m.score / 100)}
                      strokeLinecap="round" opacity={0.6}
                      transform={"rotate(-90 " + n.x + " " + n.y + ")"} />
                  )}
                  {/* Node circle */}
                  <circle cx={n.x} cy={n.y} r={r}
                    fill={m?.mastered ? color : "#1e293b"}
                    stroke={isSelected ? "#fff" : isHovered ? color : masteryColor(m)}
                    strokeWidth={isSelected ? 2.5 : isHovered ? 2 : 1.5} />
                  {/* Checkmark for mastered */}
                  {m?.mastered && (
                    <text x={n.x} y={n.y + 1} textAnchor="middle" fill="#fff" fontSize={9}>{"\u2713"}</text>
                  )}
                  {/* Label */}
                  <text x={n.x} y={n.y + r + 13} textAnchor="middle"
                    fill={isSelected || isHovered ? "#f1f5f9" : m?.mastered ? "#cbd5e1" : "#64748b"}
                    fontSize={10} fontWeight={isSelected ? 600 : 400}>
                    {n.name}
                  </text>
                </g>
              );
            })}
          </svg>
        )}
      </div>

      {/* Legend */}
      <div className="px-4 py-2 border-t border-slate-800 flex-shrink-0 flex flex-wrap gap-2">
        {Object.entries(CATEGORY_COLORS).slice(0, 8).map(([cat, color]) => (
          <div key={cat} className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
            <span className="text-[9px] text-slate-500">{cat}</span>
          </div>
        ))}
      </div>

      {/* Selected node detail card */}
      {selectedNode && (
        <div className="px-4 py-3 border-t border-slate-800 flex-shrink-0 space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: CATEGORY_COLORS[selectedNode.category] || "#6366f1" }} />
            <span className="text-xs font-medium text-white">{selectedNode.name}</span>
            <span className="text-[9px] text-slate-500">{selectedNode.category}</span>
          </div>
          {selectedNode.mastery && selectedNode.mastery.attempts > 0 ? (
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-slate-800/50 rounded-lg p-1.5">
                <div className="text-xs font-bold text-white">{selectedNode.mastery.score}%</div>
                <div className="text-[8px] text-slate-500">{t("dashboard.kps_mastered", "score")}</div>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-1.5">
                <div className="text-xs font-bold text-white">{selectedNode.mastery.correct}/{selectedNode.mastery.attempts}</div>
                <div className="text-[8px] text-slate-500">correct</div>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-1.5">
                <div className="text-xs font-bold text-white">
                  {selectedNode.mastery.lastAttempted ? new Date(selectedNode.mastery.lastAttempted).toLocaleDateString() : "-"}
                </div>
                <div className="text-[8px] text-slate-500">last</div>
              </div>
            </div>
          ) : (
            <p className="text-[10px] text-slate-600">{t("knowledge.not_attempted", "Not yet attempted")}</p>
          )}
          {selectedEdges.filter((e) => e.target === selectedNode.id).length > 0 && (
            <div className="text-[9px] text-slate-500">
              Prerequisites: {selectedEdges.filter((e) => e.target === selectedNode.id)
                .map((e) => nodeMap.get(e.source)?.name).filter(Boolean).join(", ")}
            </div>
          )}
        </div>
      )}
    </div>
  );
}