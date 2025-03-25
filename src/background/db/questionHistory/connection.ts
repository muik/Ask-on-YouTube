import { DB_NAME } from '../constants';

export const DB_VERSION = 1;
export const STORE_NAME = "questionHistory"; 

export class DBConnection {
    private static async getDB(): Promise<IDBDatabase> {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);

            request.onupgradeneeded = event => {
                const db = (event.target as IDBOpenDBRequest).result;
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    db.createObjectStore(STORE_NAME, { keyPath: "timestamp" });
                }
            };
        });
    }

    static async withTransaction<T>(
        mode: IDBTransactionMode,
        operation: (store: IDBObjectStore) => Promise<T>
    ): Promise<T> {
        const db = await this.getDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], mode);
            const store = transaction.objectStore(STORE_NAME);

            operation(store)
                .then(resolve)
                .catch(reject);

            transaction.onerror = () => reject(transaction.error);
        });
    }
} 