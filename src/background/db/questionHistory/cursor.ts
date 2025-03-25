import { HistoryItem } from "../../../types";

export class DBCursor {
    static async iterateBackwards(
        store: IDBObjectStore,
        callback: (value: HistoryItem) => Promise<void> | void,
        shouldContinue: (value: HistoryItem) => boolean = () => true
    ): Promise<void> {
        return new Promise((resolve, reject) => {
            const request = store.openCursor(null, "prev");

            request.onsuccess = async event => {
                const cursor = (event.target as IDBRequest).result;
                if (cursor && shouldContinue(cursor.value)) {
                    await callback(cursor.value);
                    cursor.continue();
                } else {
                    resolve();
                }
            };

            request.onerror = () => reject(request.error);
        });
    }

    static async findAndUpdate(
        store: IDBObjectStore,
        predicate: (item: HistoryItem) => boolean,
        update: Partial<HistoryItem>
    ): Promise<void> {
        return new Promise((resolve, reject) => {
            const request = store.openCursor(null, "prev");

            request.onsuccess = event => {
                const cursor = (event.target as IDBRequest).result;
                if (cursor) {
                    if (predicate(cursor.value)) {
                        const updatedItem = { ...cursor.value, ...update };
                        cursor.update(updatedItem);
                        resolve();
                    } else {
                        cursor.continue();
                    }
                } else {
                    reject(new Error("No matching item found"));
                }
            };

            request.onerror = () => reject(request.error);
        });
    }
} 