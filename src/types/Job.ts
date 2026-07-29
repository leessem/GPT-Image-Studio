export interface Job {

    id:number;

    title:string;

    prompt:string;

    images:string[];

    status:"idle"|"running"|"completed";

}