// ============================================================================
// File : src/utils/fileUrl.ts
// ============================================================================

/**
 * Converts an absolute disk path (as returned by the download/verify IPC
 * handlers) into a file:// URL an <img> tag can load.
 */
export function toFileUrl(filePath: string): string {

    return "file:///" + encodeURI(filePath.replace(/\\/g, "/"));

}

// ============================================================================
// End of File
// ============================================================================
