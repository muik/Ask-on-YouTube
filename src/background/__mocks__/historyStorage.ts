import { HistoryItem } from "../../types";

class MockHistoryStorage {
    private static store: Map<string, HistoryItem[]> = new Map();
    private static db: any = {
        transaction: jest.fn().mockReturnThis(),
        objectStore: jest.fn().mockReturnThis(),
        add: jest.fn(),
        get: jest.fn(),
        getAll: jest.fn(),
        clear: jest.fn(),
        openCursor: jest.fn(),
    };

    static async getDB(): Promise<any> {
        return this.db;
    }

    static async saveItem(item: HistoryItem): Promise<void> {
        const items = this.store.get("questionHistory") || [];
        items.push(item);
        this.store.set("questionHistory", items);
    }

    static async getItems(count: number): Promise<HistoryItem[]> {
        const items = this.store.get("questionHistory") || [];
        return items.slice(-count);
    }

    static async updateLastItem(predicate: (item: HistoryItem) => boolean, update: Partial<HistoryItem>): Promise<void> {
        const items = this.store.get("questionHistory") || [];
        for (let i = items.length - 1; i >= 0; i--) {
            if (predicate(items[i])) {
                items[i] = { ...items[i], ...update };
                this.store.set("questionHistory", items);
                return;
            }
        }
        throw new Error("No matching item found");
    }

    static async clearHistory(): Promise<void> {
        this.store.delete("questionHistory");
    }

    static reset(): void {
        this.store.clear();
        this.db = {
            transaction: jest.fn().mockReturnThis(),
            objectStore: jest.fn().mockReturnThis(),
            add: jest.fn(),
            get: jest.fn(),
            getAll: jest.fn(),
            clear: jest.fn(),
            openCursor: jest.fn(),
        };
    }
}

export default MockHistoryStorage; 