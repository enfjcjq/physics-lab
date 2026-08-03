# AI Parser E2E Test Set (T310)

- `cases.ts` — 50 道中/英物理题（类型 + 关键参数断言），覆盖 18 种场景。
- `run-e2e.ts` — 运行器：输出 JSON 覆盖率报告（stdout），Ollama 可用时自动对比。
- `last-report.json` — 最近一次运行结果快照。

## 运行

```bash
npx vite-node -c vitest.config.ts packages/ai-parser/test-cases/run-e2e.ts
```

## 门禁

`apps/desktop/src/__tests__/ai-parser/rule-parser.test.ts` 将覆盖率固化为单测：
类型命中率与参数命中率均须 ≥ 90%（S70 前基线：24% / 35.7%）。
