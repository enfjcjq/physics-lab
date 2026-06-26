import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo, useState } from "react";
import { pluginRegistry } from "../../core/plugin-registry";
import { useI18n } from "../../core/i18n";
const CATEGORY_COLORS = {
    Kinematics: "#3b82f6",
    Dynamics: "#8b5cf6",
    Forces: "#ef4444",
    Energy: "#f59e0b",
    Momentum: "#22c55e",
    Vectors: "#06b6d4",
    Concepts: "#ec4899",
    Mechanics: "#6366f1",
};
function collectKnowledgeGraph() {
    const nodes = [];
    const edges = [];
    const seen = new Set();
    for (const plugin of pluginRegistry.list()) {
        const points = plugin.getKnowledgePoints();
        for (const kp of points) {
            if (seen.has(kp.id))
                continue;
            seen.add(kp.id);
            nodes.push({
                id: kp.id,
                name: kp.name,
                category: kp.category || "Mechanics",
                x: 0, y: 0,
                mastered: kp.mastered ?? false,
            });
        }
    }
    // Build edges from prerequisites in PhysicsScene knowledge_tags
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
function layoutGraph(nodes, edges) {
    // Group nodes by category in columns
    const cats = [...new Set(nodes.map((n) => n.category))];
    const colW = 160;
    const rowH = 48;
    const startX = 60;
    const startY = 50;
    return nodes.map((n) => {
        const catIdx = cats.indexOf(n.category);
        const catNodes = nodes.filter((nn) => nn.category === n.category);
        const nodeIdx = catNodes.indexOf(n);
        return {
            ...n,
            x: startX + catIdx * colW,
            y: startY + nodeIdx * rowH,
        };
    });
}
export function KnowledgeGraph() {
    const { t } = useI18n();
    const [selectedNode, setSelectedNode] = useState(null);
    const [hoveredNode, setHoveredNode] = useState(null);
    const { nodes, edges } = useMemo(() => {
        const raw = collectKnowledgeGraph();
        const positioned = layoutGraph(raw.nodes, raw.edges);
        return { nodes: positioned, edges: raw.edges };
    }, []);
    const nodeMap = new Map(nodes.map((n) => [n.id, n]));
    const w = 700;
    const h = Math.max(300, Math.max(...nodes.map((n) => n.y)) + 80);
    const selectedEdges = selectedNode
        ? edges.filter((e) => e.source === selectedNode.id || e.target === selectedNode.id)
        : [];
    return (_jsxs("div", { className: "flex flex-col h-full", children: [_jsx("div", { className: "px-4 pt-3 pb-2 flex-shrink-0", children: _jsx("h2", { className: "text-xs font-semibold text-slate-400 uppercase tracking-wider", children: t("knowledge.title") }) }), _jsx("div", { className: "flex-1 overflow-auto px-2", children: _jsxs("svg", { viewBox: `0 0 ${w} ${h}`, className: "w-full", style: { minHeight: h }, children: [edges.map((e, i) => {
                            const s = nodeMap.get(e.source);
                            const tgt = nodeMap.get(e.target);
                            if (!s || !tgt)
                                return null;
                            const isHighlighted = hoveredNode === e.source || hoveredNode === e.target ||
                                selectedEdges.some((se) => se.source === e.source && se.target === e.target);
                            return (_jsxs("g", { children: [_jsx("line", { x1: s.x, y1: s.y, x2: tgt.x, y2: tgt.y, stroke: isHighlighted ? "#94a3b8" : "#334155", strokeWidth: isHighlighted ? 2 : 1, strokeDasharray: isHighlighted ? "none" : "4 2", opacity: isHighlighted ? 0.8 : 0.4 }), _jsx("polygon", { points: `${tgt.x - 5},${tgt.y - 3} ${tgt.x},${tgt.y} ${tgt.x - 5},${tgt.y + 3}`, fill: isHighlighted ? "#94a3b8" : "#475569", opacity: isHighlighted ? 0.8 : 0.4, transform: `rotate(${Math.atan2(tgt.y - s.y, tgt.x - s.x) * 180 / Math.PI}, ${tgt.x}, ${tgt.y})` })] }, i));
                        }), nodes.map((n) => {
                            const isSelected = selectedNode?.id === n.id;
                            const isHovered = hoveredNode === n.id;
                            const color = CATEGORY_COLORS[n.category] || "#6366f1";
                            const r = n.mastered ? 10 : 8;
                            return (_jsxs("g", { onMouseEnter: () => setHoveredNode(n.id), onMouseLeave: () => setHoveredNode(null), onClick: () => setSelectedNode(isSelected ? null : n), className: "cursor-pointer", children: [n.mastered && (_jsx("circle", { cx: n.x, cy: n.y, r: r + 4, fill: color, opacity: 0.15 })), _jsx("circle", { cx: n.x, cy: n.y, r: r, fill: n.mastered ? color : "#1e293b", stroke: isSelected ? "#fff" : isHovered ? color : n.mastered ? color : "#475569", strokeWidth: isSelected ? 2.5 : isHovered ? 2 : 1.5 }), _jsx("text", { x: n.x, y: n.y + r + 13, textAnchor: "middle", fill: isSelected || isHovered ? "#f1f5f9" : n.mastered ? "#cbd5e1" : "#64748b", fontSize: 10, fontWeight: isSelected ? 600 : 400, children: n.name })] }, n.id));
                        })] }) }), _jsx("div", { className: "px-4 py-2 border-t border-slate-800 flex-shrink-0 flex flex-wrap gap-2", children: Object.entries(CATEGORY_COLORS).map(([cat, color]) => (_jsxs("div", { className: "flex items-center gap-1", children: [_jsx("span", { className: "w-2 h-2 rounded-full", style: { backgroundColor: color } }), _jsx("span", { className: "text-[9px] text-slate-500", children: cat })] }, cat))) }), selectedNode && (_jsxs("div", { className: "px-4 py-2 border-t border-slate-800 flex-shrink-0", children: [_jsxs("div", { className: "flex items-center gap-2 mb-1", children: [_jsx("span", { className: "w-2.5 h-2.5 rounded-full", style: { backgroundColor: CATEGORY_COLORS[selectedNode.category] || "#6366f1" } }), _jsx("span", { className: "text-xs font-medium text-white", children: selectedNode.name }), _jsx("span", { className: "text-[9px] text-slate-500", children: selectedNode.category }), selectedNode.mastered && _jsx("span", { className: "text-[9px] text-emerald-400", children: "\u2713 mastered" })] }), selectedEdges.length > 0 && (_jsx("div", { className: "text-[9px] text-slate-500", children: selectedEdges.filter((e) => e.target === selectedNode.id).length > 0 && (_jsxs("span", { children: ["Prerequisites: ", selectedEdges.filter((e) => e.target === selectedNode.id).map((e) => nodeMap.get(e.source)?.name).filter(Boolean).join(", ")] })) }))] }))] }));
}
//# sourceMappingURL=KnowledgeGraph.js.map