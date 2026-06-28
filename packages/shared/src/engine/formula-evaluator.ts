/**
 * Formula Evaluator — safe math expression evaluator
 * 
 * Evaluates physics formulas like "h0 - 0.5 * g * t * t" 
 * with a given set of variable bindings.
 */

const MATH_SYMBOLS: Record<string, number | ((...args: number[]) => number)> = {
  sin: Math.sin, cos: Math.cos, tan: Math.tan,
  asin: Math.asin, acos: Math.acos, atan: Math.atan, atan2: Math.atan2,
  sqrt: Math.sqrt, abs: Math.abs, min: Math.min, max: Math.max,
  floor: Math.floor, ceil: Math.ceil, round: Math.round,
  exp: Math.exp, log: Math.log, pow: Math.pow, sign: Math.sign,
  PI: Math.PI, E: Math.E,
};

export interface FormulaContext {
  [varName: string]: number;
}

export function evaluate(expression: string, context: FormulaContext): number {
  const trimmed = expression.trim();
  if (!trimmed) return 0;
  const mathBindings = Object.keys(MATH_SYMBOLS).map(k => 'const ' + k + ' = Math.' + k + ';').join(' ');
  const varBindings = Object.entries(context).map(([k, v]) => 'const ' + k + ' = ' + v + ';').join(' ');
  const fnBody = '"use strict"; ' + mathBindings + ' ' + varBindings + ' return (' + trimmed + ');';
  try {
    const fn = new Function(fnBody);
    const result = fn();
    if (typeof result !== 'number' || !isFinite(result)) return 0;
    return result;
  } catch (err) {
    console.error('[FormulaEval] Failed:', trimmed, err);
    return 0;
  }
}

export function evaluateAll(
  formulas: Record<string, string>,
  context: FormulaContext
): Record<string, number> {
  const result: Record<string, number> = {};
  for (const [key, expr] of Object.entries(formulas)) {
    result[key] = evaluate(expr, context);
  }
  return result;
}
