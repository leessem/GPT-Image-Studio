// ============================================================================
// File : src/store/WorkTypeStore.ts
//
// Single source of truth for the user-managed Work Type list (Settings >
// Work Type Management). Same shape/persistence pattern as PromptStore -
// a plain singleton backed by localStorage, mutated only through this
// store's own methods, re-read by the UI after every mutation since the
// singleton can't trigger a React re-render on its own.
// ============================================================================

import { WorkType, WorkTypeDraft } from "../types/WorkType";

const STORAGE_KEY = "gpt-image-studio-work-types";

/**
 * Never trust localStorage blindly - stale/legacy-shaped data must fall
 * back to an empty list instead of being used as-is (same reasoning as
 * PromptStore.isValidPromptItem).
 */
function isValidWorkType(value: unknown): value is WorkType {

    if (
        !value ||
        typeof value !== "object"
    )
        return false;

    const item = value as WorkType;

    return (
        typeof item.id === "string" &&
        typeof item.displayName === "string" &&
        typeof item.filenamePrefix === "string" &&
        typeof item.enabled === "boolean"
    );

}

function loadPersistedWorkTypes(): WorkType[] {

    const saved = localStorage.getItem(STORAGE_KEY);

    if (!saved)
        return [];

    try {

        const parsed = JSON.parse(saved) as unknown;

        if (
            !Array.isArray(parsed) ||
            !parsed.every(isValidWorkType)
        )
            return [];

        return parsed;

    }
    catch {

        return [];

    }

}

class WorkTypeStoreImpl {

    private items: WorkType[] = loadPersistedWorkTypes();

    private persist(): void {

        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(this.items)
        );

    }

    getAll(): WorkType[] {

        return this.items;

    }

    getById(id: string): WorkType | undefined {

        return this.items.find(item => item.id === id);

    }

    /**
     * Appends to the end, preserving display order for everything
     * already in the list. New Work Types start enabled.
     */
    create(draft: WorkTypeDraft): WorkType {

        const item: WorkType = {

            id: crypto.randomUUID(),

            displayName: draft.displayName,

            filenamePrefix: draft.filenamePrefix,

            enabled: true,

        };

        this.items = [...this.items, item];

        this.persist();

        return item;

    }

    /**
     * Updates in place (does not move the entry or change enabled
     * state), preserving display order.
     */
    update(id: string, draft: WorkTypeDraft): WorkType | undefined {

        let updated: WorkType | undefined;

        this.items = this.items.map(existing => {

            if (existing.id !== id)
                return existing;

            updated = {

                ...existing,

                displayName: draft.displayName,

                filenamePrefix: draft.filenamePrefix,

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

    setEnabled(id: string, enabled: boolean): void {

        this.items = this.items.map(item =>
            item.id === id ? { ...item, enabled } : item
        );

        this.persist();

    }

    /**
     * Swaps a Work Type with its neighbor in the display order -
     * simple, reliable reordering without a drag-and-drop dependency.
     * A no-op at either end of the list.
     */
    moveUp(id: string): void {

        const index = this.items.findIndex(item => item.id === id);

        if (index <= 0)
            return;

        const next = [...this.items];

        [next[index - 1], next[index]] = [next[index], next[index - 1]];

        this.items = next;

        this.persist();

    }

    moveDown(id: string): void {

        const index = this.items.findIndex(item => item.id === id);

        if (index === -1 || index >= this.items.length - 1)
            return;

        const next = [...this.items];

        [next[index + 1], next[index]] = [next[index], next[index + 1]];

        this.items = next;

        this.persist();

    }

}

const WorkTypeStore = new WorkTypeStoreImpl();

export default WorkTypeStore;

// ============================================================================
// End of File
// ============================================================================
