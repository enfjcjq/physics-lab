class PluginRegistry {
    plugins = new Map();
    register(plugin) {
        if (this.plugins.has(plugin.id)) {
            console.warn("Plugin \"" + plugin.id + "\" is already registered. Overwriting.");
        }
        this.plugins.set(plugin.id, plugin);
    }
    get(id) {
        return this.plugins.get(id);
    }
    list() {
        return Array.from(this.plugins.values());
    }
    listByCategory(category) {
        return this.list().filter((p) => p.category === category);
    }
    getCategories() {
        return [...new Set(this.list().map((p) => p.category))];
    }
}
export const pluginRegistry = new PluginRegistry();
//# sourceMappingURL=plugin-registry.js.map