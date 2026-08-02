// ============================================================================
// File : src/store/Promptstore.ts
//
// Single source of truth for Prompt Library data. The UI never holds a copy
// of prompt content - it only ever holds a selected id and reads everything
// else (title/prompt/negativePrompt/timestamps) through this store, and all
// mutations (create/update/remove) go through it too.
//
// Persistence: every mutation is written straight to localStorage so the
// library survives an app restart with no separate "save" step required
// from the UI - it reloads automatically the next time this module is
// imported (app startup).
// ============================================================================

import legacyPrompts from "../data/prompts.json";
import {
    LegacyPromptItem,
    PromptDraft,
    PromptItem,
} from "../types/Prompt";

const STORAGE_KEY = "gpt-image-studio-prompt-library";

/**
 * src/data/prompts.json predates the Prompt Library redesign and uses the
 * old { id: number, category, content } shape. Migrate it once, only when
 * there is no persisted library yet, so a fresh install still starts with
 * something in the library instead of empty.
 */
function migrateLegacyPrompt(legacy: LegacyPromptItem): PromptItem {

    const now = new Date().toISOString();

    return {

        id: String(legacy.id),

        title: legacy.title,

        prompt: legacy.content,

        negativePrompt: "",

        createdAt: now,

        updatedAt: now,

    };

}

/**
 * Never trust localStorage blindly - stale/legacy-shaped data must fall
 * back to a default instead of being used as-is (see ProjectStorage for
 * the same rule applied to Project data).
 */
function isValidPromptItem(value: unknown): value is PromptItem {

    if (
        !value ||
        typeof value !== "object"
    )
        return false;

    const item = value as PromptItem;

    return (
        typeof item.id === "string" &&
        typeof item.title === "string" &&
        typeof item.prompt === "string" &&
        typeof item.negativePrompt === "string" &&
        typeof item.createdAt === "string" &&
        typeof item.updatedAt === "string"
    );

}

function loadPersistedPrompts(): PromptItem[] | null {

    const saved = localStorage.getItem(STORAGE_KEY);

    if (!saved)
        return null;

    try {

        const parsed = JSON.parse(saved) as unknown;

        if (
            !Array.isArray(parsed) ||
            !parsed.every(isValidPromptItem)
        )
            return null;

        return parsed;

    }
    catch {

        return null;

    }

}

class PromptStoreImpl {

    private items: PromptItem[] =
        loadPersistedPrompts() ??
        (legacyPrompts as LegacyPromptItem[]).map(migrateLegacyPrompt);

    private persist(): void {

        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(this.items)
        );

    }

    getAll(): PromptItem[] {

        return this.items;

    }

    getById(id: string): PromptItem | undefined {

        return this.items.find(item => item.id === id);

    }

    /**
     * Appends to the end, preserving display order for everything already
     * in the library.
     */
    create(draft: PromptDraft): PromptItem {

        const now = new Date().toISOString();

        const item: PromptItem = {

            id: crypto.randomUUID(),

            title: draft.title,

            prompt: draft.prompt,

            negativePrompt: draft.negativePrompt,

            createdAt: now,

            updatedAt: now,

        };

        this.items = [...this.items, item];

        this.persist();

        return item;

    }

    /**
     * Updates in place (does not move the entry), preserving display order.
     */
    update(id: string, draft: PromptDraft): PromptItem | undefined {

        let updated: PromptItem | undefined;

        this.items = this.items.map(existing => {

            if (existing.id !== id)
                return existing;

            updated = {

                ...existing,

                title: draft.title,

                prompt: draft.prompt,

                negativePrompt: draft.negativePrompt,

                updatedAt: new Date().toISOString(),

            };

            return updated;

        });

        if (updated)
            this.persist();

        return updated;

    }

    remove(id: string): void {

        this.items = this.items.filter(item => item.id !== id);

        this.persist();

    }

}

const PromptStore = new PromptStoreImpl();

export default PromptStore;

// ============================================================================
// End of File
// ============================================================================
