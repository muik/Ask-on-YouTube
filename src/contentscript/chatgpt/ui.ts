export const SELECTORS = {
    PROMPT_TEXTAREA: "#prompt-textarea",
    SEND_BUTTON: "button[data-testid='send-button']",
    SEND_BUTTON_NOT_DISABLED: "button[data-testid='send-button']:not([disabled])",
    SPEECH_BUTTON: "button[data-testid='composer-speech-button']",
    NEW_CHAT_BUTTON: "[data-testid='create-new-chat-button']",
    NEW_CHAT_BUTTON_IN_CLOSED_SIDEBAR:
        "main div.items-center > span.flex[data-state='closed']:nth-child(2) > *",
    ERROR_RESPONSE_ARTICLE:
        'article[data-testid="conversation-turn-2"] button[data-testid="regenerate-thread-error-button"]',
    LOGIN_BUTTON: 'button[data-testid="login-button"]',
    MOBILE_LOGIN_BUTTON: 'button[data-testid="mobile-login-button"]',
} as const;

/**
 * Checks if the error response article is present in the document.
 * when prompt too long, chatgpt will show a error response article
 *
 * @returns {boolean} - True if the error response article is present, false otherwise
 */
export function hasErrorResponseArticle(): boolean {
    return document.querySelector(SELECTORS.ERROR_RESPONSE_ARTICLE) !== null;
}

/**
 * Get the new chat button.
 *
 * @returns {Element | null} - The new chat button or null if not found
 */
export function getNewChatButton(): Element | null {
    return (
        document.querySelector(SELECTORS.NEW_CHAT_BUTTON) ||
        document.querySelector(SELECTORS.NEW_CHAT_BUTTON_IN_CLOSED_SIDEBAR)
    );
}

/**
 * Checks if the user is not logged in by looking for login buttons.
 *
 * @returns {boolean} - True if the user is not logged in, false otherwise
 */
export function isNotLogin(): boolean {
    return (
        document.querySelector(SELECTORS.LOGIN_BUTTON) !== null ||
        document.querySelector(SELECTORS.MOBILE_LOGIN_BUTTON) !== null
    );
}
