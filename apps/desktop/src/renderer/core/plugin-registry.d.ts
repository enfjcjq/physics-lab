import type { PhysicsPlugin, PhysicsCategory } from "@physics-lab/shared";
declare class PluginRegistry {
    private plugins;
    register(plugin: PhysicsPlugin): void;
    get(id: string): PhysicsPlugin | undefined;
    list(): PhysicsPlugin[];
    listByCategory(category: PhysicsCategory): PhysicsPlugin[];
    getCategories(): PhysicsCategory[];
}
export declare const pluginRegistry: PluginRegistry;
export {};
//# sourceMappingURL=plugin-registry.d.ts.map