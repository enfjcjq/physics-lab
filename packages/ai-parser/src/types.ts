import type { PhysicsScene } from "@physics-lab/shared";

// ============================================================
// AI Provider Interface
// All AI backends implement this. Switch backends without
// changing any business logic.
// ============================================================

export interface ParseResult {
  /** The generated PhysicsScene, or null on failure */
  scene: PhysicsScene | null;
  /** Whether the parse was successful */
  success: boolean;
  /** Human-readable error if failed */
  error?: string;
  /** Which provider generated this */
  provider: string;
  /** Time taken in ms */
  durationMs: number;
  /** Confidence score 0-1 */
  confidence?: number;
}

export interface AIProvider {
  /** Unique provider ID */
  id: string;
  /** Display name */
  name: string;
  /** Whether this provider is available (e.g., Ollama installed) */
  isAvailable: () => Promise<boolean>;

  /**
   * Parse a physics problem description into a PhysicsScene.
   * @param text - Natural language problem description
   * @param existingScene - Optional existing scene to update
   */
  parseProblem: (text: string, existingScene?: PhysicsScene) => Promise<ParseResult>;
}

// ============================================================
// AI Provider Registry
// ============================================================

class AIProviderRegistry {
  private providers = new Map<string, AIProvider>();
  private activeId: string | null = null;

  register(provider: AIProvider): void {
    this.providers.set(provider.id, provider);
  }

  get(id: string): AIProvider | undefined {
    return this.providers.get(id);
  }

  list(): AIProvider[] {
    return Array.from(this.providers.values());
  }

  setActive(id: string): void {
    if (!this.providers.has(id)) {
      throw new Error(`AI provider "${id}" not registered`);
    }
    this.activeId = id;
  }

  getActive(): AIProvider | undefined {
    if (!this.activeId) return undefined;
    return this.providers.get(this.activeId);
  }
}

export const aiRegistry = new AIProviderRegistry();
