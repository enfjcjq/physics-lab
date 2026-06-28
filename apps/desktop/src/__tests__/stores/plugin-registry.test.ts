import { describe, it, expect, beforeEach } from "vitest";
import { pluginRegistry } from "../../renderer/core/plugin-registry";
import { freeFallPlugin } from "../../renderer/plugins/free-fall/free-fall.plugin";

describe("Plugin Registry", () => {
  beforeEach(() => {
    // Register free-fall if not already
    if (!pluginRegistry.get("free-fall")) {
      pluginRegistry.register(freeFallPlugin);
    }
  });

  it("should register and retrieve a plugin", () => {
    const plugin = pluginRegistry.get("free-fall");
    expect(plugin).toBeDefined();
    expect(plugin?.id).toBe("free-fall");
  });

  it("should list registered plugins", () => {
    const plugins = pluginRegistry.list();
    expect(plugins.length).toBeGreaterThanOrEqual(1);
  });

  it("should return undefined for unknown plugin", () => {
    expect(pluginRegistry.get("nonexistent")).toBeUndefined();
  });

  it("should get default scene from plugin", () => {
    const plugin = pluginRegistry.get("free-fall");
    const scene = plugin?.getDefaultScene();
    expect(scene).toBeDefined();
    expect(scene?.metadata?.topic).toBeDefined();
  });

  it("should compute physics state", () => {
    const plugin = pluginRegistry.get("free-fall");
    const state = plugin?.computeState(0.5, { g: 9.8, h0: 10, mass: 2 });
    expect(state).toBeDefined();
    expect(state?.positions?.ball).toBeDefined();
    expect(state?.time).toBe(0.5);
  });

  it("should list by category", () => {
    const mechanics = pluginRegistry.listByCategory("mechanics");
    expect(mechanics.length).toBeGreaterThanOrEqual(1);
  });
});
