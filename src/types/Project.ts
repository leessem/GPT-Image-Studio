import { Job } from "./Job";

export interface Project {

    id: string;

    name: string;

    createdAt: string;

    updatedAt: string;

    jobs: Job[];

}