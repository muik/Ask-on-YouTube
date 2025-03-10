/**
 * Interface representing the structure of a localized message in Chrome extension.
 * This follows Chrome's i18n message format specification.
 * @see https://developer.chrome.com/docs/extensions/reference/i18n/
 *
 * @interface MessageData
 * @property {string} message - The actual message text content
 * @property {string} [description] - Optional description providing context about the message
 * @property {Record<string, {content: string, example?: string}>} [placeholders] - Optional key-value pairs for variable substitution
 *           where key is the placeholder name and value contains the replacement content and optional example
 */
interface MessageData {
    message: string;
    description?: string;
    placeholders?: Record<
        string,
        {
            content: string;
            example?: string;
        }
    >;
}

/** Default language code to fall back to when requested language is not available */
const DEFAULT_LANG = "en";

/**
 * Interface for caching messages by language.
 * Acts as a two-level dictionary where:
 * - First level key is the language code (e.g., 'en', 'ko')
 * - Second level key is the message name mapping to its MessageData
 *
 * @interface MessagesCache
 */
interface MessagesCache {
    [key: string]: Record<string, MessageData>;
}

/**
 * Options for message retrieval operations.
 *
 * @interface MessageOptions
 * @property {string} [lang] - Optional language code to retrieve messages in (defaults to DEFAULT_LANG)
 */
interface MessageOptions {
    lang?: string;
}

/** In-memory cache for storing loaded messages by language to avoid repeated file reads */
let messageCache: MessagesCache = {};

/**
 * Custom error class to track fallback attempts
 */
class MessageLoadError extends Error {
    constructor(
        message: string,
        public readonly lang: string,
        public readonly isAfterFallback: boolean = false
    ) {
        super(message);
        this.name = 'MessageLoadError';
    }
}

/**
 * Load messages for a specific language
 * @param {string} lang - Language code (e.g., 'en', 'ko')
 * @returns {Promise<Record<string, MessageData>>} - Messages object or empty object if language not found
 */
async function loadMessages(lang: string): Promise<Record<string, MessageData>> {
    // Check cache first
    if (messageCache[lang]) {
        return messageCache[lang];
    }

    try {
        const url = chrome.runtime.getURL(`_locales/${lang}/messages.json`);
        const response = await fetch(url);
        
        // Return empty object only for 404 (not found)
        if (response.status === 404) {
            return {};
        }
        
        if (!response.ok) {
            throw new Error(`Failed to load messages for language ${lang}: HTTP ${response.status}`);
        }
        
        const messages: Record<string, MessageData> = await response.json();
        messageCache[lang] = messages;
        return messages;
    } catch (error) {
        // Re-throw any other errors
        throw new Error(`Error loading messages for ${lang}: ${(error as Error).message}`);
    }
}

/**
 * Get multiple messages at once from the locale files with caching
 * @param {string[]} messageNames - Array of message names to retrieve
 * @param {MessageOptions} options - Options object
 * @returns {Promise<string[]>} - Array of message strings in the same order
 */
export async function getMessages(
    messageNames: string[],
    options: MessageOptions = {}
): Promise<string[]> {
    const lang = options.lang || DEFAULT_LANG;
    let messages: Record<string, MessageData>;
    let defaultMessages: Record<string, MessageData> | null = null;

    try {
        messages = await loadMessages(lang);
        // Load default messages if we're not already using the default language
        if (lang !== DEFAULT_LANG) {
            defaultMessages = await loadMessages(DEFAULT_LANG);
        }
    } catch (error) {
        if (error instanceof MessageLoadError && error.isAfterFallback) {
            throw error; // Propagate the error if fallback was already attempted
        }
        throw error;
    }

    return messageNames.map((messageName) => {
        // First try to get message in requested language
        if (messages[messageName]) {
            return messages[messageName].message;
        }

        // If message not found and we have default messages, try those
        if (defaultMessages && defaultMessages[messageName]) {
            console.warn(
                `Message "${messageName}" not found for language "${lang}", using default language "${DEFAULT_LANG}"`
            );
            return defaultMessages[messageName].message;
        }

        // If still not found, return the message name as fallback
        console.warn(
            `Message "${messageName}" not found for language "${lang}" or default language "${DEFAULT_LANG}"`
        );
        return messageName;
    });
}

/**
 * Get a single message (uses getMessages internally for consistency)
 * @param {string} messageName - The name of the message to retrieve
 * @param {MessageOptions} options - Options object
 * @returns {Promise<string>} - The message string
 */
export async function getMessage(
    messageName: string,
    options: MessageOptions = {}
): Promise<string> {
    const [message] = await getMessages([messageName], options);
    return message;
}

// Clear cache when the extension is updated or reloaded
chrome.runtime.onInstalled.addListener(() => {
    messageCache = {};
});
