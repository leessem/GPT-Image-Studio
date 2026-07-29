import prompts from "../data/prompts.json";
import { PromptItem } from "../types/Prompt";

class PromptStore {

    private items: PromptItem[] = prompts;

    getAll() {
        return this.items;
    }

    add(item: PromptItem) {
        this.items.push(item);
    }

    remove(id: number) {
        this.items = this.items.filter(p => p.id !== id);
    }

    update(item: PromptItem) {

        const index = this.items.findIndex(p => p.id === item.id);

        if (index >= 0)
            this.items[index] = item;

    }

}

export default new PromptStore();