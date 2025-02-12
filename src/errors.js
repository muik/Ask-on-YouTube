import { showToastMessage } from "./contentscript/youtube/toast.js";

const appName = "Ask on YouTube";

export const Errors = {
    EXTENSION_CONTEXT_INVALIDATED: {
        message:
            "The Chrome extension has been updated. Please reload this page to use it.",
        code: "EXTENSION_CONTEXT_INVALIDATED",
    },
    GOOGLE_CLOUD_API_KEY_NOT_VALID: {
        message: `Invalid GEMINI_API_KEY. Please set a valid GEMINI_API_KEY on <a href='#' class='settings'>Settings</a> of ${appName}!`,
        code: "GOOGLE_CLOUD_API_KEY_NOT_VALID",
    },
    GOOGLE_CLOUD_API_KEY_NOT_SET: {
        message: `To get suggested questions, set GEMINI_API_KEY on <a href='#' class='settings'>settings</a> of ${appName}!`,
        code: "GOOGLE_CLOUD_API_KEY_NOT_SET",
    },
};

export function handleSendMessageError(error) {
    if (error.message === "Extension context invalidated.") {
        showToastMessage(Errors.EXTENSION_CONTEXT_INVALIDATED.message);
        return true;
    }
    return false;
}
