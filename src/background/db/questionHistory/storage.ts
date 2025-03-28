import Config from "../../../config";
import { BackgroundActions } from "../../../constants";
import { HistoryItem } from "../../../types";
import { DBConnection } from "./connection";
import { DBCursor } from "./cursor";

const MAX_ITEMS = Config.MAX_HISTORY_SIZE;

class HistoryStorage {
    private static async notifyHistoryChanged(): Promise<void> {
        return new Promise(resolve => {
            chrome.runtime.sendMessage({ action: BackgroundActions.HISTORY_CHANGED }, () => {
                if (chrome.runtime.lastError) {
                    const message = chrome.runtime.lastError.message;

                    // when options page is not open, the receiver does not exist
                    // this is not an error, so we can resolve the promise
                    if (
                        message ===
                            "Could not establish connection. Receiving end does not exist." ||
                        message === "The message port closed before a response was received."
                    ) {
                        resolve();
                        return;
                    }

                    // This is the correct place to catch "receiving end does not exist"
                    console.warn("Error sending history changed message:", message);
                }
                resolve();
            });
        });
    }

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

            await this.notifyHistoryChanged();
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

    /**
     * Retrieves history items with pagination support for infinite scrolling.
     * Items are returned in reverse chronological order (newest first).
     *
     * @param pageSize - Number of items to fetch per page
     * @param lastTimestamp - Optional timestamp in milliseconds to fetch items before.
     *                         If not provided, fetches the most recent items.
     *                         If provided, fetches items older than this timestamp.
     *
     * @returns Promise resolving to an object containing:
     *          - items: Array of history items for the current page
     *          - hasMore: Boolean indicating if there are more items to load
     *
     * @example
     * // First page
     * const firstPage = await getItemsWithPagination(20);
     *
     * // Next page (if hasMore is true)
     * const lastItem = firstPage.items[firstPage.items.length - 1];
     * const nextPage = await getItemsWithPagination(20, Date.parse(lastItem.timestamp));
     */
    static async getItemsWithPagination(
        pageSize: number,
        lastTimestamp?: number
    ): Promise<{ items: HistoryItem[]; hasMore: boolean }> {
        return DBConnection.withTransaction("readonly", async store => {
            const items: HistoryItem[] = [];
            let hasMore = true;

            await DBCursor.iterateBackwards(
                store,
                value => {
                    if (items.length < pageSize) {
                        if (!lastTimestamp || Date.parse(value.timestamp) < lastTimestamp) {
                            items.push(value);
                        }
                    } else {
                        hasMore = false;
                    }
                },
                () => items.length < pageSize
            );

            return { items, hasMore };
        });
    }

    static async updateLastItem(
        predicate: (item: HistoryItem) => boolean,
        update: Partial<HistoryItem>
    ): Promise<void> {
        return DBConnection.withTransaction("readwrite", async store => {
            await DBCursor.findAndUpdate(store, predicate, update);
            await this.notifyHistoryChanged();
        });
    }

    static async clearHistory(): Promise<void> {
        return DBConnection.withTransaction("readwrite", async store => {
            await new Promise<void>((resolve, reject) => {
                const request = store.clear();
                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
            });
            await this.notifyHistoryChanged();
        });
    }
}

export default HistoryStorage;
