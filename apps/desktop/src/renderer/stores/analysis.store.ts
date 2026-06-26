import { create } from "zustand";

interface ForceItem {
  name: string;
  symbol: string;
  direction: string;
  magnitude: string;
  description: string;
}

interface MotionStep {
  title: string;
  content: string;
  formula?: string;
}

interface DerivationStep {
  step: number;
  title: string;
  formula: string;
  explanation: string;
}

interface KnowledgePoint {
  id: string;
  name: string;
  category: string;
  mastered: boolean;
}

interface AnalysisState {
  forces: ForceItem[];
  motionSteps: MotionStep[];
  derivation: DerivationStep[];
  knowledgePoints: KnowledgePoint[];
  commonMistakes: string[];
  learningTips: string[];
  finalAnswer: string;
}

const DATA: AnalysisState = {
  forces: [
    {
      name: "Gravity (G)",
      symbol: "G",
      direction: "Downward",
      magnitude: "G = mg = 2 x 10 = 20N",
      description: "Only gravity acts on the ball. Air resistance is ignored (free fall condition).",
    },
  ],
  motionSteps: [
    { title: "Motion Type", content: "Initial velocity is zero, only gravity acts. Constant acceleration g downward.", formula: "a = g = 10 m/s^2" },
    { title: "Displacement Formula", content: "Set origin at release point, positive direction downward.", formula: "h = (1/2)gt^2" },
    { title: "Velocity Formula", content: "From constant acceleration equations.", formula: "v = gt" },
    { title: "Impact Time", content: "Substitute h=10m, g=10m/s^2 into displacement formula.", formula: "t = sqrt(2h/g) = sqrt(2) = 1.41s" },
  ],
  derivation: [
    { step: 1, title: "Known values", formula: "h = 10m, m = 2kg, g = 10m/s^2, v0 = 0", explanation: "List all known physical quantities from the problem." },
    { step: 2, title: "Choose formula", formula: "v^2 - v0^2 = 2gh", explanation: "Use velocity-displacement relation (no time variable needed)." },
    { step: 3, title: "Substitute values", formula: "v^2 = 2 x 10 x 10 = 200", explanation: "Plug in v0=0, g=10, h=10." },
    { step: 4, title: "Final result", formula: "v = sqrt(200) = 14.14 m/s", explanation: "Impact velocity is about 14.14 m/s downward." },
  ],
  knowledgePoints: [
    { id: "kp1", name: "Free Fall", category: "Kinematics", mastered: true },
    { id: "kp2", name: "Constant Acceleration", category: "Kinematics", mastered: true },
    { id: "kp3", name: "Newton's 2nd Law", category: "Dynamics", mastered: false },
    { id: "kp4", name: "Conservation of Energy", category: "Energy", mastered: false },
    { id: "kp5", name: "Gravitational PE", category: "Energy", mastered: true },
  ],
  commonMistakes: [
    "Forgetting that initial velocity is zero in free fall",
    "Confusing displacement with distance traveled",
    "Unit conversion errors (e.g., cm not converted to m)",
    "Sign errors with g direction",
  ],
  learningTips: [
    "Free fall is the best introductory case for constant acceleration motion.",
    "Verify your result using energy conservation: mgh = (1/2)mv^2.",
    "Try changing the height parameter (5m, 20m) to observe nonlinear relationships.",
  ],
  finalAnswer: "Impact time: t = 1.41s, Impact velocity: v = 14.14 m/s downward.",
};

export const useAnalysisStore = create<AnalysisState>(() => ({ ...DATA }));
