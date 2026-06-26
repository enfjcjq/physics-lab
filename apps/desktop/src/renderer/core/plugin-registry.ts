import type { PhysicsPlugin, PhysicsCategory } from "@physics-lab/shared";

class PluginRegistry {
  private plugins = new Map<string, PhysicsPlugin>();

  register(plugin: PhysicsPlugin): void {
    if (this.plugins.has(plugin.id)) {
      console.warn("Plugin \"" + plugin.id + "\" is already registered. Overwriting.");
    }
    this.plugins.set(plugin.id, plugin);
  }

  get(id: string): PhysicsPlugin | undefined {
    return this.plugins.get(id);
  }

  list(): PhysicsPlugin[] {
    return Array.from(this.plugins.values());
  }

  listByCategory(category: PhysicsCategory): PhysicsPlugin[] {
    return this.list().filter((p) => p.category === category);
  }

  getCategories(): PhysicsCategory[] {
    return [...new Set(this.list().map((p) => p.category))];
  }
}

export const pluginRegistry = new PluginRegistry();
