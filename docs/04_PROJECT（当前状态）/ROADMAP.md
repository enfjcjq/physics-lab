# Roadmap

## 【方向修正 · 2026-08-03 · 最高优先级】

项目重新定位为 **Physics AI Engine —— AI物理教学动画生成引擎**。

唯一核心主线：`输入题目（文本/图片/OCR/PDF） → AI理解 → 物理模型 → PhysicsScene → 自动生成教学动画 → 学生理解物理规律`。

从下一阶段起，所有 Sprint 规划必须按以下优先级分配资源：

### Phase 7: 核心引擎闭环 (P1) -- NEXT（最高优先级）
- [ ] AI物理题目解析能力强化：任意题目（文本/图片/OCR/PDF）→ PhysicsScene，解析覆盖率与准确率可度量
- [ ] 教学动画生成器：PhysicsScene → 自动编排的教学动画（阶段化脚本、镜头、讲解）
- [ ] Hybrid 2D + 3D 渲染：3D模式理解空间结构；教学模式自动切换为清晰2D视角（教材动画 + Manim风格 + Three.js交互空间）
- [ ] 动画解释重点：为什么运动、为什么受力、公式如何产生（非仅展示运动）

### Phase 8: 动画教学体验 (P2)
- [ ] Timeline 阶段化（phase 驱动的教学节奏）
- [ ] 物理过程逐步解释（teacher_steps 与动画同步）
- [ ] 受力动态展示、公式推导动画、数据随时间变化

### Phase 9: 交互能力 (P3)
- [ ] 参数实时调整、视角变化、3D探索（叠加在教学动画之上）

### Phase 10: 实验室扩展 (P4)
- [ ] 自定义实验、模拟器、多实验插件、插件市场（仅作为扩展能力，不再作为主线）

历史 Phase 成果（下述）全部保留：已建成的 18 个实验、Timeline、Teacher、导出、学习系统是未来引擎的承载基础，但其定位从“产品本体”调整为“教学动画的交互扩展层”。

---

## Phase 1-3: Foundation (S01-S10) -- COMPLETED
- Core architecture, 4 experiments, charts, quiz, knowledge graph

## Phase 4: True Product (S11-S15) -- COMPLETED
- [x] S11: Welcome screen, About dialog, Spring-mass (5th experiment)
- [x] S12: FrameCache architecture (instant timeline scrubbing)
- [x] S13: Teaching flow data-driven (Overlay + Panel sync)
- [x] S14: UI polish (cards, animations, visual hierarchy)
- [x] S15: Build optimization (Three.js split, 90% bundle reduction)

## Phase 5: AI Integration (V2.x) -- COMPLETED
- [x] Ollama/LLM integration (AIProvider interface, OllamaProvider, auto-detect)
- [x] AI problem parser (rule-based + natural language -> PhysicsScene)
- [x] Auto-generated teacher steps per experiment (data-driven TeacherPanel)
- [ ] Adaptive difficulty based on student performance

## Phase 5.5: Content Expansion (S30-S66) -- COMPLETED
- [x] 17 experiments: mechanics, electromagnetism (Coulomb, Ohm, Faraday, Motor),
      thermodynamics (Ideal Gas), optics (Refraction, Lens), waves (Wave, Doppler)
- [x] Export system (PDF/MD/HTML/CSV/Screenshot)
- [x] i18n: 924 zh-CN / 924 en-US keys

## Phase 6: Platform (V3.0+) -- REPRIORITIZED (2026-08-03)
（本阶段平台功能整体降为 P4 扩展；其中 OCR 输入上调至 P1，因为它属于“任意题目输入”核心链路。）
- [ ] Visualization polish for new experiments (S67: flux lines, commutator, P-V diagram, ray diagram) -- 并入 P2 动画教学体验
- [ ] 20+ experiment plugins (AC generator, transformer, SHM detailed, quantum basics) -- 降为 P4 扩展
- [ ] User accounts (local first) -- 降为 P4 扩展
- [ ] OCR input for problem images -- 上调至 P1 核心链路（题目输入）
- [ ] Student progress persistence (IndexedDB) -- P4
- [ ] Experiment comparison (side-by-side) -- P4
- [ ] Classroom management features -- P4
- [ ] Community plugin marketplace -- P4
