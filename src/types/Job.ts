export type JobStatus =
    | "waiting"
    | "running"
    | "done"
    | "error";

export interface Job {

    id: string;

    prompt: string;

    status: JobStatus;

    imagePath?: string;

    createdAt: string;

    completedAt?: string;

    /**
     * Job-first architecture: each Job owns a reference image the user
     * attaches to it. Stored as a data: URL (renderer-only, no disk file) -
     * the automation engine does not attach this to ChatGPT yet, it is
     * UI/record-keeping only.
     */
    uploadedImagePath?: string;

    /**
     * Id of the PromptStore template this Job's `prompt` text was copied
     * from, so the UI can show/re-select which library template a Job is
     * using. `prompt` itself remains the literal text QueueRunner submits -
     * this field never feeds the automation directly.
     */
    selectedPromptId?: string;

    /**
     * The ChatGPT conversation URL (e.g. https://chatgpt.com/c/<id>) this
     * Job's own conversation lives at, captured once ChatGPT creates it
     * after this Job's first successful send. All Jobs share one browser
     * partition/login - this is what keeps each Job's conversation
     * independent from the others within that one shared session.
     * Undefined until the Job has generated at least once.
     */
    conversationUrl?: string;

}
