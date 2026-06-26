# CHANGELOG

---

# V2.0 (Current) - PhysicsScene AI Engine

Architecture upgrade: PhysicsScene becomes the single source of truth for the entire application.

Completed:
- PhysicsScene Schema v2.1: added TimelinePhase, TeacherStep, ChartDef types
- AI Parser package (@physics-lab/ai-parser): rule-based parser extracts physical quantities from text
- AIProvider interface: abstract parseProblem(), future-proof for Ollama/OpenAI/Claude/DeepSeek
- experiment.store.ts refactored: phases from scene, ballAcceleration tracking
- Timeline fully data-driven: renders phases from PhysicsScene.timeline.phases
- TeacherPanel data-driven: reads steps from PhysicsScene.teacher_steps
- Problem input wired to AI parser: text to PhysicsScene to simulation
- Free-fall scene v2.1: includes phases, teacher_steps, charts definitions
- 652 modules, 0 TypeScript errors

Architecture:
  Problem -> AI Parser -> PhysicsScene -> Timeline -> Experiment -> Teacher -> Charts -> UI

---

# V1.1 - UX Polish

- Timeline rebuild, 7-step Teacher flow, 3D arrows, 181 i18n keys
- Learning mode simplified, player controls upgraded

---

# V1.0 - Interactive Teaching Framework

- 3-mode system, TeacherPanel, trail sync, bounce physics fix
