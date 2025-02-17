const appName = "Ask on YouTube";

export const Errors = {
    EXTENSION_CONTEXT_INVALIDATED: {
        message:
            "The Chrome extension has been updated. Please reload this page to use it.",
        code: "EXTENSION_CONTEXT_INVALIDATED",
    },
    INVALID_RESPONSE: {
        message: "Invalid response, please try again later.",
        code: "INVALID_RESPONSE",
    },
    INVALID_REQUEST: {
        message: "Invalid request, please try again later.",
        code: "INVALID_REQUEST",
    },
    TRANSCRIPT_NOT_FOUND: {
        message: "Video transcript not found. Required to ask the AI.",
        code: "TRANSCRIPT_NOT_FOUND",
    },
    FAILED_TO_LOAD_DEFAULT_QUESTION: {
        message: "Failed to load default question, please try again later.",
        code: "FAILED_TO_LOAD_DEFAULT_QUESTION",
    },
    FAILED_TO_LOAD_QUESTIONS: {
        message: "Failed to load questions, please try again later.",
        code: "FAILED_TO_LOAD_QUESTIONS",
    },
};

export const Info = {
    NO_RECENT_QUESTIONS: {
        message: "No recent questions",
        code: "NO_RECENT_QUESTIONS",
    },
    GOOGLE_CLOUD_API_KEY_NOT_SET: {
        message: `To get suggested questions, set GEMINI_API_KEY on <a href='#' class='settings'>settings</a> of ${appName}!`,
        code: "GOOGLE_CLOUD_API_KEY_NOT_SET",
    },
    GOOGLE_CLOUD_API_KEY_NOT_VALID: {
        message: `Invalid GEMINI_API_KEY. Please set a valid GEMINI_API_KEY on <a href='#' class='settings'>Settings</a> of ${appName}!`,
        code: "GOOGLE_CLOUD_API_KEY_NOT_VALID",
    },
};
