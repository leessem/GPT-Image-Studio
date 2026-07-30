import { Job } from "../types/Job";

export const defaultJobs: Job[] = [

    {
        id: crypto.randomUUID(),
        prompt: "Ultra realistic portrait, 8k, masterpiece",
        status: "waiting",
        createdAt: new Date().toISOString(),
    },

    {
        id: crypto.randomUUID(),
        prompt: "Anime style, best quality, masterpiece",
        status: "waiting",
        createdAt: new Date().toISOString(),
    },

    {
        id: crypto.randomUUID(),
        prompt: "Cinematic photography, dramatic lighting",
        status: "waiting",
        createdAt: new Date().toISOString(),
    },

    {
        id: crypto.randomUUID(),
        prompt: "Fantasy landscape, ultra detailed",
        status: "waiting",
        createdAt: new Date().toISOString(),
    },

    {
        id: crypto.randomUUID(),
        prompt: "Luxury product photo, studio lighting",
        status: "waiting",
        createdAt: new Date().toISOString(),
    },

];