// ============================================================
// Safe numeric expression evaluator for FormulaStrip.
// Pure function: no DOM, no side effects -> unit-testable.
//
// Supports: + - * / ^ ( ) unary - , numbers, constants PI/E,
// functions sqrt/sin/cos/tan/abs/exp/ln/log.
// Returns null on any parse/evaluation error (never throws).
// ============================================================

/** Normalize a formula fragment into an evaluable expression. */
export function normalizeExpression(input: string): string {
  let s = input.trim();
  // Keep only the right-hand side after the last "=" if present
  const eq = s.lastIndexOf("=");
  if (eq >= 0) s = s.slice(eq + 1);
  s = s
    .replace(/×/g, "*")
    .replace(/·/g, "*")
    .replace(/−/g, "-")
    .replace(/–/g, "-")
    .replace(/÷/g, "/")
    .replace(/√/g, "sqrt(")
    .replace(/π/g, "PI")
    .replace(/²/g, "^2")
    .replace(/³/g, "^3");
  // Light implicit multiplication: 2PI -> 2*PI, 3(4) -> 3*(4)
  s = s.replace(/(\d)([a-zA-Z(])/g, "$1*$2").replace(/\)([a-zA-Z(])/g, ")*$1");
  return s.trim();
}

/** Evaluate a formula fragment (after variable substitution). */
export function evaluateExpression(input: string): number | null {
  const src = normalizeExpression(input);
  if (!src) return null;
  try {
    const p = new Parser(src);
    const value = p.parse();
    return Number.isFinite(value) ? value : null;
  } catch {
    return null;
  }
}

class Parser {
  private pos = 0;
  constructor(private readonly src: string) {}

  private peek(): string {
    this.skipWs();
    return this.src[this.pos] ?? "";
  }

  private skipWs(): void {
    while (this.src[this.pos] === ' ' || this.src[this.pos] === '\u0009') this.pos++;
  }
  parse(): number {
    const v = this.expr();
    if (this.pos < this.src.length) throw new Error("Unexpected token");
    return v;
  }

  private expr(): number {
    let v = this.term();
    while (this.peek() === "+" || this.peek() === "-") {
      const op = this.peek();
      this.pos++;
      const r = this.term();
      v = op === "+" ? v + r : v - r;
    }
    return v;
  }

  private term(): number {
    let v = this.factor();
    while (this.peek() === "*" || this.peek() === "/") {
      const op = this.peek();
      this.pos++;
      const r = this.factor();
      v = op === "*" ? v * r : v / r;
    }
    return v;
  }

  private factor(): number {
    const v = this.unary();
    if (this.peek() === "^") {
      this.pos++;
      const exp = this.factor(); // right-associative
      return Math.pow(v, exp);
    }
    return v;
  }

  private unary(): number {
    if (this.peek() === "+") {
      this.pos++;
      return this.unary();
    }
    if (this.peek() === "-") {
      this.pos++;
      return -this.unary();
    }
    return this.primary();
  }

  private primary(): number {
    const c = this.peek();
    if (c === "(") {
      this.pos++;
      const v = this.expr();
      if (this.peek() !== ")") throw new Error("Expected )");
      this.pos++;
      return v;
    }
    if (/[a-zA-Z]/.test(c)) return this.funcOrConst();
    if (/[\d.]/.test(c)) return this.number();
    throw new Error("Unexpected char: " + c);
  }

  private funcOrConst(): number {
    const name = this.readIdent();
    if (name === "PI") return Math.PI;
    if (name === "E") return Math.E;
    if (this.peek() !== "(") throw new Error("Expected ( after " + name);
    this.pos++;
    const arg = this.expr();
    if (this.peek() !== ")") throw new Error("Expected ) after " + name);
    this.pos++;
    switch (name) {
      case "sqrt": return Math.sqrt(arg);
      case "sin": return Math.sin(arg);
      case "cos": return Math.cos(arg);
      case "tan": return Math.tan(arg);
      case "abs": return Math.abs(arg);
      case "exp": return Math.exp(arg);
      case "ln": return Math.log(arg);
      case "log": return Math.log10(arg);
      default: throw new Error("Unknown function: " + name);
    }
  }

  private number(): number {
    const m = this.src.slice(this.pos).match(/^\d+(?:\.\d+)?/);
    if (!m) throw new Error("Bad number");
    this.pos += m[0].length;
    return parseFloat(m[0]);
  }

  private readIdent(): string {
    const m = this.src.slice(this.pos).match(/^[a-zA-Z]+/);
    if (!m) throw new Error("Bad identifier");
    this.pos += m[0].length;
    return m[0];
  }
}

