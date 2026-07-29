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

}