import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { CloudProvider } from "@physics-lab/ai-parser";

const okScene = {
  version: "2.0",
  metadata: { title: "Free fall", subject: "mechanics", topic: "free_fall" },
  entities: [{ id: "ball", type: "ball", position: [0, 10, 0], properties: { mass: 2 } }],
  timeline: { total_duration: 3, events: [], phases: [] },
};

function mockFetchOnce(status: number, body: unknown) {
  return vi.fn(async () => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } }));
}

describe("CloudProvider (S85)", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", mockFetchOnce(200, { choices: [{ message: { content: JSON.stringify(okScene) } }] }));
  });
  afterEach(() => vi.unstubAllGlobals());

  it("requires an api key to be available", async () => {
    const p = new CloudProvider({ baseUrl: "https://x/v1", apiKey: "" });
    expect(await p.isAvailable()).toBe(false);
  });

  it("parses a valid scene from an OpenAI-compatible response", async () => {
    const p = new CloudProvider({ baseUrl: "https://x/v1", apiKey: "sk-test", model: "m" });
    const res = await p.parseProblem("A ball is dropped from 10 m");
    expect(res.success).toBe(true);
    expect(res.scene?.metadata.topic).toBe("free_fall");
  });

  it("returns an honest error for unsupported problems", async () => {
    vi.stubGlobal("fetch", mockFetchOnce(200, { choices: [{ message: { content: JSON.stringify({ unsupported: true }) } }] }));
    const p = new CloudProvider({ baseUrl: "https://x/v1", apiKey: "sk-test" });
    const res = await p.parseProblem("weird unsupported thing");
    expect(res.success).toBe(false);
    expect(res.error).toContain("不能可靠生成");
  });

  it("degrades honestly on HTTP failure", async () => {
    vi.stubGlobal("fetch", mockFetchOnce(401, { error: "unauthorized" }));
    const p = new CloudProvider({ baseUrl: "https://x/v1", apiKey: "sk-bad" });
    const res = await p.parseProblem("A ball is dropped from 10 m");
    expect(res.success).toBe(false);
    expect(res.error).toContain("HTTP 401");
  });
});
