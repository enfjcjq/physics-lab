import type { PhysicsScene } from "@physics-lab/shared";
declare const api: {
    readonly scene: {
        readonly getDefault: () => Promise<PhysicsScene>;
    };
    readonly platform: NodeJS.Platform;
};
export type PhysicsLabAPI = typeof api;
export {};
//# sourceMappingURL=index.d.ts.map