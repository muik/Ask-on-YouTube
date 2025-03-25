import Config from "../../../config";
import { HistoryItem } from "../../../types";
import { DBConnection } from "./connection";
import { DBCursor } from "./cursor";

const MAX_ITEMS = Config.MAX_HISTORY_SIZE;

class HistoryStorage {
    static async saveItem(item: HistoryItem): Promise<void> {
        return DBConnection.withTransaction("readwrite", async store => {
            await new Promise<void>((resolve, reject) => {
                const addRequest = store.add(item);
                addRequest.onsuccess = () => resolve();
                addRequest.onerror = () => reject(addRequest.error);
            });

            const count = await new Promise<number>((resolve, reject) => {
                const countRequest = store.count();
                countRequest.onsuccess = () => resolve(countRequest.result);
                countRequest.onerror = () => reject(countRequest.error);
            });

            if (count > MAX_ITEMS) {
                let deleted = 0;
                await DBCursor.iterateBackwards(store, async value => {
                    if (deleted < count - MAX_ITEMS) {
                        await new Promise<void>((resolve, reject) => {
                            const deleteRequest = store.delete(value.timestamp);
                            deleteRequest.onsuccess = () => resolve();
                            deleteRequest.onerror = () => reject(deleteRequest.error);
                        });
                        deleted++;
                    }
                });
            }
        });
    }

    static async getItems(count: number): Promise<HistoryItem[]> {
        return DBConnection.withTransaction("readonly", async store => {
            const items: HistoryItem[] = [];
            await DBCursor.iterateBackwards(
                store,
                value => {
                    if (items.length < count) {
                        items.push(value);
                    }
                },
                () => items.length < count
            );
            return items;
        });
    }

    static async updateLastItem(
        predicate: (item: HistoryItem) => boolean,
        update: Partial<HistoryItem>
    ): Promise<void> {
        return DBConnection.withTransaction("readwrite", async store => {
            await DBCursor.findAndUpdate(store, predicate, update);
        });
    }

    static async clearHistory(): Promise<void> {
        return DBConnection.withTransaction("readwrite", async store => {
            await new Promise<void>((resolve, reject) => {
                const request = store.clear();
                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
            });
        });
    }
}

export default HistoryStorage; 