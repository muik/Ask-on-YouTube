/**
 * Simple LRU Cache
 */
export class LRUCache {
    constructor(capacity) {
        if (!Number.isInteger(capacity) || capacity <= 0) {
            throw new Error("Capacity must be a positive integer.");
        }
        this.capacity = capacity; // Maximum size of the cache
        this.cache = new Map(); // Store the cache data
    }

    /**
     * Retrieves the value for a given key.
     * Moves the key to the end to mark it as recently used.
     * @param {any} key - The key to retrieve.
     * @returns {any} The value associated with the key, or undefined if not found.
     */
    get(key) {
        if (!this.cache.has(key)) {
            return undefined;
        }
        const value = this.cache.get(key);
        this._makeRecent(key, value);
        return value;
    }

    /**
     * Adds or updates a key-value pair in the cache.
     * If the cache exceeds its capacity, removes the least recently used item.
     * @param {any} key - The key to add or update.
     * @param {any} value - The value to associate with the key.
     */
    put(key, value) {
        if (this.cache.has(key)) {
            this.cache.delete(key); // Update position for existing key
        } else if (this.cache.size >= this.capacity) {
            this._evictLeastRecentlyUsed();
        }
        this.cache.set(key, value);
    }

    /**
     * Checks if the cache contains a key.
     * @param {any} key - The key to check.
     * @returns {boolean} True if the key exists, false otherwise.
     */
    has(key) {
        return this.cache.has(key);
    }

    /**
     * Helper to mark a key-value pair as recently used.
     * @param {any} key - The key to move to the end.
     * @param {any} value - The associated value.
     * @private
     */
    _makeRecent(key, value) {
        this.cache.delete(key);
        this.cache.set(key, value);
    }

    /**
     * Helper to evict the least recently used item.
     * @private
     */
    _evictLeastRecentlyUsed() {
        const leastUsedKey = this.cache.keys().next().value;
        this.cache.delete(leastUsedKey);
    }
}
