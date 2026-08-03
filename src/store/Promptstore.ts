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
    PromptExportItem,
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
 * back to a default instead of being used as-is.
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

/**
 * Settings > Prompt Library Backup > Import: never trust a file picked
 * off disk blindly, same reasoning as `isValidPromptItem` above for
 * localStorage - a hand-edited or unrelated JSON file must be rejected
 * outright instead of partially imported.
 */
export function isValidExportPayload(value: unknown): value is PromptExportItem[] {

    if (!Array.isArray(value))
        return false;

    return value.every(entry =>
        entry &&
        typeof entry === "object" &&
        typeof (entry as PromptExportItem).title === "string" &&
        typeof (entry as PromptExportItem).prompt === "string" &&
        typeof (entry as PromptExportItem).negativePrompt === "string"
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

    /**
     * Settings > Prompt Library Backup > Export - only Title/Prompt/
     * Negative Prompt, per spec (no id/timestamps, those are re-assigned
     * fresh on import).
     */
    exportPayload(): PromptExportItem[] {

        return this.items.map(({ title, prompt, negativePrompt }) => ({
            title,
            prompt,
            negativePrompt,
        }));

    }

    /**
     * Settings > Prompt Library Backup > Import. `duplicateStrategy`
     * applies uniformly to every incoming title that collides with an
     * existing one - the caller resolves this once per import (see
     * Settings.tsx), not once per conflicting prompt, to keep the UI
     * simple. Non-colliding incoming prompts are always added
     * regardless of the chosen strategy - a user's prompts are never
     * lost by importing.
     */
    importPayload(
        incoming: PromptExportItem[],
        duplicateStrategy: "replace" | "keep" | "rename"
    ): void {

        const now = new Date().toISOString();

        const items = [...this.items];

        for (const entry of incoming) {

            const existingIndex = items.findIndex(
                item => item.title === entry.title
            );

            if (existingIndex === -1) {

                items.push({
                    id: crypto.randomUUID(),
                    title: entry.title,
                    prompt: entry.prompt,
                    negativePrompt: entry.negativePrompt,
                    createdAt: now,
                    updatedAt: now,
                });

                continue;

            }

            if (duplicateStrategy === "keep")
                continue;

            if (duplicateStrategy === "replace") {

                items[existingIndex] = {
                    ...items[existingIndex],
                    prompt: entry.prompt,
                    negativePrompt: entry.negativePrompt,
                    updatedAt: now,
                };

                continue;

            }

            // rename: keep the existing prompt untouched, add the
            // incoming one under a de-duplicated title instead.
            let n = 2;

            let renamedTitle = `${entry.title} (${n})`;

            while (items.some(item => item.title === renamedTitle)) {

                n++;

                renamedTitle = `${entry.title} (${n})`;

            }

            items.push({
                id: crypto.randomUUID(),
                title: renamedTitle,
                prompt: entry.prompt,
                negativePrompt: entry.negativePrompt,
                createdAt: now,
                updatedAt: now,
            });

        }

        this.items = items;

        this.persist();

    }

}

const PromptStore = new PromptStoreImpl();

export default PromptStore;

// ============================================================================
// End of File
// ============================================================================
