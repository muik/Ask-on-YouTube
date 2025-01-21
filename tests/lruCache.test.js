import { LRUCache } from "../src/background/lruCache.js";

describe("LRUCache", () => {
    test("initialization should throw an error for invalid capacity", () => {
        expect(() => new LRUCache(0)).toThrow(
            "Capacity must be a positive integer."
        );
        expect(() => new LRUCache(-1)).toThrow(
            "Capacity must be a positive integer."
        );
        expect(() => new LRUCache("not a number")).toThrow(
            "Capacity must be a positive integer."
        );
    });

    test("should add and retrieve items correctly", () => {
        const cache = new LRUCache(2);

        cache.put("a", 1);
        expect(cache.get("a")).toBe(1);

        cache.put("b", 2);
        expect(cache.get("b")).toBe(2);
        expect(cache.get("a")).toBe(1); // 'a' should still be in the cache
    });

    test("should return undefined for non-existent keys", () => {
        const cache = new LRUCache(2);

        expect(cache.get("non-existent")).toBeUndefined();
    });

    test("should evict the least recently used item when capacity is exceeded", () => {
        const cache = new LRUCache(2);

        cache.put("a", 1);
        cache.put("b", 2);
        cache.put("c", 3); // This should evict 'a'

        expect(cache.get("a")).toBeUndefined(); // 'a' was evicted
        expect(cache.get("b")).toBe(2);
        expect(cache.get("c")).toBe(3);
    });

    test("should update an existing key and mark it as recently used", () => {
        const cache = new LRUCache(2);

        cache.put("a", 1);
        cache.put("b", 2);
        cache.put("a", 3); // Update 'a'

        expect(cache.get("a")).toBe(3); // Value of 'a' should be updated
        cache.put("c", 4); // This should evict 'b'

        expect(cache.get("b")).toBeUndefined(); // 'b' was evicted
        expect(cache.get("c")).toBe(4);
    });

    test("should correctly check if a key exists", () => {
        const cache = new LRUCache(2);

        cache.put("a", 1);
        expect(cache.has("a")).toBe(true);
        expect(cache.has("b")).toBe(false);

        cache.put("b", 2);
        cache.put("c", 3); // Evicts 'a'

        expect(cache.has("a")).toBe(false); // 'a' was evicted
        expect(cache.has("b")).toBe(true);
    });
});
