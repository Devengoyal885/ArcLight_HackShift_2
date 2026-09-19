export class BaseRepository<T extends { id: string }> {
    private storageKey: string;

    constructor(storageKey: string) {
        this.storageKey = storageKey;
        // Initialize to empty array if nothing exists
        if (!localStorage.getItem(this.storageKey)) {
            localStorage.setItem(this.storageKey, JSON.stringify([]));
        }
    }

    public getAll(): T[] {
        try {
            const data = localStorage.getItem(this.storageKey);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.error(`Error reading ${this.storageKey} from localStorage`, e);
            return [];
        }
    }

    public getById(id: string): T | null {
        const items = this.getAll();
        return items.find((item) => item.id === id) || null;
    }

    public getBy(predicate: (item: T) => boolean): T[] {
        return this.getAll().filter(predicate);
    }

    public save(item: T): void {
        const items = this.getAll();
        const existingIndex = items.findIndex((i) => i.id === item.id);
        if (existingIndex >= 0) {
            items[existingIndex] = item;
        } else {
            items.push(item);
        }
        localStorage.setItem(this.storageKey, JSON.stringify(items));
    }

    public saveMultiple(newItems: T[]): void {
        const items = this.getAll();
        newItems.forEach(item => {
            const existingIndex = items.findIndex((i) => i.id === item.id);
            if (existingIndex >= 0) {
                items[existingIndex] = item;
            } else {
                items.push(item);
            }
        });
        localStorage.setItem(this.storageKey, JSON.stringify(items));
    }

    public delete(id: string): void {
        const items = this.getAll();
        const newItems = items.filter((i) => i.id !== id);
        localStorage.setItem(this.storageKey, JSON.stringify(newItems));
    }

    // Helper for seeding data without appending duplicates
    public overwriteAll(items: T[]): void {
        localStorage.setItem(this.storageKey, JSON.stringify(items));
    }
}
