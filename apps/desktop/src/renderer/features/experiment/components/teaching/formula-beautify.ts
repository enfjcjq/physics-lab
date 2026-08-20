// ============================================================
// S83 rule 4: academic formula typesetting (pure function).
// y(t)=v0*sin(theta)*t-(1/2)*g*t^2  ->  y(t) = v₀ sinθ·t − ½gt²
// Covers FormulaStrip / FormulaHTML / teacher panel / export.
// ============================================================

const GREEK: Record<string, string> = {
  theta: "θ", omega: "ω", tau: "τ", phi: "φ", alpha: "α", beta: "β",
  gamma: "γ", delta: "δ", mu: "μ", pi: "π", sigma: "σ", lambda: "λ", rho: "ρ",
};

const SUBS: Record<string, string> = {
  v0: "v₀", v1: "v₁", v2: "v₂", h0: "h₀", t0: "t₀", x0: "x₀", y0: "y₀",
  omega0: "ω₀", theta0: "θ₀", phi0: "φ₀", a0: "a₀", n0: "n₀", l0: "L₀", L0: "L₀",
};

const FRACTIONS: Record<string, string> = {
  "(1/2)": "½", "(1/3)": "⅓", "(2/3)": "⅔", "(1/4)": "¼", "(3/4)": "¾",
};

const SUP: Record<string, string> = {
  "2": "²", "3": "³", "4": "⁴", "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹", "n": "ⁿ", "t": "ᵗ",
};

/** Convert a formula expression into readable math notation. */
export function beautifyFormula(input: string): string {
  if (!input) return "";
  let s = " " + input + " ";
  // fractions first (they contain *) 
  for (const [k, v] of Object.entries(FRACTIONS)) s = s.split(k).join(v);
  // Greek names -> symbols
  for (const [k, v] of Object.entries(GREEK)) s = s.split(k).join(v);
  // subscripts (v0 -> v₀); must run before exponent handling
  for (const [k, v] of Object.entries(SUBS)) s = s.split(k).join(v);
  // exponentiation: t^2 -> t²
  s = s.replace(/\^([0-9n])\b/g, (_, d) => SUP[d] ?? ("^" + d));
  s = s.replace(/\^\{([0-9n]+)\}/g, (_, d) => d.split("").map((c: string) => SUP[c] ?? c).join(""));
  // functions: sin( -> sin, sqrt( -> √
  s = s.replace(/sin\s*\(/g, "sin ");
  s = s.replace(/cos\s*\(/g, "cos ");
  s = s.replace(/tan\s*\(/g, "tan ");
  s = s.replace(/sqrt\s*\(/g, "√");
  // implicit multiplication: 2x / g*t / v₀·t -> use · (but keep digit-symbol boundaries)
  s = s.replace(/([0-9₀-₉])\s*\*\s*([A-Za-zθωτφμ])/g, "$1·$2");
  s = s.replace(/([A-Za-zθωτφμ])\s*\*\s*([A-Za-zθωτφμ])/g, "$1·$2");
  s = s.replace(/\s*\*\s*/g, "·");
  // minus sign
  s = s.replace(/\s*-\s*/g, " − ");
  s = s.replace(/[=]/, " = ");
  // collapse spaces, trim
  return s.replace(/\s+/g, " ").replace(/\s+/g, " ").trim();
}
