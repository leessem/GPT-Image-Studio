import { Job } from "../types/Job";

export const defaultJobs: Job[] = [
    {
        id: crypto.randomUUID(),
        prompt: "Ultra realistic portrait, 8k, masterpiece",
        status: "waiting",
        createdAt: new Date().toISOString(),
    },
];