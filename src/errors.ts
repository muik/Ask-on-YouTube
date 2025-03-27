interface ErrorDefinition {
    message: string;
    code: string;
}

export const Errors: Record<string, ErrorDefinition> = {
    UNKNOWN_ERROR: {
        message: chrome.i18n.getMessage("unknownError"),
        code: "UNKNOWN_ERROR",
    },
    EXTENSION_CONTEXT_INVALIDATED: {
        message: chrome.i18n.getMessage("extensionContextInvalidatedError"),
        code: "EXTENSION_CONTEXT_INVALIDATED",
    },
    INVALID_RESPONSE: {
        message: chrome.i18n.getMessage("invalidResponseError"),
        code: "INVALID_RESPONSE",
    },
    INVALID_REQUEST: {
        message: chrome.i18n.getMessage("invalidRequestError"),
        code: "INVALID_REQUEST",
    },
    TRANSCRIPT_NOT_FOUND: {
        message: chrome.i18n.getMessage("transcriptNotFoundError"),
        code: "TRANSCRIPT_NOT_FOUND",
    },
    FAILED_TO_LOAD_DEFAULT_QUESTION: {
        message: chrome.i18n.getMessage("failedToLoadDefaultQuestionError"),
        code: "FAILED_TO_LOAD_DEFAULT_QUESTION",
    },
    FAILED_TO_LOAD_QUESTIONS: {
        message: chrome.i18n.getMessage("failedToLoadQuestionsError"),
        code: "FAILED_TO_LOAD_QUESTIONS",
    },
    GEMINI_API_KEY_NOT_VALID: {
        message: chrome.i18n.getMessage("geminiApiKeyNotValidError"),
        code: "GEMINI_API_KEY_NOT_VALID",
    },
    GEMINI_API_KEY_NOT_SET: {
        message: chrome.i18n.getMessage("geminiApiKeyNotSetError"),
        code: "GEMINI_API_KEY_NOT_SET",
    },
    GEMINI_API_UNAVAILABLE: {
        message: chrome.i18n.getMessage("geminiApiUnavailableError"),
        code: "GEMINI_API_UNAVAILABLE",
    },
    GEMINI_API_TIMEOUT: {
        message: chrome.i18n.getMessage("geminiApiTimeoutError"),
        code: "GEMINI_API_TIMEOUT",
    },
};

export const Info: Record<string, ErrorDefinition> = {
    NO_RECENT_QUESTIONS: {
        message: chrome.i18n.getMessage("noRecentQuestionsError"),
        code: "NO_RECENT_QUESTIONS",
    },
}; 