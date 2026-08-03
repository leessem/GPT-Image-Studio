// ============================================================================
// File : src/types/WorkType.ts
//
// A user-managed "kind of job" (e.g. a photo studio's 만삭/신생아/50일
// categories) - each Workspace picks at most one, and its filenamePrefix
// gets inserted between the global filename Prefix and the Prompt Title
// when building the saved image's filename (see generate.ts/main.ts).
// ============================================================================

export interface WorkType {

    id: string;

    displayName: string;

    filenamePrefix: string;

    enabled: boolean;

}

/**
 * Fields the Settings > Work Type Management form collects for
 * Add/Edit - everything about a WorkType except its identity (id) and
 * enabled state, which WorkTypeStore is responsible for.
 */
export interface WorkTypeDraft {

    displayName: string;

    filenamePrefix: string;

}

// ============================================================================
// End of File
// ============================================================================
