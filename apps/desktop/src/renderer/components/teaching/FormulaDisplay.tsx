import { useMemo } from "react";

/**
 * Renders a physics formula string as styled HTML with proper mathematical notation.
 * Supports inline replacements for common math symbols and subscripts/superscripts.
 *
 * Input: "y = h₀ − ½gt²"
 * Output: <span className="formula">styled JSX</span>
 */

interface FormulaDisplayProps {
  formula: string;
  className?: string;
}

const SYMBOL_MAP: Record<string, string> = {
  // Greek letters
  "θ": "θ", "α": "α", "β": "β", "γ": "γ", "μ": "μ", "Σ": "Σ",
  "π": "π", "ω": "ω", "Δ": "Δ", "Ω": "Ω", "τ": "τ", "φ": "φ",
  // Math operators
  "√": "√", "∑": "∑", "∏": "∏", "∫": "∫", "∂": "∂", "∞": "∞",
  "≈": "≈", "≠": "≠", "≤": "≤", "≥": "≥", "±": "±", "→": "→",
  "⇒": "⇒", "⇔": "⇔", "·": "·", "×": "×", "÷": "÷",
  // Subscripts
  "₀": "₀", "₁": "₁", "₂": "₂", "₃": "₃", "₄": "₄", "₅": "₅", "₆": "₆", "₇": "₇", "₈": "₈", "₉": "₉",
  "ₘ": "ₘ", "ₐ": "ₐ", "ₑ": "ₑ", "ₓ": "ₓ", "ₙ": "ₙ",
  // Superscripts
  "⁰": "⁰", "¹": "¹", "²": "²", "³": "³", "⁴": "⁴", "⁵": "⁵", "⁶": "⁶", "⁷": "⁷", "⁸": "⁸", "⁹": "⁹",
  "ⁿ": "ⁿ", "ⁱ": "ⁱ",
  // Fractions
  "½": "½", "⅓": "⅓", "¼": "¼", "¾": "¾", "⅔": "⅔",
  // Arrows
  "↑": "↑", "↓": "↓", "←": "←", "↔": "↔",
  // Dashes
  "−": "−", "–": "–", "—": "—",
};

export function FormulaDisplay({ formula, className }: FormulaDisplayProps) {
  const segments = useMemo(() => {
    if (!formula) return [];

    // Split by variable references: h0, v0, vx, vy, t2, etc.
    // We"ll tokenize the formula into text and highlight segments
    const parts: Array<{ type: "text" | "var" | "num" | "op"; value: string }> = [];
    let remaining = formula;

    // Regex to match math tokens
    const tokenRegex = /\s*([a-zA-Z₀₋₉⁰⁻⁹][₀₋₉⁰⁻⁹ₓₙₐₘₑₓ]*|[\d.]+|√|∑|∫|∂|−|[+\-*/=<>→⇒⇔≈≠≤≥±·×]|\(|\)|\[|\]|\{|\}|,|;|\.{3}|→|↑|↓)\s*/g;

    let match;
    let lastIndex = 0;
    while ((match = tokenRegex.exec(formula)) !== null) {
      if (match.index > lastIndex) {
        // Text between tokens
        const text = formula.slice(lastIndex, match.index).trim();
        if (text) parts.push({ type: "text", value: text });
      }
      const token = match[1].trim();
      if (!token) continue;

      // Classify token
      if (/^[a-zA-Z][₀₋₉⁰⁻⁹ₓₙₐₘₑₓ]*$/.test(token) || /^[A-Z][a-z]*$/.test(token)) {
        if (token.length > 1 && token[0] === token[0].toUpperCase()) {
          parts.push({ type: "text", value: token });
        } else {
          parts.push({ type: "var", value: token });
        }
      } else if (/^[\d.]+$/.test(token)) {
        parts.push({ type: "num", value: token });
      } else {
        parts.push({ type: "op", value: token });
      }
      lastIndex = match.index + match[1].length;
    }

    if (lastIndex < formula.length) {
      parts.push({ type: "text", value: formula.slice(lastIndex).trim() });
    }

    return parts;
  }, [formula]);

  if (!formula) return null;

  return (
    <span className={`formula-display font-mono ${className ?? ""}`}>
      {segments.map((seg, i) => {
        switch (seg.type) {
          case "var":
            return <span key={i} className="formula-var italic" style={{ color: "var(--color-accent-info, #00D4FF)" }}>{seg.value}</span>;
          case "num":
            return <span key={i} className="formula-num text-amber-300">{seg.value}</span>;
          case "op":
            return <span key={i} className="formula-op text-slate-400">{seg.value}</span>;
          default:
            return <span key={i} className="formula-text text-slate-200">{seg.value}</span>;
        }
      })}
    </span>
  );
}

/** Convenience wrapper for inline formula display */
export function InlineFormula({ formula }: { formula: string }) {
  return <FormulaDisplay formula={formula} className="inline text-xs whitespace-nowrap" />;
}

/** Block-level formula with background */
export function FormulaBlock({ formula }: { formula: string }) {
  return (
    <div className="mt-2 px-3 py-2 bg-slate-900/80 border border-slate-700/40 rounded-lg">
      <FormulaDisplay formula={formula} className="block text-sm text-center" />
    </div>
  );
}

