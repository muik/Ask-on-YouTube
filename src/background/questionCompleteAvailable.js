import { isGeminiAvailable } from "./geminiApi.js";
import { getApiKey } from "./settingsLoader.js";

const QUESTION_COMPLETE_CACHE_KEY = "questionCompleteAvailableCache";
const MAX_CACHE_ENTRIES = 10;

function getQuestionCompleteCached(apiKey) {
    return new Promise((resolve) => {
        chrome.storage.local.get([QUESTION_COMPLETE_CACHE_KEY], (result) => {
            const caches = result[QUESTION_COMPLETE_CACHE_KEY] || {};

            if (!apiKey) {
                throw new Error("API key is required");
            }

            const cached = caches[apiKey];

            if (!cached) {
                resolve(null);
                return;
            }

            const { value, expireAt } = cached;
            if (Date.now() > expireAt) {
                // Remove expired cache
                delete caches[apiKey];
                chrome.storage.local.set({
                    [QUESTION_COMPLETE_CACHE_KEY]: caches,
                });
                resolve(null);
                return;
            }

            resolve(value);
        });
    });
}

function setQuestionCompleteCache(value, apiKey) {
    return new Promise((resolve) => {
        chrome.storage.local.get([QUESTION_COMPLETE_CACHE_KEY], (result) => {
            const caches = result[QUESTION_COMPLETE_CACHE_KEY] || {};

            if (!apiKey) {
                throw new Error("API key is required");
            }

            const expireAt = Date.now() + 24 * 60 * 60 * 1000; // 1 day in milliseconds

            // Remove expired caches
            Object.entries(caches).forEach(([key, cache]) => {
                if (Date.now() > cache.expireAt) {
                    delete caches[key];
                }
            });

            // If we still have too many caches after removing expired ones,
            // remove the oldest ones until we're under the limit
            const cacheKeys = Object.keys(caches);
            if (cacheKeys.length >= MAX_CACHE_ENTRIES && !caches[apiKey]) {
                delete caches[cacheKeys[0]]; // Remove oldest cache
            }

            // Add new cache
            caches[apiKey] = { value, expireAt };

            chrome.storage.local.set(
                { [QUESTION_COMPLETE_CACHE_KEY]: caches },
                resolve
            );
        });
    });
}

/**
 * Clear the cache for a specific API key
 * @param {string} apiKey - The API key to clear cache for
 * @returns {Promise<void>}
 */
export async function clearQuestionCompleteCache(apiKey) {
    if (!apiKey) {
        return;
    }

    const result = await chrome.storage.local.get([
        QUESTION_COMPLETE_CACHE_KEY,
    ]);
    const caches = result[QUESTION_COMPLETE_CACHE_KEY] || {};

    if (!caches[apiKey]) {
        return;
    }

    delete caches[apiKey];
    await chrome.storage.local.set({
        [QUESTION_COMPLETE_CACHE_KEY]: caches,
    });
}

/**
 * Get the question complete available
 * @param {Function} sendResponse - The send response function
 * @returns {boolean} - Whether the response will be sent asynchronously
 */
export function getQuestionCompleteAvailable(sendResponse) {
    getApiKey().then((apiKey) => {
        if (!apiKey) {
            sendResponse({
                isAvailable: false,
            });
            return;
        }

        getQuestionCompleteCached(apiKey).then((cached) => {
            if (cached !== null) {
                sendResponse({
                    isAvailable: cached,
                });
                return;
            }

            isGeminiAvailable(apiKey).then((isAvailable) => {
                setQuestionCompleteCache(isAvailable, apiKey);
                sendResponse({
                    isAvailable,
                });
            });
        });
    });
    return true;
}
