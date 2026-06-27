import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from "react";
export class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: "" };
    }
    static getDerivedStateFromError(error) {
        return { hasError: true, error: error.message };
    }
    componentDidCatch(error, info) {
        console.error("Physics Lab Error:", error, info);
    }
    render() {
        if (this.state.hasError) {
            return (_jsxs("div", { style: { width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#020617", color: "#94a3b8", flexDirection: "column", gap: 16, fontFamily: "sans-serif" }, children: [_jsx("div", { style: { fontSize: 48 }, children: "?" }), _jsx("h2", { style: { color: "#f1f5f9", fontSize: 18 }, children: "Physics Lab Error" }), _jsx("p", { style: { fontSize: 13, maxWidth: 400, textAlign: "center", color: "#64748b" }, children: this.state.error }), _jsx("button", { onClick: () => { this.setState({ hasError: false }); window.location.reload(); }, style: { padding: "8px 24px", borderRadius: 8, background: "#0ea5e9", color: "white", border: "none", cursor: "pointer", fontSize: 14 }, children: "Reload" })] }));
        }
        return this.props.children;
    }
}
//# sourceMappingURL=ErrorBoundary.js.map